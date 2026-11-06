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
  assert.match(html, /href="tel:\+263771234567"/);
  assert.match(html, /wa\.me\/263771234567/);
  assert.match(html, /google\.com\/maps\/search\/\?api=1&amp;query=12%20Market%20St%2C%20Harare/);
  assert.match(html, /<base target="_top">/);
});

for (const [typed, digits] of [['0771234567', '263771234567'], ['771234567', '263771234567'],
  ['263771234567', '263771234567'], ['+263 77 123 4567', '263771234567'], ['+27 82 123 4567', '27821234567']]) {
  test(`the phone number ${typed} dials as +${digits}`, () => {
    const { hub, google } = readyShop();
    shopData(google);
    google.Sheets.cells.Settings[3][1] = typed;
    const { html } = page(hub);
    assert.equal(html.includes(`tel:+${digits}"`), true);
    assert.equal(html.includes(`wa.me/${digits}"`), true);
  });
}

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

const many = (count) => Array.from({ length: count }, (_, i) =>
  [`P${i}`, `Item ${i}`, i % 2 ? 'Bakery' : 'Groceries', 'each', 1 + i / 100, 0.5, 'Yes', '']);

function bigShop(count) {
  const fixture = readyShop();
  shopData(fixture.google);
  fixture.google.Sheets.cells.Products = [HEADS, ...many(count)];
  return fixture;
}

test('a shop of up to 200 products carries them all, and searches on the phone', () => {
  const { hub } = bigShop(200);
  const { html } = page(hub);
  assert.equal(html.split('class="price"').length - 1, 200);
  assert.equal(html.includes('class="more"'), false);
});

test('a bigger shop opens with 50 products, so the first visit stays small', () => {
  const { hub } = bigShop(1000);
  const { html } = page(hub);
  assert.equal(html.split('class="price"').length - 1, 50);
  assert.match(html, /class="more"/);
  assert.match(html, /\.more\[hidden\]\{display:none\}/);
  assert.match(html, /Search 1000 products/);
  assert.ok(html.length < 40000, `${html.length} characters`);
});

test('Show more walks through every product', () => {
  const { hub } = bigShop(220);
  page(hub);
  const first = hub.shopProducts('', '', 0);
  assert.equal(first.items.length, 50);
  assert.equal(first.more, true);
  assert.equal(hub.shopProducts('', '', 1).items[0].name, 'Item 50');
  const last = hub.shopProducts('', '', 4);
  assert.equal(last.items.length, 20);
  assert.equal(last.more, false);
});

test('search and categories cover products beyond the first page', () => {
  const { hub } = bigShop(1000);
  page(hub);
  assert.deepEqual([...hub.shopProducts('item 999', '', 0).items].map((p) => p.name), ['Item 999']);
  assert.equal(hub.shopProducts('ITEM 999', 'Groceries', 0).items.length, 0);
  assert.equal(hub.shopProducts('', 'Bakery', 0).items[0].category, 'Bakery');
});

test('5000 products fit in the cache, and searching them reads no sheet', () => {
  const { hub, google } = bigShop(5000);
  page(hub);
  const reads = google.Sheets.gets;
  assert.equal(hub.shopProducts('item 4999', '', 0).items.length, 1);
  assert.equal(google.Sheets.gets, reads);
});

test('search answers hold only what the page shows', () => {
  const { hub } = bigShop(300);
  page(hub);
  assert.deepEqual(Object.keys(hub.shopProducts('', '', 0).items[0]).sort(), ['category', 'name', 'price', 'unit']);
});

test('search survives a lost cache, and nonsense input', () => {
  const { hub, google } = bigShop(300);
  page(hub);
  google.CacheService.getScriptCache().remove('storefront:list:0');
  assert.equal(hub.shopProducts('item 299', '', 0).items.length, 1);
  assert.equal(hub.shopProducts(null, undefined, 'x').items.length, 50);
  assert.equal(hub.shopProducts('', '', -5).items.length, 50);
});

test('turning the page off empties the list search reads', () => {
  const { hub, google, send, owner } = bigShop(300);
  page(hub);
  google.Sheets.cells.Settings.find((row) => row[0] === 'Shop page')[1] = 'Off';
  send(owner, 'changes.pull');
  assert.equal(hub.shopProducts('', '', 0).items.length, 0);
});

test('a broken read shows the neutral page, not an error', () => {
  const { hub, google } = readyShop();
  google.Sheets.Spreadsheets.Values.batchGet = () => { throw new Error('Sheets is unavailable: secret detail'); };
  const { html } = page(hub);
  assert.match(html, /not available/);
  assert.equal(html.includes('secret detail'), false);
});
