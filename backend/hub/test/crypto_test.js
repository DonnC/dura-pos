// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHub } = require('./support/load_hub');
const client = require('./support/test_client');

test('HMAC-SHA256 matches RFC 4231 test case 2', () => {
  const { hub } = loadHub();
  assert.equal(
    hub.hmacSha256Hex_('what do ya want for nothing?', 'Jefe'),
    '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
  );
});

test('SHA-256 of "abc" matches the published digest', () => {
  const { hub } = loadHub();
  assert.equal(
    hub.sha256Hex_('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});

test('canonical JSON sorts keys at every depth and drops spacing', () => {
  const { hub } = loadHub();
  const value = { b: [{ z: 1, a: 'x' }], a: { d: true, c: null } };
  assert.equal(hub.canonicalJson_(value), '{"a":{"c":null,"d":true},"b":[{"a":"x","z":1}]}');
  assert.equal(hub.canonicalJson_(value), client.canonical(value));
});

test('canonical JSON refuses non-integer numbers', () => {
  const { hub } = loadHub();
  assert.throws(() => hub.canonicalJson_({ total: 2.5 }), /integer/);
});

test('random hex has the requested length and does not repeat', () => {
  const { hub } = loadHub();
  const a = hub.randomHex_(32);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, hub.randomHex_(32));
});

test('constant-time comparison is exact', () => {
  const { hub } = loadHub();
  assert.equal(hub.constantTimeEqual_('abcd', 'abcd'), true);
  assert.equal(hub.constantTimeEqual_('abcd', 'abce'), false);
  assert.equal(hub.constantTimeEqual_('abcd', 'abc'), false);
});
