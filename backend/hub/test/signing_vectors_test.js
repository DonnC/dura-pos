// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// The vectors are shared with the Dart client's tests, so a change to signing
// on either side fails here or there.

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHub } = require('./support/load_hub');

const FILE = path.join(__dirname, '..', '..', '..', 'client', 'packages', 'dura_hub', 'test', 'fixtures', 'signing_vectors.json');
const { secret, vectors } = JSON.parse(fs.readFileSync(FILE, 'utf8'));

test('the hub signs every shared vector as the phones do', () => {
  const { hub } = loadHub();
  for (const { value, canonical, sig } of vectors) {
    assert.equal(hub.canonicalJson_(value), canonical);
    assert.equal(crypto.createHmac('sha256', Buffer.from(secret, 'utf8')).update(canonical, 'utf8').digest('hex'), sig);
    assert.equal(hub.hmacSha256Hex_(canonical, secret), sig);
  }
});
