// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const crypto = require('node:crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const { readyShop, named } = require('./support/shop_fixture');

const INTEGRATION_KEY = 'test-integration-key';
const REMOTE = 'https://www.paynow.co.zw/interface/remotetransaction';
const POLL = 'https://www.paynow.co.zw/interface/pollurl?guid=abc';
const KEYS = { provider: 'paynow', currency: 'USD', integrationId: '1234', integrationKey: INTEGRATION_KEY, authEmail: 'shop@example.test' };
const PAYMENT = { reference: 'P1-PAY261103-0001', provider: 'paynow', method: 'ecocash', amount: '2.50', currency: 'USD', payer: '0771234567', sale: 'P1-S261103-0001' };

const sign = (values) => crypto.createHash('sha512').update(values.join('') + INTEGRATION_KEY).digest('hex').toUpperCase();

/** A form body signed the way Paynow signs, values URL-encoded, fields in order. */
function signedForm(fields) {
  const pairs = [...Object.entries(fields), ['hash', sign(Object.values(fields))]];
  return pairs.map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`).join('&');
}

const startReply = () => {
  const fields = { Status: 'Ok', BrowserUrl: 'https://www.paynow.co.zw/x', PollUrl: POLL };
  const pairs = [...Object.entries(fields), ['Hash', sign(Object.values(fields))]];
  return pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

const statusForm = (status, amount = '2.50') => signedForm({
  reference: PAYMENT.reference, amount, paynowreference: '999', pollurl: POLL, status,
});

function shop() {
  const fixture = readyShop();
  const routes = fixture.google.UrlFetchApp.routes;
  routes.set(REMOTE, { code: 200, body: startReply() });
  routes.set(POLL, { code: 200, body: statusForm('Sent') });
  fixture.send(fixture.owner, 'keys.set', KEYS);
  return fixture;
}

const posts = (google, url) => google.UrlFetchApp.posts.filter((p) => p.url === url);
const payments = (google) => google.Sheets.writes.filter((w) => w.request.data[0].range.startsWith("'Payment Callbacks'"));

test('keys.set is owner-only, and keys never come back', () => {
  const { send, owner, google, services, hub } = shop();
  const code = send(owner, 'pairing.create').result.code;
  const { pair } = { pair: (c) => hub.handleRequest_({ v: 1, ts: google.clock.now(), action: 'pair', body: { code: c, name: 'Till' } }, services()) };
  const seller = JSON.parse(JSON.stringify(pair(code))).result;
  assert.equal(send(seller, 'keys.set', KEYS).error.code, 'owner_only');
  const status = JSON.stringify(send(owner, 'status').result);
  assert.equal(status.includes(INTEGRATION_KEY), false);
  assert.deepEqual(send(owner, 'status').result.payments, ['paynow:USD']);
});

test('keys.set refuses incomplete keys', () => {
  const { send, owner } = shop();
  assert.equal(send(owner, 'keys.set', { ...KEYS, integrationKey: '' }).error.category, 'validation');
});

test('payment.start asks Paynow with a correct hash and answers pending', () => {
  const { send, owner, google } = shop();
  const { result } = send(owner, 'payment.start', PAYMENT);
  assert.equal(result.state, 'pending');
  assert.equal(result.reference, PAYMENT.reference);
  const { options } = posts(google, REMOTE)[0];
  const form = new URLSearchParams(options.payload);
  assert.equal(form.get('id'), '1234');
  assert.equal(form.get('amount'), '2.50');
  assert.equal(form.get('method'), 'ecocash');
  assert.equal(form.get('phone'), '0771234567');
  assert.equal(form.get('authemail'), 'shop@example.test');
  assert.equal(form.get('resulturl'), 'https://script.test/exec?cb=paynow');
  const values = [...form.entries()].filter(([k]) => k !== 'hash').map(([, v]) => v);
  assert.equal(form.get('hash'), sign(values));
  assert.equal(options.payload.includes(INTEGRATION_KEY), false);
});

test('a repeated start never charges twice', () => {
  const { send, owner, google } = shop();
  send(owner, 'payment.start', PAYMENT);
  assert.equal(send(owner, 'payment.start', PAYMENT).result.state, 'pending');
  assert.equal(posts(google, REMOTE).length, 1);
});

test('one reference cannot carry a different amount', () => {
  const { send, owner } = shop();
  send(owner, 'payment.start', PAYMENT);
  const reply = send(owner, 'payment.start', { ...PAYMENT, amount: '9.00' });
  assert.equal(reply.error.code, 'reference_reused');
});

test('bad amounts, numbers and methods are refused before Paynow is called', () => {
  const { send, owner, google } = shop();
  for (const bad of [{ amount: '2.5' }, { amount: '0.00' }, { payer: 'abc' }, { method: 'vmc' }, { reference: 'x' }]) {
    assert.equal(send(owner, 'payment.start', { ...PAYMENT, ...bad }).error.category, 'validation');
  }
  assert.equal(posts(google, REMOTE).length, 0);
});

test('payments without keys say so', () => {
  const { send, owner } = shop();
  assert.equal(send(owner, 'payment.start', { ...PAYMENT, currency: 'ZWG' }).error.code, 'payments_not_set_up');
});

test('a Paynow refusal is a failed payment, not an error', () => {
  const { send, owner, google } = shop();
  google.UrlFetchApp.routes.set(REMOTE, { code: 200, body: 'Status=Error&Error=Invalid+phone' });
  const { result } = send(owner, 'payment.start', PAYMENT);
  assert.equal(result.state, 'failed');
  assert.equal(result.note, 'Invalid phone');
});

test('no reply from Paynow is an unknown outcome, and it is never sent again', () => {
  const { send, owner, google } = shop();
  google.UrlFetchApp.routes.set(REMOTE, { code: 502, body: 'Bad gateway' });
  assert.equal(send(owner, 'payment.start', PAYMENT).error.category, 'unknown_external_outcome');
  assert.equal(send(owner, 'payment.start', PAYMENT).result.state, 'unknown');
  assert.equal(posts(google, REMOTE).length, 1);
  assert.equal(send(owner, 'payment.check', { reference: PAYMENT.reference }).result.state, 'unknown');
});

test('a start reply with a bad hash is an unknown outcome', () => {
  const { send, owner, google } = shop();
  google.UrlFetchApp.routes.set(REMOTE, { code: 200, body: `Status=Ok&PollUrl=${encodeURIComponent(POLL)}&Hash=ABC` });
  assert.equal(send(owner, 'payment.start', PAYMENT).error.category, 'unknown_external_outcome');
});

test('payment.check stays pending until Paynow confirms, then is paid', () => {
  const { send, owner, google } = shop();
  send(owner, 'payment.start', PAYMENT);
  const check = () => send(owner, 'payment.check', { reference: PAYMENT.reference }).result.state;
  assert.equal(check(), 'pending');
  google.UrlFetchApp.routes.set(POLL, { code: 200, body: statusForm('Paid') });
  assert.equal(check(), 'paid');
});

test('a finished payment is not polled again', () => {
  const { send, owner, google } = shop();
  google.UrlFetchApp.routes.set(POLL, { code: 200, body: statusForm('Paid') });
  send(owner, 'payment.start', PAYMENT);
  send(owner, 'payment.check', { reference: PAYMENT.reference });
  const polls = posts(google, POLL).length;
  send(owner, 'payment.check', { reference: PAYMENT.reference });
  assert.equal(posts(google, POLL).length, polls);
});

for (const [status, state] of [['Awaiting Delivery', 'paid'], ['Delivered', 'paid'], ['Created', 'pending'],
  ['Cancelled', 'cancelled'], ['Refunded', 'cancelled'], ['Disputed', 'failed']]) {
  test(`Paynow's ${status} reads as ${state}`, () => {
    const { send, owner, google } = shop();
    send(owner, 'payment.start', PAYMENT);
    google.UrlFetchApp.routes.set(POLL, { code: 200, body: statusForm(status) });
    assert.equal(send(owner, 'payment.check', { reference: PAYMENT.reference }).result.state, state);
  });
}

test('a poll with a bad hash never marks a payment paid', () => {
  const { send, owner, google } = shop();
  send(owner, 'payment.start', PAYMENT);
  const forged = statusForm('Paid').replace(/hash=.*/, 'hash=ABC');
  google.UrlFetchApp.routes.set(POLL, { code: 200, body: forged });
  assert.equal(send(owner, 'payment.check', { reference: PAYMENT.reference }).result.state, 'pending');
});

test('a paid amount that differs is failed, with a reason', () => {
  const { send, owner, google } = shop();
  send(owner, 'payment.start', PAYMENT);
  google.UrlFetchApp.routes.set(POLL, { code: 200, body: statusForm('Paid', '1.00') });
  const { result } = send(owner, 'payment.check', { reference: PAYMENT.reference });
  assert.equal(result.state, 'failed');
  assert.match(result.note, /amount/i);
});

test('an unreachable poll is retryable and leaves the payment pending', () => {
  const { send, owner, google } = shop();
  send(owner, 'payment.start', PAYMENT);
  google.UrlFetchApp.routes.set(POLL, { code: 503, body: '' });
  assert.equal(send(owner, 'payment.check', { reference: PAYMENT.reference }).error.category, 'retryable_unavailable');
});

test('a good callback is logged, and paid comes from the status check', () => {
  const { send, owner, google, hub, services, drive } = shop();
  send(owner, 'payment.start', PAYMENT);
  google.UrlFetchApp.routes.set(POLL, { code: 200, body: statusForm('Paid') });
  hub.handlePaymentCallback_('paynow', statusForm('Paid'), services());
  assert.ok(posts(google, POLL).length >= 1);
  assert.equal(send(owner, 'payment.check', { reference: PAYMENT.reference }).result.state, 'paid');
  const [write] = payments(google);
  assert.equal(write.spreadsheetId, named(drive, 'My Shop').id);
  const heads = google.Sheets.headings['Payment Callbacks'];
  const row = write.request.data[0].values[0];
  assert.equal(row[heads.indexOf('Signature valid')], 'Yes');
  assert.equal(row[heads.indexOf('Matched sale')], PAYMENT.sale);
  assert.equal(row[heads.indexOf('Result')], 'Paid');
  assert.equal(row[heads.indexOf('Amount')], 2.5);
});

test('the same callback sent twice is logged once', () => {
  const { send, owner, google, hub, services } = shop();
  send(owner, 'payment.start', PAYMENT);
  hub.handlePaymentCallback_('paynow', statusForm('Sent'), services());
  hub.handlePaymentCallback_('paynow', statusForm('Sent'), services());
  assert.equal(payments(google).length, 1);
});

test('the number of the customer is not kept after the prompt', () => {
  const { send, owner, services } = shop();
  send(owner, 'payment.start', PAYMENT);
  assert.equal(services().store.get(`pay:${PAYMENT.reference}`).includes(PAYMENT.payer), false);
});

test('a callback saying Paid means nothing while Paynow itself says otherwise', () => {
  const { send, owner, hub, services } = shop();
  send(owner, 'payment.start', PAYMENT);
  hub.handlePaymentCallback_('paynow', statusForm('Paid'), services());
  assert.equal(send(owner, 'payment.check', { reference: PAYMENT.reference }).result.state, 'pending');
});

test('a forged callback is logged as rejected and never polled', () => {
  const { send, owner, google, hub, services } = shop();
  send(owner, 'payment.start', PAYMENT);
  const polls = posts(google, POLL).length;
  hub.handlePaymentCallback_('paynow', statusForm('Paid').replace(/hash=.*/, 'hash=ABC'), services());
  assert.equal(posts(google, POLL).length, polls);
  const heads = google.Sheets.headings['Payment Callbacks'];
  assert.equal(payments(google)[0].request.data[0].values[0][heads.indexOf('Signature valid')], 'No');
});

test('a callback for a reference the hub never started is ignored', () => {
  const { google, hub, services } = shop();
  hub.handlePaymentCallback_('paynow', statusForm('Paid'), services());
  hub.handlePaymentCallback_('nobody', 'junk', services());
  assert.equal(payments(google).length, 0);
});

test('doPost answers a callback in plain text, whatever it holds', () => {
  const { hub } = shop();
  const reply = hub.doPost({ parameter: { cb: 'paynow' }, postData: { contents: 'junk=%E0%A4%A' } });
  assert.equal(reply.text, 'ok');
});

test('the daily pass settles pending payments, and forgets old finished ones', () => {
  const { send, owner, google, hub, services } = shop();
  send(owner, 'payment.start', PAYMENT);
  google.UrlFetchApp.routes.set(POLL, { code: 200, body: statusForm('Paid') });
  google.clock.seconds += 2 * 3600;
  hub.runDaily_(services());
  assert.equal(send(owner, 'payment.check', { reference: PAYMENT.reference }).result.state, 'paid');
  google.clock.seconds += 4 * 86400;
  hub.runDaily_(services());
  assert.equal(services().store.get(`pay:${PAYMENT.reference}`), null);
});

test('a payment that never settles is closed as failed after three days', () => {
  const { send, owner, google, hub, services } = shop();
  send(owner, 'payment.start', PAYMENT);
  google.clock.seconds += 4 * 86400;
  hub.runDaily_(services());
  const record = JSON.parse(services().store.get(`pay:${PAYMENT.reference}`));
  assert.equal(record.state, 'failed');
});
