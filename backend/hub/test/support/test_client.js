// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// An independent protocol client for tests, written from PROTOCOL.md rather
// than from the hub's code, so the tests check interoperability.

'use strict';

const crypto = require('node:crypto');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256Hex(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function nonce() {
  return crypto.randomBytes(16).toString('hex');
}

/** A signed envelope, as a phone would send it. */
function signed({ device, secret, action, body = {}, ts, v = 1, nonceValue }) {
  const envelope = { v, device, ts, nonce: nonceValue ?? nonce(), action, body };
  const sig = crypto.createHmac('sha256', Buffer.from(secret, 'utf8'))
    .update(canonical(envelope), 'utf8')
    .digest('hex');
  return { ...envelope, sig };
}

/** A journal batch body with a correct hash. */
function batch(number, events) {
  return { batch: number, events, hash: sha256Hex(canonical(events)) };
}

function saleEvent(id) {
  return {
    id,
    type: 'sale.completed',
    at: '2026-11-03T16:20:00+02:00',
    data: { total: '2.00', currency: 'USD' },
  };
}

module.exports = { canonical, sha256Hex, signed, batch, saleEvent, nonce };
