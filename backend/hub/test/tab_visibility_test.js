// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHub } = require('./support/load_hub');

const IDS = { 'HS Codes': 1, 'Payment Callbacks': 2, 'Fiscal Days': 3, Quotes: 4 };

function setup(extra = {}) {
  const { hub, google } = loadHub();
  const store = { 'file:myshop': 'SHOP', 'file:month:2026-11': 'MONTH', ...extra };
  const services = {
    store: {
      get: (key) => store[key] ?? null,
      set: (key, value) => { store[key] = value; },
      remove: (key) => { delete store[key]; },
      getAll: () => store,
    },
    cache: { getAll: () => ({}), put() {} },
  };
  google.Sheets.Spreadsheets.get = () => ({
    sheets: Object.entries(IDS).map(([title, sheetId]) => ({
      properties: { sheetId, title, gridProperties: { rowCount: 100 } },
      data: [{}],
    })),
  });
  const calls = [];
  google.Sheets.Spreadsheets.batchUpdate = (request, fileId) => { calls.push({ fileId, requests: request.requests }); return {}; };
  return { hub, services, calls };
}

const master = (settings) => ({
  tables: { Settings: Object.entries(settings).map(([setting, value]) => ({ setting, value })) },
});
const shown = (call) => Object.fromEntries(call.requests.map(({ updateSheetProperties: u }) => [u.properties.sheetId, !u.properties.hidden]));

test('a shop using nothing optional costs no Sheets call', () => {
  const { hub, services, calls } = setup();
  hub.refreshTabVisibility_(services, master({ Fiscalisation: 'Off', Quotes: 'Off' }), '2026-11');
  assert.equal(calls.length, 0);
});

test('turning fiscalisation on shows its tabs in both files', () => {
  const { hub, services, calls } = setup();
  hub.refreshTabVisibility_(services, master({ Fiscalisation: 'On (since 1 Mar 2026)', Quotes: 'Off' }), '2026-11');
  assert.deepEqual(calls.map((call) => call.fileId), ['SHOP', 'MONTH']);
  assert.deepEqual(shown(calls[0]), { 1: true, 2: false });
  assert.deepEqual(shown(calls[1]), { 3: true, 4: false });
});

test('quotes show on their own', () => {
  const { hub, services, calls } = setup();
  hub.refreshTabVisibility_(services, master({ Fiscalisation: 'Off', Quotes: 'On, valid 7 days' }), '2026-11');
  assert.equal(calls.length, 1);
  assert.deepEqual(shown(calls[0]), { 3: false, 4: true });
});

test('payment callbacks show once a provider has keys', () => {
  const { hub, services, calls } = setup({ 'paykey:paynow:USD': '{}' });
  hub.refreshTabVisibility_(services, master({ Fiscalisation: 'Off' }), '2026-11');
  assert.deepEqual(shown(calls[0]), { 1: false, 2: true });
});

test('nothing is sent again until something changes, and turning off hides the tab', () => {
  const { hub, services, calls } = setup();
  const on = master({ Fiscalisation: 'Off', Quotes: 'On' });
  hub.refreshTabVisibility_(services, on, '2026-11');
  hub.refreshTabVisibility_(services, on, '2026-11');
  assert.equal(calls.length, 1);
  hub.refreshTabVisibility_(services, master({ Fiscalisation: 'Off', Quotes: 'Off' }), '2026-11');
  assert.equal(calls.length, 2);
  assert.deepEqual(shown(calls[1]), { 3: false, 4: false });
});
