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

function saleEvent(id, overrides = {}) {
  return {
    id,
    type: 'sale.completed',
    at: '2026-11-03T16:20:30+02:00',
    data: {},
    rows: {
      Sales: [{
        sale_id: id, date: '2026-11-03', time: '16:20:30', phone: 'P1', total: '2.00',
        total_pricing: '2.00', currency: 'USD', synced_at: '2026-11-03T16:25:00', ...overrides,
      }],
      'Stock Ledger': [{ row_id: `${id}-L`, date: '2026-11-03', product_id: 'P001', qty: '-2' }],
    },
  };
}

const rowsWritten = (google, id) => google.Sheets.writes
  .filter((w) => w.spreadsheetId === id && w.request.data[0].range.includes('!A'))
  .flatMap((w) => w.request.data);

test('a sale lands in the month file, by heading, as real numbers and dates', () => {
  const { send, owner, drive, google } = readyShop();
  send(owner, 'journal.put', client.batch(1, [saleEvent('P1-S261103-0001')]));
  const month = named(drive, '2026-11 November');
  const [sales] = rowsWritten(google, month.id);
  assert.match(sales.range, /^'Sales'!A2:[A-Z]+2$/);
  const headings = google.Sheets.headings.Sales;
  const row = sales.values[0];
  assert.equal(row[headings.indexOf('Sale ID')], 'P1-S261103-0001');
  assert.equal(row[headings.indexOf('Total')], 2);
  assert.equal(row[headings.indexOf('Total (USD)')], 2);
  assert.equal(row[headings.indexOf('Date')], 46329);
  assert.ok(Math.abs(row[headings.indexOf('Time')] - 58830 / 86400) < 1e-9);
  assert.equal(row[headings.indexOf('Customer')], null, 'unset cells are left alone');
});

test('stock rows go to My Shop', () => {
  const { send, owner, drive, google } = readyShop();
  send(owner, 'journal.put', client.batch(1, [saleEvent('P1-S261103-0001')]));
  const [stock] = rowsWritten(google, named(drive, 'My Shop').id);
  assert.match(stock.range, /^'Stock Ledger'!A2:/);
});

test('each batch continues on the next free row', () => {
  const { send, owner, drive, google } = readyShop();
  send(owner, 'journal.put', client.batch(1, [saleEvent('P1-S261103-0001'), saleEvent('P1-S261103-0002')]));
  send(owner, 'journal.put', client.batch(2, [saleEvent('P1-S261103-0003')]));
  const ranges = rowsWritten(google, named(drive, '2026-11 November').id).map((d) => d.range);
  assert.match(ranges[0], /^'Sales'!A2:[A-Z]+3$/);
  assert.match(ranges[1], /^'Sales'!A4:[A-Z]+4$/);
});

test('a late sale reaches its own month, creating that file if needed', () => {
  const { send, owner, drive, google } = readyShop();
  const late = saleEvent('P1-S261031-0009');
  late.at = '2026-10-31T17:00:00+02:00';
  send(owner, 'journal.put', client.batch(1, [late]));
  const october = named(drive, '2026-10 October');
  assert.ok(october, 'October was created');
  assert.equal(rowsWritten(google, october.id).length, 1);
});

test('a failed view never fails the upload, and a retry adds no duplicate', () => {
  const { send, owner, drive, google, hub, services } = readyShop();
  google.Sheets.failOnCall = google.Sheets.calls + 1;
  const reply = send(owner, 'journal.put', client.batch(1, [saleEvent('P1-S261103-0001')]));
  assert.deepEqual(reply.result, { status: 'accepted', through: 1 });
  assert.equal(rowsWritten(google, named(drive, '2026-11 November').id).length, 0);

  hub.drainViews_(services());
  const first = rowsWritten(google, named(drive, '2026-11 November').id);
  assert.equal(first.length, 1);
  assert.match(first[0].range, /^'Sales'!A2:/);

  hub.drainViews_(services());
  assert.equal(rowsWritten(google, named(drive, '2026-11 November').id).length, 1);
});

test('a batch that failed part-way rewrites the same rows', () => {
  const { send, owner, drive, google, hub, services } = readyShop();
  // Month write succeeds, My Shop write fails: the batch must not advance.
  google.Sheets.failOnCall = google.Sheets.calls + 2;
  send(owner, 'journal.put', client.batch(1, [saleEvent('P1-S261103-0001')]));
  hub.drainViews_(services());
  const month = rowsWritten(google, named(drive, '2026-11 November').id);
  assert.equal(month.length, 2);
  assert.equal(month[0].range, month[1].range);
  send(owner, 'journal.put', client.batch(2, [saleEvent('P1-S261103-0002')]));
  assert.match(rowsWritten(google, named(drive, '2026-11 November').id)[2].range, /^'Sales'!A3:/);
});

test('fields and tables the contract does not know are skipped and counted', () => {
  const { send, owner, google, drive, services } = readyShop();
  const event = saleEvent('P1-S261103-0001', { invented_field: 'x' });
  event.rows.Mystery = [{ a: 1 }];
  const reply = send(owner, 'journal.put', client.batch(1, [event]));
  assert.equal(reply.ok, true);
  assert.equal(rowsWritten(google, named(drive, '2026-11 November').id).length, 1);
  assert.equal(services().store.get('view:skipped'), '2');
});

test('headings are read once per file, then cached', () => {
  const { send, owner, google } = readyShop();
  const before = google.Sheets.gets;
  send(owner, 'journal.put', client.batch(1, [saleEvent('P1-S261103-0001')]));
  send(owner, 'journal.put', client.batch(2, [saleEvent('P1-S261103-0002')]));
  assert.equal(google.Sheets.gets - before, 2); // the month file and My Shop
});

test('a tab running out of rows is extended before writing', () => {
  const { send, owner, google } = readyShop();
  google.Sheets.rowCount = 1;
  send(owner, 'journal.put', client.batch(1, [saleEvent('P1-S261103-0001')]));
  assert.ok(google.Sheets.grown.length >= 1);
  assert.equal(google.Sheets.grown[0].dimension, 'ROWS');
});

test('events with no rows are journalled and touch no sheet', () => {
  const { send, owner, google } = readyShop();
  const before = google.Sheets.calls;
  send(owner, 'journal.put', client.batch(1, [client.saleEvent('P1-E261103-0001')]));
  assert.equal(google.Sheets.calls, before);
});
