// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const client = require('./support/test_client');
const { hubWithOwner } = require('./support/hub_fixture');

function errorOf(reply) {
  assert.equal(reply.ok, false, JSON.stringify(reply));
  return `${reply.error.category}/${reply.error.code}`;
}

test('a correctly signed request is accepted', () => {
  const { send, owner } = hubWithOwner();
  assert.equal(send(owner, 'pairing.create').ok, true);
});

test('a wrong signature is refused', () => {
  const { send, owner } = hubWithOwner();
  const forged = { ...owner, secret: 'e'.repeat(64) };
  assert.equal(errorOf(send(forged, 'pairing.create')),
    'authentication_required/bad_signature');
});

test('a changed body breaks the signature', () => {
  const { call, owner, google } = hubWithOwner();
  const request = client.signed({
    device: owner.device, secret: owner.secret, action: 'device.revoke',
    body: { device: 'P9' }, ts: google.clock.now(),
  });
  request.body.device = 'P1';
  assert.equal(errorOf(call(request)), 'authentication_required/bad_signature');
});

test('a request more than 5 minutes old or ahead is refused', () => {
  const { send, owner, google } = hubWithOwner();
  const now = google.clock.now();
  assert.equal(errorOf(send(owner, 'pairing.create', {}, { ts: now - 301 })),
    'authentication_required/stale_request');
  assert.equal(errorOf(send(owner, 'pairing.create', {}, { ts: now + 301 })),
    'authentication_required/stale_request');
  assert.equal(send(owner, 'pairing.create', {}, { ts: now - 300 }).ok, true);
});

test('replaying the same request is refused', () => {
  const { call, owner, google } = hubWithOwner();
  const request = client.signed({
    device: owner.device, secret: owner.secret, action: 'pairing.create',
    ts: google.clock.now(),
  });
  assert.equal(call(request).ok, true);
  assert.equal(errorOf(call(request)), 'authentication_required/replayed_request');
});

test('an unknown device is refused', () => {
  const { send } = hubWithOwner();
  const stranger = { device: 'P7', secret: 'a'.repeat(64) };
  assert.equal(errorOf(send(stranger, 'pairing.create')),
    'authentication_required/unknown_device');
});

test('an unsupported protocol version is refused', () => {
  const { send, owner } = hubWithOwner();
  assert.equal(errorOf(send(owner, 'pairing.create', {}, { v: 2 })),
    'validation/unsupported_version');
});

test('malformed envelopes are refused before any work', () => {
  const { call, owner, google } = hubWithOwner();
  const good = client.signed({
    device: owner.device, secret: owner.secret, action: 'pairing.create',
    ts: google.clock.now(),
  });
  for (const broken of [
    null,
    'text',
    { ...good, nonce: 'short' },
    { ...good, nonce: undefined },
    { ...good, ts: '1793700000' },
    { ...good, body: [] },
    { ...good, sig: 'XYZ' },
    { ...good, device: '../P1' },
  ]) {
    assert.equal(errorOf(call(broken)), 'validation/bad_envelope', JSON.stringify(broken));
  }
});

test('an unknown action is refused after authentication', () => {
  const { send, owner } = hubWithOwner();
  assert.equal(errorOf(send(owner, 'stock.teleport')), 'validation/unknown_action');
});
