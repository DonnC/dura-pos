// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readyShop, named } = require('./support/shop_fixture');
const { hubWithSeller } = require('./support/hub_fixture');

const PHOTO = { kind: 'product', id: 'P001', contentType: 'image/jpeg', data: Buffer.from('jpeg bytes').toString('base64') };
const XLSX = 'application%2Fvnd.openxmlformats-officedocument.spreadsheetml.sheet';

test('a product photo lands in Product photos, once', () => {
  const { send, owner, drive } = readyShop();
  const first = send(owner, 'attachment.put', PHOTO).result;
  assert.equal(first.name, 'P001.jpg');
  const folder = named(drive, 'Product photos');
  const file = named(drive, 'P001.jpg');
  assert.deepEqual([...file.parents], [folder.id]);
  assert.equal(file.content, 'jpeg bytes');
  assert.equal(send(owner, 'attachment.put', PHOTO).result.file, first.file);
  assert.equal(drive.files.filter((f) => f.name === 'P001.jpg').length, 1);
});

test('a supplier invoice lands under its year', () => {
  const { send, owner, drive } = readyShop();
  send(owner, 'attachment.put', { ...PHOTO, kind: 'invoice', id: 'P1-PUR261103-0001' });
  const folder = named(drive, 'Supplier invoices');
  assert.deepEqual([...folder.parents], [named(drive, '2026').id]);
  assert.deepEqual([...named(drive, 'P1-PUR261103-0001.jpg').parents], [folder.id]);
});

test('bad photos are refused', () => {
  const { send, owner } = readyShop();
  for (const bad of [{ kind: 'selfie' }, { id: '../x' }, { contentType: 'text/html' }, { data: '' }, { data: 'x'.repeat(1400001) }]) {
    assert.equal(send(owner, 'attachment.put', { ...PHOTO, ...bad }).error.code, 'bad_attachment');
  }
});

test('an Excel export saves a copy in Exports', () => {
  const { send, owner, drive, google } = readyShop();
  const month = named(drive, '2026-11 November');
  google.UrlFetchApp.routes.set(`https://www.googleapis.com/drive/v3/files/${month.id}/export?mimeType=${XLSX}`, { code: 200, body: 'xlsx bytes' });
  const { result } = send(owner, 'export.request', { file: '2026-11', format: 'xlsx' });
  assert.equal(result.name, '2026-11 November 2026-11-03.xlsx');
  const saved = named(drive, result.name);
  assert.deepEqual([...saved.parents], [named(drive, 'Exports').id]);
  assert.equal(saved.content, 'xlsx bytes');
});

test('a failed export is retryable', () => {
  const { send, owner } = readyShop();
  assert.equal(send(owner, 'export.request', { file: 'myShop', format: 'xlsx' }).error.category, 'retryable_unavailable');
});

test('a CSV export quotes properly and keeps formulas from running', () => {
  const { send, owner, drive, google } = readyShop();
  google.Sheets.cells.Sales = [['Sale ID', 'Note'], ['S1', 'a, "b"'], ['S2', '=HYPERLINK("x")'], ['S3', '-2.50']];
  const { result } = send(owner, 'export.request', { file: '2026-11', format: 'csv', table: 'Sales' });
  assert.equal(result.name, '2026-11 November Sales 2026-11-03.csv');
  assert.equal(named(drive, result.name).content,
    'Sale ID,Note\r\nS1,"a, ""b"""\r\nS2,"\'=HYPERLINK(""x"")"\r\nS3,-2.50');
});

test('exports are refused for bad requests and for sellers', () => {
  const { send, owner } = readyShop();
  assert.equal(send(owner, 'export.request', { file: '2020-01', format: 'xlsx' }).error.code, 'bad_export');
  assert.equal(send(owner, 'export.request', { file: 'myShop', format: 'csv' }).error.code, 'bad_export');
  const { send: sendTo, seller } = hubWithSeller();
  assert.equal(sendTo(seller, 'export.request', { file: 'myShop', format: 'xlsx' }).error.code, 'owner_only');
});
