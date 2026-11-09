// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHub } = require('./support/load_hub');

const HEADS = ['Payment ID', 'Status', 'Amount (USD)', 'Debit account', 'Credit account'];

test('a month adds up what its Payments moved, debit positive', () => {
  const { hub } = loadHub();
  const moved = hub.accountMovements_([HEADS,
    ['1', 'Paid', 5, 'Till cash', 'Sales'],
    ['2', 'Given', 1.1, 'Sales', 'Till cash'],
    ['3', 'Paid', 2.2, 'Mobile money', 'Sales'],
    ['4', 'Paid later', 20, 'Bank', 'Customers owe'],
    ['5', 'Failed', '', '', ''],
  ], 'USD');
  assert.equal(moved['Till cash'], 3.9);
  assert.equal(moved['Mobile money'], 2.2);
  assert.equal(moved.Bank, 20);
  assert.equal(moved['Customers owe'], -20);
  assert.equal(moved.Sales, -6.1);
});

test('the amounts add up to nothing, because every row has two sides', () => {
  const { hub } = loadHub();
  const moved = hub.accountMovements_([HEADS, ['1', 'Paid', 0.1, 'Till cash', 'Sales'], ['2', 'Paid', 0.2, 'Bank', 'Sales']], 'USD');
  assert.equal(Math.round(Object.values(moved).reduce((sum, value) => sum + value, 0) * 100), 0);
});

test('a month with no payments moves nothing', () => {
  const { hub } = loadHub();
  assert.deepEqual({ ...hub.accountMovements_([], 'USD') }, {});
});

test('the contract names a Months column for each account the month files move', () => {
  const { hub } = loadHub();
  const fields = hub.VIEW_CONTRACT_.tables.Months.fields;
  for (const field of Object.values(hub.VIEW_CONTRACT_.monthAccounts)) assert.ok(fields[field], field);
});

test('the pricing currency in a heading is the shop\'s own', () => {
  const { hub } = loadHub();
  const moved = hub.accountMovements_([['Amount (ZWG)', 'Debit account', 'Credit account'], [10, 'Till cash', 'Sales']], 'ZWG');
  assert.equal(moved['Till cash'], 10);
});
