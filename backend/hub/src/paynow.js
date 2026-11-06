// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// The Paynow adapter: mobile ("express") checkout, from Paynow's developer
// documentation. A Paynow message is a form. Its hash is the SHA-512 of the
// raw field values in message order, followed by the integration key, in
// upper-case hex. Replies and status updates are signed the same way, so
// field order must be kept: they're parsed into ordered pairs, never objects.
//
// An integration belongs to one wallet, and a message has no currency field,
// so a shop sets one set of keys per currency.

var PAYNOW_BASE_ = 'https://www.paynow.co.zw/interface/';
var PAYNOW_METHODS_ = ['ecocash', 'onemoney', 'innbucks', 'omari'];
var PAYNOW_PAID_ = ['paid', 'awaiting delivery', 'delivered'];
var PAYNOW_CANCELLED_ = ['cancelled', 'refunded'];
var PAYNOW_FAILED_ = ['disputed'];

/** @param {string} text the message's values joined, with the key on the end */
function paynowDigest_(text) {
  return bytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_512, text, Utilities.Charset.UTF_8)).toUpperCase();
}

/** @param {string} text a URL-encoded form @returns {string[][]} pairs, in order */
function parseForm_(text) {
  return String(text).split('&').filter(Boolean).map(function (part) {
    var at = part.indexOf('=');
    var name = at < 0 ? part : part.slice(0, at);
    var value = at < 0 ? '' : part.slice(at + 1);
    try {
      return [name, decodeURIComponent(value.replace(/\+/g, ' '))];
    } catch (error) {
      return [name, value]; // malformed: its hash won't match
    }
  });
}

/** @param {string[][]} pairs @param {string} name any case */
function formValue_(pairs, name) {
  var wanted = name.toLowerCase();
  var found = pairs.filter(function (pair) { return pair[0].toLowerCase() === wanted; })[0];
  return found ? found[1] : '';
}

/** Whether a form's hash is right for this integration key. @param {string[][]} pairs @param {string} key */
function paynowFormValid_(pairs, key) {
  var values = pairs.filter(function (pair) { return pair[0].toLowerCase() !== 'hash'; })
    .map(function (pair) { return pair[1]; });
  return constantTimeEqual_(paynowDigest_(values.join('') + key), formValue_(pairs, 'hash'));
}

/** Posts a form; null when there is no usable reply. @param {string} url @param {string} payload */
function paynowPost_(url, payload) {
  var reply;
  try {
    reply = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/x-www-form-urlencoded',
      payload: payload, muteHttpExceptions: true,
    });
  } catch (error) {
    return null;
  }
  return reply.getResponseCode() === 200 ? parseForm_(reply.getContentText()) : null;
}

/** The keys to store, or a validation error. @param {any} body */
function paynowKeys_(body) {
  var valid = /^[0-9]{1,12}$/.test(String(body.integrationId)) &&
    typeof body.integrationKey === 'string' && body.integrationKey.length >= 8 && body.integrationKey.length <= 100 &&
    typeof body.authEmail === 'string' && /^[^@\s]+@[^@\s]+$/.test(body.authEmail);
  if (!valid) {
    throw hubError_('validation', 'bad_keys', 'Paynow needs the integration ID, the integration key and the merchant email.');
  }
  return { integrationId: String(body.integrationId), integrationKey: body.integrationKey, authEmail: body.authEmail };
}

/**
 * Starts a mobile payment.
 * @param {any} record @param {any} keys @param {string} hubUrl the callback address
 * @returns {{state: string, pollUrl?: string, note?: string}} throws if the outcome is unknown
 */
function paynowStart_(record, keys, hubUrl) {
  var fields = [
    ['id', keys.integrationId], ['reference', record.reference], ['amount', record.amount],
    ['additionalinfo', record.reference], ['returnurl', hubUrl], ['resulturl', hubUrl],
    ['authemail', keys.authEmail], ['phone', record.payer], ['method', record.method], ['status', 'Message'],
  ];
  var values = fields.map(function (pair) { return pair[1]; });
  var hash = paynowDigest_(values.join('') + keys.integrationKey);
  var payload = fields.concat([['hash', hash]]).map(function (pair) {
    return pair[0] + '=' + encodeURIComponent(pair[1]);
  }).join('&');
  var reply = paynowPost_(PAYNOW_BASE_ + 'remotetransaction', payload);
  if (!reply) throw new Error('No reply');
  var status = formValue_(reply, 'status').toLowerCase();
  if (status === 'error') return { state: 'failed', note: formValue_(reply, 'error') };
  var pollUrl = formValue_(reply, 'pollurl');
  if (status !== 'ok' || !paynowFormValid_(reply, keys.integrationKey) || pollUrl.indexOf(PAYNOW_BASE_) !== 0) {
    throw new Error('Unusable reply');
  }
  return { state: 'pending', pollUrl: pollUrl };
}

/**
 * Asks Paynow where a payment stands. Only this ever reports `paid`.
 * @param {any} record @param {any} keys
 * @returns {{state: string, status: string, amount?: string}} `null` reply throws retryable
 */
function paynowCheck_(record, keys) {
  var reply = paynowPost_(record.pollUrl, '');
  if (!reply) throw hubError_('retryable_unavailable', 'provider_unavailable', 'Paynow did not answer; check again.');
  if (!paynowFormValid_(reply, keys.integrationKey)) return { state: 'pending', status: 'Unverified' };
  var status = formValue_(reply, 'status');
  var word = status.toLowerCase();
  var state = 'pending';
  if (PAYNOW_PAID_.indexOf(word) >= 0) state = 'paid';
  if (PAYNOW_CANCELLED_.indexOf(word) >= 0) state = 'cancelled';
  if (PAYNOW_FAILED_.indexOf(word) >= 0) state = 'failed';
  return { state: state, status: status, amount: formValue_(reply, 'amount') };
}

/** A status update's fields, in the form every adapter's callback gives. @param {string} raw @param {any} keys */
function paynowCallback_(raw, keys) {
  var pairs = parseForm_(raw);
  return {
    valid: Boolean(keys) && paynowFormValid_(pairs, keys.integrationKey),
    status: formValue_(pairs, 'status'),
    amount: formValue_(pairs, 'amount'),
  };
}

/** The reference a status update is about, before its hash can be checked. @param {string} raw */
function paynowCallbackReference_(raw) {
  return formValue_(parseForm_(raw), 'reference');
}
