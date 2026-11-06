// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// The fixture is shared with the Dart client's tests, so a word changed on one
// side fails here or there.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHub } = require('./support/load_hub');
const names = require('./support/hub_names');

const HUB = path.join(__dirname, '..');
const SRC = path.join(HUB, 'src');
const FIXTURE = path.join(HUB, '..', '..', 'client', 'packages', 'dura_hub', 'test', 'fixtures', 'protocol_names.json');
const shared = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const values = (table) => Object.values(table).sort();
const GENERATED = ['brand_mark.js', 'install_config.js', 'names.js', 'template_manifest.js', 'view_contract.js'];

test('the protocol words match the ones the phones use', () => {
  assert.deepEqual(values(names.ACTIONS_), shared.actions);
  assert.deepEqual(values(names.ERROR_CATEGORIES_), shared.errorCategories);
  assert.deepEqual(values(names.PAYMENT_STATES_), shared.paymentStates);
  assert.deepEqual(values(names.ATTACHMENT_KINDS_), shared.attachmentKinds);
  assert.deepEqual(values(names.EXPORT_FORMATS_), shared.exportFormats);
});

test('every action has a handler and is in PROTOCOL.md', () => {
  const { hub } = loadHub();
  const protocol = fs.readFileSync(path.join(HUB, 'PROTOCOL.md'), 'utf8');
  for (const action of values(names.ACTIONS_)) {
    if (action !== names.ACTIONS_.pair) assert.equal(typeof hub.handlerFor_(action), 'function', action);
    assert.ok(protocol.includes(`\`${action}\``), action);
  }
});

test('every error names a known category and a unique code', () => {
  const errors = Object.values(names.ERRORS_);
  assert.equal(new Set(errors.map((error) => error.code)).size, errors.length);
  for (const error of errors) assert.ok(shared.errorCategories.includes(error.category), error.code);
});

test('store and cache keys are unique', () => {
  for (const table of [names.STORE_KEYS_, names.STORE_PREFIXES_, names.CACHE_KEYS_]) {
    assert.equal(new Set(Object.values(table)).size, Object.keys(table).length);
  }
});

test('the keys installed hubs already saved keep their spelling', () => {
  assert.equal(names.rowPointerKey_('F1', 'Sales'), 'row:F1:Sales');
  assert.equal(names.paymentKeysKey_('paynow', 'USD'), 'paykey:paynow:USD');
  assert.equal(names.viewQueueKey_('P2', 31), 'viewq:P2:000031');
  assert.equal(names.sheetCacheKey_('F1', 'Sales'), 'sheet:F1:Sales');
  assert.equal(names.STORE_KEYS_.fileMyShop, 'file:myshop');
  assert.equal(names.STORE_PREFIXES_.journal, 'journal:');
  assert.equal(names.STORE_PREFIXES_.payment, 'pay:');
});

test('the hub works whichever order Apps Script loads its files', () => {
  const { hub } = loadHub({ order: (files) => files.reverse() });
  assert.equal(hub.handleRequest_({ v: 1, action: 'pair', ts: 1, body: {} }, hub.createServices_()).ok, false);
  assert.ok(hub.PAYMENT_DONE_.includes('paid'));
  assert.equal(hub.MASTER_TABLES_[0], 'Products');
});

for (const name of fs.readdirSync(SRC).filter((file) => file.endsWith('.js') && !GENERATED.includes(file))) {
  test(`${name} spells shared words through names.js`, () => {
    const code = fs.readFileSync(path.join(SRC, name), 'utf8').replace(/^\s*(\/\/|\*|\/\*).*$/gm, '');
    const free = [
      /hubError_\(\s*'/,
      /(?<!typeof request)\.action\s*[!=]==\s*'/,
      new RegExp(`case '(${values(names.ACTIONS_).join('|').replace(/\./g, '\\.')})'`),
      /store\.\w+\(\s*'/,
      /cache\.\w+\(\s*'/,
      /newTrigger\('/,
      /'(file|filled|row|pay|paykey|viewq|device|pairing|journal|seen):/,
      /\.state\s*(===|!==|=)\s*'/,
    ].filter((pattern) => pattern.test(code));
    assert.deepEqual(free.map(String), []);
  });
}
