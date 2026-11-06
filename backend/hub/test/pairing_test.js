// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installedHub, hubWithOwner, hubWithSeller, INSTALL_CODE, BUSINESS } =
  require('./support/hub_fixture');

const badCode = { category: 'authentication_required', code: 'bad_code' };

function errorOf(reply) {
  assert.equal(reply.ok, false, JSON.stringify(reply));
  return { category: reply.error.category, code: reply.error.code };
}

test('the install code pairs the first phone as the owner', () => {
  const { pair } = installedHub();
  const reply = pair(INSTALL_CODE, 'Owner phone');
  assert.equal(reply.ok, true);
  assert.equal(reply.result.device, 'P1');
  assert.equal(reply.result.role, 'owner');
  assert.equal(reply.result.business, BUSINESS);
  assert.match(reply.result.secret, /^[0-9a-f]{64}$/);
});

test('the install code works only once', () => {
  const { pair } = installedHub();
  pair(INSTALL_CODE, 'Owner phone');
  assert.deepEqual(errorOf(pair(INSTALL_CODE, 'Second phone')), badCode);
});

test('the install code expires 15 minutes after install', () => {
  const { pair, google } = installedHub();
  google.clock.seconds += 15 * 60 + 1;
  assert.deepEqual(errorOf(pair(INSTALL_CODE, 'Owner phone')), badCode);
});

test('the owner adds a seller phone with a pairing code', () => {
  const { send, pair, owner, google } = hubWithOwner();
  const created = send(owner, 'pairing.create');
  assert.equal(created.ok, true);
  assert.match(created.result.code, /^[0-9a-f]{32}$/);
  assert.equal(created.result.expires, google.clock.now() + 600);

  const seller = pair(created.result.code, 'Back counter');
  assert.equal(seller.ok, true);
  assert.equal(seller.result.device, 'P2');
  assert.equal(seller.result.role, 'seller');
});

test('a pairing code works once, and only for 10 minutes', () => {
  const { send, pair, owner, google } = hubWithOwner();
  const first = send(owner, 'pairing.create').result.code;
  assert.equal(pair(first, 'Back counter').ok, true);
  assert.deepEqual(errorOf(pair(first, 'Another phone')), badCode);

  const second = send(owner, 'pairing.create').result.code;
  google.clock.seconds += 601;
  assert.deepEqual(errorOf(pair(second, 'Late phone')), badCode);
});

test('an unknown or malformed code is refused the same way', () => {
  const { pair } = hubWithOwner();
  assert.deepEqual(errorOf(pair('f'.repeat(32), 'Guess')), badCode);
  assert.deepEqual(errorOf(pair('not-hex', 'Guess')), badCode);
});

test('codes and install hashes are never stored in clear', () => {
  const { send, owner, google } = hubWithOwner();
  const { code } = send(owner, 'pairing.create').result;
  const stored = JSON.stringify(google.PropertiesService.getScriptProperties().getProperties());
  assert.equal(stored.includes(code), false);
  assert.equal(stored.includes(INSTALL_CODE), false);
});

test('only the owner can create pairing codes', () => {
  const { send, seller } = hubWithSeller();
  assert.deepEqual(errorOf(send(seller, 'pairing.create')),
    { category: 'permission', code: 'owner_only' });
});

test('a revoked phone is refused on its next request', () => {
  const { send, owner, seller } = hubWithSeller();
  const reply = send(owner, 'device.revoke', { device: 'P2' });
  assert.deepEqual(reply.result, { device: 'P2', revoked: true });
  assert.deepEqual(errorOf(send(seller, 'journal.put', {})),
    { category: 'authentication_required', code: 'unknown_device' });
});

test('the owner cannot revoke their own phone', () => {
  const { send, owner } = hubWithOwner();
  assert.deepEqual(errorOf(send(owner, 'device.revoke', { device: 'P1' })),
    { category: 'validation', code: 'cannot_revoke_self' });
});

test('a seller cannot revoke a phone', () => {
  const { send, seller } = hubWithSeller();
  assert.deepEqual(errorOf(send(seller, 'device.revoke', { device: 'P1' })),
    { category: 'permission', code: 'owner_only' });
});
