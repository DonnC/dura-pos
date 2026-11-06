// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHub } = require('./support/load_hub');

const SHEETS = { Sales: 11, 'Stock Ledger': 22, Stock: 33 };

function setup() {
  const { hub, google } = loadHub();
  const marks = {};
  const services = {
    now: () => 100,
    store: {
      get: (key) => marks[key] ?? (key === 'pricingCurrency' ? 'USD' : null),
      set: (key, value) => { marks[key] = value; },
    },
    cache: { getAll: () => ({}), put() {} },
  };
  google.Sheets.Spreadsheets.get = () => ({
    sheets: Object.entries(SHEETS).map(([title, sheetId]) => ({
      properties: { sheetId, title, gridProperties: { rowCount: 1000 } },
      data: [{ rowData: [{ values: ['Sale ID', 'Date', 'Time', 'Total', 'Total (USD)', 'Synced at', 'Note']
        .map((formattedValue) => ({ formattedValue })) }] }],
    })),
  });
  const calls = [];
  google.Sheets.Spreadsheets.batchUpdate = (request, fileId) => { calls.push({ request, fileId }); return {}; };
  return { hub, services, calls };
}

const on = (calls, sheetId, column) => calls[0].request.requests.map((r) => r.repeatCell)
  .find((r) => r.range.sheetId === sheetId && r.range.startColumnIndex === column);

test('dates, times and amounts get a readable format, below the headings', () => {
  const { hub, services, calls } = setup();
  hub.formatFile_(services, 'F1', 'month');
  assert.deepEqual({ ...on(calls, 11, 1).cell.userEnteredFormat.numberFormat }, { type: 'DATE', pattern: 'd mmm yyyy' });
  assert.deepEqual({ ...on(calls, 11, 2).cell.userEnteredFormat.numberFormat }, { type: 'TIME', pattern: 'hh:mm' });
  assert.equal(on(calls, 11, 3).cell.userEnteredFormat.numberFormat.type, 'NUMBER');
  assert.match(on(calls, 11, 3).cell.userEnteredFormat.numberFormat.pattern, /\[Red\]/);
  assert.equal(on(calls, 11, 5).cell.userEnteredFormat.numberFormat.type, 'DATE_TIME');
  assert.equal(on(calls, 11, 1).range.startRowIndex, 1);
  assert.equal(on(calls, 11, 1).range.endRowIndex, undefined);
});

test('a column in the pricing currency is found, and text columns are left alone', () => {
  const { hub, services, calls } = setup();
  hub.formatFile_(services, 'F1', 'month');
  assert.ok(on(calls, 11, 4));
  assert.equal(on(calls, 11, 0), undefined);
  assert.equal(on(calls, 11, 6), undefined);
});

test('a file is formatted once, in one call', () => {
  const { hub, services, calls } = setup();
  hub.formatFile_(services, 'F1', 'month');
  hub.formatFile_(services, 'F1', 'month');
  assert.equal(calls.length, 1);
  hub.formatFile_(services, 'F2', 'month');
  assert.equal(calls.length, 2);
});

test('the tabs the hub fills with formulas get their formats too', () => {
  const { hub, services, calls } = setup();
  hub.formatFile_(services, 'F1', 'myShop');
  assert.equal(on(calls, 33, 3).cell.userEnteredFormat.numberFormat.pattern, '0;[Red]-0');
  assert.equal(on(calls, 33, 7).cell.userEnteredFormat.numberFormat.type, 'DATE');
});
