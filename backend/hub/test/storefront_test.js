// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readyShop, setupHub } = require('./support/shop_fixture');

const HEADS = ['Product ID', 'Name', 'Category', 'Unit', 'Price (USD)', 'Cost (USD)', 'Active', 'Note'];

function shopData(google, changes = {}) {
  google.Sheets.cells.Settings = [['Setting', 'Value', 'Note'],
    ['Business name', "Chipo's Corner Shop", ''], ['Address', '12 Market St, Harare', ''], ['Phone', '0771234567', ''],
    ['TIN', '2000123456', ''], ['Owner', 'Chipo Moyo', ''], ['Accepted currencies', 'USD, ZWG', ''],
    ['Shop page', changes.page ?? 'On', '']];
  google.Sheets.cells.Products = [HEADS,
    ['P001', 'Bread loaf', 'Bakery', 'loaf', 1.5, 0.98, 'Yes', 'Supplier owes us a crate'],
    ['P002', 'Cooking oil 2L', 'Groceries', 'bottle', 4, 2.75, 'Yes', ''],
    ['P003', 'Old stock', 'Groceries', 'each', 9, 7, 'No', ''],
    ...(changes.products ?? [])];
  google.Sheets.cells.Staff = [['Staff ID', 'Name'], ['S1', 'Tendai Secret']];
  google.Sheets.cells.Contacts = [['Contact ID', 'Name'], ['C1', 'Private Customer']];
}

const page = (hub) => hub.doGet({ parameter: {} });

test('the page shows the shop, its contacts and its prices with their currency', () => {
  const { hub, google } = readyShop();
  shopData(google);
  const { html, title, meta } = page(hub);
  assert.equal(title, "Chipo's Corner Shop");
  assert.equal(meta.viewport, 'width=device-width, initial-scale=1');
  assert.match(html, /Chipo&#39;s Corner Shop/);
  assert.match(html, /12 Market St, Harare/);
  assert.match(html, /Bread loaf/);
  assert.match(html, /USD 1\.50/);
  assert.match(html, /USD 4\.00/);
  assert.match(html, /href="tel:0771234567"/);
  assert.match(html, /wa\.me\/263771234567/);
  assert.match(html, /google\.com\/maps\/search\/\?api=1&amp;query=12%20Market%20St%2C%20Harare/);
  assert.match(html, /<base target="_top">/);
});

test('nothing private reaches the page', () => {
  const { hub, google } = readyShop();
  shopData(google);
  const { html } = page(hub);
  for (const secret of ['0.98', '2.75', '2000123456', 'Chipo Moyo', 'Supplier owes', 'Old stock', 'Tendai Secret', 'Private Customer']) {
    assert.equal(html.includes(secret), false, secret);
  }
});

test('anything the owner typed is escaped', () => {
  const { hub, google } = readyShop();
  shopData(google, { products: [['P009', '<script>alert(1)</script>', '"><b>', 'each', 1, 1, 'Yes', '']] });
  const { html } = page(hub);
  assert.equal(html.includes('<script>alert'), false);
  assert.equal(html.includes('"><b>'), false);
  assert.match(html, /&lt;script&gt;alert/);
});

test('turning the page off hides everything about the shop', () => {
  const { hub, google } = readyShop();
  shopData(google, { page: 'Off' });
  const { html } = page(hub);
  assert.equal(html.includes('Chipo'), false);
  assert.equal(html.includes('Bread loaf'), false);
  assert.match(html, /not available/);
});

test('a hub that is not set up shows the same neutral page', () => {
  const { hub } = setupHub();
  const { html } = page(hub);
  assert.match(html, /not available/);
});

test('a page with no phone or address leaves those buttons out', () => {
  const { hub, google } = readyShop();
  shopData(google);
  google.Sheets.cells.Settings = [['Setting', 'Value', 'Note'], ['Business name', 'Tuck', '']];
  const { html } = page(hub);
  assert.equal(html.includes('tel:'), false);
  assert.equal(html.includes('wa.me'), false);
  assert.equal(html.includes('maps/search'), false);
});

test('a shop with no products gets a plain message', () => {
  const { hub, google } = readyShop();
  shopData(google);
  google.Sheets.cells.Products = [HEADS];
  assert.match(page(hub).html, /Ask in the shop/);
});

test('visitors are served from the cache, whatever the traffic', () => {
  const { hub, google } = readyShop();
  shopData(google);
  page(hub);
  const reads = google.Sheets.gets;
  const properties = google.PropertiesService.getScriptProperties().calls.reads;
  for (let i = 0; i < 50; i++) page(hub);
  assert.equal(google.Sheets.gets, reads);
  assert.equal(google.PropertiesService.getScriptProperties().calls.reads, properties);
});

test('a phone pulling new prices refreshes the page', () => {
  const { hub, google, send, owner } = readyShop();
  shopData(google);
  page(hub);
  google.Sheets.cells.Products[1][4] = 2;
  send(owner, 'changes.pull');
  assert.match(page(hub).html, /USD 2\.00/);
});

test('a broken read shows the neutral page, not an error', () => {
  const { hub, google } = readyShop();
  google.Sheets.Spreadsheets.Values.batchGet = () => { throw new Error('Sheets is unavailable: secret detail'); };
  const { html } = page(hub);
  assert.match(html, /not available/);
  assert.equal(html.includes('secret detail'), false);
});
