// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Payments through the shop's own provider keys (note 15 §11). The phone
// records the sale; the hub only moves the money conversation along.
//
//   paykey:paynow:USD   the shop's keys; never in a sheet, a log or a reply
//   pay:<reference>     one payment's state, kept a few days
//
// Two rules hold everywhere here:
// - Paid comes only from the provider's status check. A callback is a hint
//   that makes the hub check sooner.
// - A charge is never repeated. The reference is claimed before the provider
//   is called, so a retry gets the same record. If there was no usable reply,
//   the payment stays `unknown`: the seller looks at the customer's SMS.

var PAYMENT_DONE_ = ['paid', 'failed', 'cancelled'];
var PAYMENT_KEEP_SECONDS_ = 3 * 86400; // the Payment Callbacks tab is the lasting record
var PAYMENT_RECHECK_SECONDS_ = 3600;
var PAYMENT_PATTERNS_ = {
  reference: /^[A-Za-z0-9-]{4,40}$/,
  amount: /^[0-9]{1,9}\.[0-9]{2}$/,
  payer: /^\+?[0-9]{9,15}$/,
};

/**
 * Each provider behind one contract. Built at call time, because Apps Script
 * may load files in any order.
 * @param {string} provider
 */
function paymentAdapter_(provider) {
  if (provider === 'paynow') {
    return {
      name: 'Paynow', methods: PAYNOW_METHODS_, keys: paynowKeys_, start: paynowStart_, check: paynowCheck_,
      callback: paynowCallback_, callbackReference: paynowCallbackReference_,
    };
  }
  return null;
}

/** @param {any} services @param {string} provider @param {string} currency */
function paymentKeys_(services, provider, currency) {
  return readJson_(services, 'paykey:' + provider + ':' + currency);
}

/**
 * `keys.set`, owner only. Keys are write-only: nothing ever returns them.
 * @param {any} request @param {any} services @param {any} device
 */
function setPaymentKeys_(request, services, device) {
  requireOwner_(device);
  var body = request.body;
  var adapter = paymentAdapter_(body.provider);
  if (!adapter || PRICING_CURRENCIES_.indexOf(body.currency) < 0) {
    throw hubError_('validation', 'bad_keys', 'Keys need a known provider and currency.');
  }
  writeJson_(services, 'paykey:' + body.provider + ':' + body.currency, adapter.keys(body));
  return { provider: body.provider, currency: body.currency, set: true };
}

/** What a phone may see of a payment. @param {any} record */
function paymentReply_(record) {
  var reply = { reference: record.reference, state: record.state, amount: record.amount, currency: record.currency };
  if (record.note) reply.note = record.note;
  return reply;
}

/** A payment.start body, checked. @param {any} body */
function readPayment_(body) {
  var adapter = paymentAdapter_(body.provider);
  var valid = adapter && adapter.methods.indexOf(body.method) >= 0 &&
    PRICING_CURRENCIES_.indexOf(body.currency) >= 0 &&
    PAYMENT_PATTERNS_.reference.test(body.reference) &&
    PAYMENT_PATTERNS_.amount.test(body.amount) && Number(body.amount) > 0 &&
    PAYMENT_PATTERNS_.payer.test(body.payer);
  if (!valid) {
    throw hubError_('validation', 'bad_payment',
      'A payment needs a reference, a provider and method, an amount like 2.50, a currency and the payer\'s number.');
  }
  return adapter;
}

/**
 * Claims the reference, or returns the payment it already names.
 * @param {any} services @param {any} record
 * @returns {any} the existing record, or null if this call now owns the reference
 */
function claimPayment_(services, record) {
  return withLock_(services, function () {
    var key = 'pay:' + record.reference;
    var existing = readJson_(services, key);
    if (existing) return existing;
    writeJson_(services, key, record);
    return null;
  });
}

/**
 * `payment.start`: asks the provider to prompt the customer.
 * @param {any} request @param {any} services @param {any} device
 */
function startPayment_(request, services, device) {
  var body = request.body;
  var adapter = readPayment_(body);
  var keys = paymentKeys_(services, body.provider, body.currency);
  if (!keys) {
    throw hubError_('validation', 'payments_not_set_up', 'This provider has no keys for this currency.');
  }
  var record = {
    reference: body.reference, provider: body.provider, method: body.method, amount: body.amount,
    currency: body.currency, payer: body.payer, sale: typeof body.sale === 'string' ? body.sale.slice(0, 40) : '',
    device: device.id, at: services.now(), state: 'unknown',
  };
  var existing = claimPayment_(services, record);
  if (existing) {
    if (existing.amount !== record.amount || existing.currency !== record.currency) {
      throw hubError_('integrity_conflict', 'reference_reused', 'This reference is already a different payment.');
    }
    return paymentReply_(existing);
  }
  var hubUrl = ScriptApp.getService().getUrl() + '?cb=' + body.provider;
  try {
    Object.assign(record, adapter.start(record, keys, hubUrl));
  } catch (error) {
    throw hubError_('unknown_external_outcome', 'payment_outcome_unknown',
      'The provider gave no usable reply. Do not charge again; check with the customer.');
  }
  delete record.payer; // the customer's number is needed only for the prompt
  writeJson_(services, 'pay:' + record.reference, record);
  return paymentReply_(record);
}

/**
 * Asks the provider, and saves the answer. A paid amount that differs from
 * what was asked is not treated as paid.
 * @param {any} services @param {any} record
 */
function refreshPayment_(services, record) {
  var result = paymentAdapter_(record.provider).check(record, paymentKeys_(services, record.provider, record.currency));
  record.status = result.status;
  record.state = result.state;
  if (result.state === 'paid' && Number(result.amount) !== Number(record.amount)) {
    record.state = 'failed';
    record.note = 'Paid amount ' + result.amount + ' differs from ' + record.amount + '.';
  }
  writeJson_(services, 'pay:' + record.reference, record);
  return record;
}

/**
 * `payment.check`: where a payment stands.
 * @param {any} request @param {any} services
 */
function checkPayment_(request, services) {
  var reference = request.body.reference;
  var record = PAYMENT_PATTERNS_.reference.test(reference) ? readJson_(services, 'pay:' + reference) : null;
  if (!record) throw hubError_('validation', 'no_such_payment', 'No such payment.');
  return paymentReply_(record.state === 'pending' ? refreshPayment_(services, record) : record);
}

/** A row in My Shop's Payment Callbacks tab. Call inside the lock. @param {any} services @param {any} row */
function logCallback_(services, row) {
  var store = services.store;
  var shop = store.get('file:myshop');
  var table = 'Payment Callbacks';
  var key = 'row:' + shop + ':' + table;
  var at = Number(store.get(key) || '2');
  writeRowAt_(services, shop, table, at, row);
  store.set(key, at + 1);
}

/**
 * A provider's status update, posted to `?cb=<provider>`. Anyone can post
 * here, so nothing in it is believed: unknown references are ignored, a bad
 * hash is logged as rejected, and a good one only triggers a status check.
 * @param {string} provider @param {string} raw the post's body @param {any} services
 */
function handlePaymentCallback_(provider, raw, services) {
  var adapter = paymentAdapter_(provider);
  if (!adapter) return;
  var reference = adapter.callbackReference(raw);
  var record = PAYMENT_PATTERNS_.reference.test(reference) ? readJson_(services, 'pay:' + reference) : null;
  if (!record || record.provider !== provider) return;
  var update = adapter.callback(raw, paymentKeys_(services, provider, record.currency));
  if (update.valid && record.logged === update.status) return; // the provider sent it again
  if (update.valid && record.state === 'pending') refreshPayment_(services, record);
  var name = record.state.charAt(0).toUpperCase() + record.state.slice(1);
  withLock_(services, function () {
    logCallback_(services, {
      received_at: Utilities.formatDate(new Date(services.now() * 1000), services.store.get('timeZone'), "yyyy-MM-dd'T'HH:mm:ss"),
      provider: adapter.name, reference: reference, amount: update.amount, currency: record.currency,
      provider_status: update.status, signature_valid: update.valid ? 'Yes' : 'No',
      matched_sale: record.sale, result: update.valid ? name : 'Rejected', note: record.note || '',
    });
    if (update.valid) {
      record.logged = update.status;
      writeJson_(services, 'pay:' + reference, record);
    }
  });
}

/**
 * The daily look at open payments. Each stored payment costs property space,
 * so finished ones are dropped once old; Script Properties hold 500 KB.
 * @param {any} services
 */
function reviewPayments_(services) {
  var store = services.store;
  Object.keys(store.getAll()).forEach(function (key) {
    if (key.indexOf('pay:') !== 0) return;
    var record = JSON.parse(store.get(key));
    var age = services.now() - record.at;
    if (record.state === 'pending' && age > PAYMENT_RECHECK_SECONDS_) refreshPayment_(services, record);
    if (age <= PAYMENT_KEEP_SECONDS_) return;
    if (record.state === 'pending') {
      record.state = 'failed';
      record.note = 'Never confirmed by the provider.';
      writeJson_(services, key, record);
    } else {
      store.remove(key);
    }
  });
}
