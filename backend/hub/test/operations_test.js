// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const client = require('./support/test_client');
const { readyShop, named } = require('./support/shop_fixture');

const NOV_3 = 1793700000; // 3 November 2026, 12:00 in Harare
const day = (date) => Date.UTC(...date) / 1000 + 10 * 3600;

function masterData(google) {
  google.Sheets.cells.Products = [
    ['Product ID', 'Name', 'Price (USD)', 'Active'],
    ['P001', 'Bread loaf', 1.5, 'Yes'],
    ['P002', 'Stopped item', 2, 'No'],
    ['P003', 'No price', '', 'Yes'],
    ['', '', '', ''],
  ];
  google.Sheets.cells.Locations = [['Location', 'Name', 'Active'], ['Main', 'Main shop', 'Yes']];
  google.Sheets.cells.Settings = [['Setting', 'Value', 'Note'], ['Rate policy', 'Daily rate', '']];
}

test('changes.pull returns master data by field ID, with amounts as strings', () => {
  const { send, owner, google } = readyShop();
  masterData(google);
  const { result } = send(owner, 'changes.pull');
  assert.deepEqual(result.tables.Products[0],
    { product_id: 'P001', name: 'Bread loaf', price_pricing: '1.5', active: 'Yes' });
  assert.equal(result.tables.Locations[0].location, 'Main');
  assert.equal(result.unchanged, false);
});

test('blank rows are dropped, and bad rows are skipped and listed', () => {
  const { send, owner, google } = readyShop();
  masterData(google);
  const { result } = send(owner, 'changes.pull');
  assert.equal(result.tables.Products.length, 2);
  assert.deepEqual(result.skipped, [{ table: 'Products', row: 4, reason: 'A product needs an ID, a name and a price.' }]);
});

test('a phone already up to date gets a short reply', () => {
  const { send, owner, google } = readyShop();
  masterData(google);
  const first = send(owner, 'changes.pull').result;
  const second = send(owner, 'changes.pull', { since: first.version }).result;
  assert.deepEqual(second, { unchanged: true, version: first.version });
});

test('Stock gets a row per active product and location, with live formulas', () => {
  const { send, owner, google, drive } = readyShop();
  masterData(google);
  send(owner, 'changes.pull');
  const write = google.Sheets.writes.find((w) => w.spreadsheetId === named(drive, 'My Shop').id
    && w.request.data[0].range.startsWith("'Stock'"));
  assert.equal(write.request.valueInputOption, 'USER_ENTERED');
  assert.equal(write.request.data[0].range, "'Stock'!A2:H2");
  const row = write.request.data[0].values[0];
  assert.equal(row[0], 'P001');
  assert.equal(row[2], 'Main');
  assert.match(row[3], /^=SUMIFS\('Stock Ledger'.*\$A2/);
});

test('an ID that looks like a number or a formula stays text in Stock', () => {
  const { send, owner, google } = readyShop();
  masterData(google);
  google.Sheets.cells.Products[1][0] = '007';
  send(owner, 'changes.pull');
  assert.equal(google.Sheets.writes.at(-1).request.data[0].values[0][0], "'007");
});

test('unchanged master data rewrites no Stock rows', () => {
  const { send, owner, google } = readyShop();
  masterData(google);
  send(owner, 'changes.pull');
  const writes = google.Sheets.writes.length;
  send(owner, 'changes.pull');
  assert.equal(google.Sheets.writes.length, writes);
});

test('removing a product blanks its old Stock row', () => {
  const { send, owner, google } = readyShop();
  masterData(google);
  google.Sheets.cells.Products.push(['P004', 'Sugar', 2, 'Yes']);
  send(owner, 'changes.pull');
  google.Sheets.cells.Products.pop();
  send(owner, 'changes.pull');
  const last = google.Sheets.writes.at(-1).request.data[0];
  assert.equal(last.range, "'Stock'!A2:H3");
  assert.deepEqual(last.values[1], ['', '', '', '', '', '', '', '']);
});

test('status reports health and never a secret', () => {
  const { send, owner, hub } = readyShop();
  send(owner, 'journal.put', client.batch(1, [client.saleEvent('P1-E261103-0001')]));
  const reply = send(owner, 'status');
  assert.equal(reply.result.hub, hub.HUB_VERSION_);
  assert.deepEqual(reply.result.protocols, [1]);
  assert.equal(reply.result.views.queued, 0);
  assert.deepEqual(reply.result.phones[0],
    { device: 'P1', name: 'Owner phone', role: 'owner', through: 1, viewed: 1, lastSeen: NOV_3 });
  assert.equal(JSON.stringify(reply).includes(owner.secret), false);
});

test('setup installs the two timers once', () => {
  const { setup, google } = readyShop();
  setup();
  assert.deepEqual(google.ScriptApp.created, ['runViews every 15 minutes', 'dailyJob every day at 3']);
});

test('the daily job leaves next month alone before the 25th', () => {
  const { hub, services, drive } = readyShop();
  hub.runDaily_(services());
  assert.equal(named(drive, '2026-12 December'), undefined);
});

test('from the 25th, the daily job makes next month, even with every phone off', () => {
  const { hub, services, drive, google } = readyShop();
  google.clock.seconds = day([2026, 10, 25]);
  hub.runDaily_(services());
  assert.ok(named(drive, '2026-12 December'));
});

test('in late December it makes the new year folder too', () => {
  const { hub, services, drive, google } = readyShop();
  google.clock.seconds = day([2026, 11, 28]);
  hub.runDaily_(services());
  assert.ok(named(drive, '2027'));
  assert.deepEqual([...named(drive, '2027-01 January').parents], [named(drive, '2027').id]);
});

test('one failing daily step does not stop the others', () => {
  const { hub, services, google } = readyShop();
  google.clock.seconds = day([2026, 10, 25]);
  google.UrlFetchApp.routes.clear(); // next month's template can't be fetched
  google.Sheets.cells.Summary = [['Month', 3]];
  hub.runDaily_(services());
  assert.ok(google.Sheets.writes.some((w) => w.request.data[0].range.startsWith("'Months'")));
});

test('a phone cannot write the Months tab', () => {
  const { send, owner, google, services } = readyShop();
  const event = client.saleEvent('P1-E261103-0001');
  event.rows = { Months: [{ year: '1999' }] };
  send(owner, 'journal.put', client.batch(1, [event]));
  assert.equal(google.Sheets.writes.some((w) => w.request.data[0].range.startsWith("'Months'")), false);
  assert.equal(services().store.get('view:skipped'), '1');
});

test('a new year moves Data year on', () => {
  const { hub, services, drive, google } = readyShop();
  google.clock.seconds = day([2027, 0, 1]);
  hub.runDaily_(services());
  const write = google.Sheets.writes.find((w) => w.spreadsheetId === named(drive, 'My Shop').id
    && w.request.data[0].range === 'Settings!B29' && w.request.data[0].values[0][0] === 2027);
  assert.ok(write);
});

test('the daily job keeps the Months tab up to date, in one row per month', () => {
  const { hub, services, google, drive } = readyShop();
  google.Sheets.cells.Summary = [['Month', 3, '', '', ''], ['Sales, VAT included', 10], ['VAT in those sales', 1],
    ['Sales before VAT', 9], ['Cost of goods sold', 5], ['Gross profit', 4],
    ["VAT in this month's sales, less returns", 1, 2, 0]];
  google.Sheets.cells.Payments = [['Method', 'Currency', 'Amount', 'Status'], ['Cash USD', 'USD', 10, 'Paid'],
    ['Cash USD', 'USD', -2.5, 'Given'], ['Kept change USD', 'USD', 5, 'Paid'], ['Cash ZWG', 'ZWG', 30, 'Paid'],
    ['EcoCash USD', 'USD', 7, 'Failed']];
  hub.runDaily_(services());
  hub.runDaily_(services());
  const months = google.Sheets.writes.filter((w) => w.spreadsheetId === named(drive, 'My Shop').id
    && w.request.data[0].range.startsWith("'Months'"));
  assert.equal(months.length, 2);
  assert.equal(months[0].request.data[0].range, months[1].request.data[0].range);
  const heads = google.Sheets.headings.Months;
  const row = months[0].request.data[0].values[0];
  assert.equal(row[heads.indexOf('Year')], 2026);
  assert.equal(row[heads.indexOf('Month')], 'Nov');
  assert.equal(row[heads.indexOf('Status')], 'To date');
  assert.equal(row[heads.indexOf('Sales')], 3);
  assert.equal(row[heads.indexOf('Gross profit (USD)')], 4);
  assert.equal(row[heads.indexOf('Output VAT ZWG')], 2);
  assert.equal(row[heads.indexOf('Money in USD')], 7.5);
  assert.equal(row[heads.indexOf('Money in ZWG')], 30);
});
