// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const client = require('./support/test_client');
const { installedHub, INSTALL_CODE } = require('./support/hub_fixture');

const SHEET = 'application/vnd.google-apps.spreadsheet';
const FOLDER = 'application/vnd.google-apps.folder';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');
const templateSet = (code) => ({
  myShop: { url: `https://example.test/v1/${code}/my_shop.xlsx`, sha256: sha(`${code} my shop bytes`) },
  month: { url: `https://example.test/v1/${code}/month.xlsx`, sha256: sha(`${code} month bytes`) },
});
const TEMPLATES = { USD: templateSet('USD'), ZWG: templateSet('ZWG'), ZAR: templateSet('ZAR') };

/** An installed hub with templates served, the owner paired. */
function setupHub(options = {}) {
  const fixture = installedHub({ templates: TEMPLATES, useDriveJournal: true, ...options });
  const routes = fixture.google.UrlFetchApp.routes;
  for (const code of Object.keys(TEMPLATES)) {
    routes.set(TEMPLATES[code].myShop.url, { code: 200, body: `${code} my shop bytes` });
    routes.set(TEMPLATES[code].month.url, { code: 200, body: `${code} month bytes` });
  }
  fixture.google.PropertiesService.getScriptProperties().deleteProperty('businessId');
  const owner = fixture.pair(INSTALL_CODE, 'Owner phone').result;
  const setup = (body = { name: "Chipo's Corner Shop", timeZone: 'Africa/Harare', pricingCurrency: 'USD' }) =>
    fixture.send(owner, 'setup.run', body);
  return { ...fixture, owner, setup, drive: fixture.google.Drive };
}

const named = (drive, name) => drive.files.find((f) => f.name === name);

test('setup builds the shop folder, My Shop and this month from templates', () => {
  const { setup, drive } = setupHub();
  const reply = setup();
  assert.equal(reply.ok, true, JSON.stringify(reply));

  const root = named(drive, 'Dura POS');
  const shop = named(drive, "Chipo's Corner Shop");
  const journal = named(drive, 'Journal');
  const year = named(drive, '2026');
  assert.equal(root.mimeType, FOLDER);
  assert.equal(root.parents, undefined);
  assert.deepEqual([...shop.parents], [root.id]);
  assert.deepEqual([...journal.parents], [shop.id]);
  assert.deepEqual([...year.parents], [shop.id]);

  const myShop = named(drive, 'My Shop');
  assert.equal(myShop.mimeType, SHEET);
  assert.equal(myShop.uploadType, XLSX);
  assert.equal(myShop.content, 'USD my shop bytes');
  assert.deepEqual([...myShop.parents], [shop.id]);

  const month = named(drive, '2026-11 November');
  assert.equal(month.mimeType, SHEET);
  assert.equal(month.content, 'USD month bytes');
  assert.deepEqual([...month.parents], [year.id]);
  assert.ok(drive.files.every((f) => f.fields === 'id'), 'Drive returns only the id');

  assert.equal(reply.result.status, 'ready');
  assert.equal(reply.result.files.myShop, myShop.id);
  assert.equal(reply.result.files.month, month.id);
  assert.equal(reply.result.period, '2026-11');
});

test('the business ID is readable: name, date and a short random part', () => {
  const { setup } = setupHub();
  assert.match(setup().result.business, /^chipos-corner-shop-261103-[0-9a-f]{4}$/);
});

test('business.json records the directory and no secrets', () => {
  const { setup, drive, owner } = setupHub();
  const { business } = setup().result;
  const directory = named(drive, 'business.json');
  const content = JSON.parse(directory.content);
  assert.equal(content.businessId, business);
  assert.equal(content.timeZone, 'Africa/Harare');
  assert.equal(content.pricingCurrency, 'USD');
  assert.equal(content.files.myShop, named(drive, 'My Shop').id);
  assert.equal(directory.content.includes(owner.secret), false);
});

test('both templates are downloaded in one parallel fetch', () => {
  const { setup, google } = setupHub();
  setup();
  assert.deepEqual([...google.UrlFetchApp.log].sort(),
    [TEMPLATES.USD.month.url, TEMPLATES.USD.myShop.url]);
});

test('running setup again creates nothing new and answers the same', () => {
  const { setup, drive, google } = setupHub();
  const first = setup().result;
  assert.equal(first.status, 'ready');
  const created = drive.files.length;
  assert.ok(created >= 6);
  const fetches = google.UrlFetchApp.log.length;
  const second = setup().result;
  assert.deepEqual(second, first);
  assert.equal(drive.files.length, created);
  assert.equal(google.UrlFetchApp.log.length, fetches);
});

test('setup resumes after a failure without duplicating finished steps', () => {
  const { setup, drive } = setupHub();
  drive.failOnCall = 5;
  const failed = setup();
  assert.equal(failed.error.category, 'retryable_unavailable');
  assert.equal(failed.error.code, 'storage_unavailable');
  const madeBeforeFailure = drive.files.map((f) => f.name);

  assert.equal(setup().ok, true);
  for (const name of madeBeforeFailure) {
    assert.equal(drive.files.filter((f) => f.name === name).length, 1, name);
  }
  assert.ok(named(drive, '2026-11 November'));
});

test('a template that does not match its hash is never converted', () => {
  const { setup, drive, google } = setupHub();
  google.UrlFetchApp.routes.set(TEMPLATES.USD.month.url, { code: 200, body: 'tampered' });
  const reply = setup();
  assert.equal(reply.error.category, 'integrity_conflict');
  assert.equal(reply.error.code, 'template_mismatch');
  assert.equal(drive.files.some((f) => f.mimeType === SHEET), false);
});

test('a template that cannot be downloaded is a retryable error', () => {
  const { setup, google } = setupHub();
  google.UrlFetchApp.routes.delete(TEMPLATES.USD.myShop.url);
  const reply = setup();
  assert.equal(reply.error.category, 'retryable_unavailable');
  assert.equal(reply.error.code, 'template_unavailable');
});

test('setup needs a shop name, a time zone and a pricing currency', () => {
  const { setup } = setupHub();
  for (const body of [
    {},
    { name: '', timeZone: 'Africa/Harare', pricingCurrency: 'USD' },
    { name: 'x'.repeat(81), timeZone: 'Africa/Harare', pricingCurrency: 'USD' },
    { name: 'Shop', timeZone: 'not a zone', pricingCurrency: 'USD' },
    { name: 'Shop', timeZone: 'Africa/Harare' },
    { name: 'Shop', timeZone: 'Africa/Harare', pricingCurrency: 'GBP' },
  ]) {
    const reply = setup(body);
    assert.equal(`${reply.error.category}/${reply.error.code}`, 'validation/bad_setup');
  }
});

test('only the owner can run setup', () => {
  const { send, owner, pair, setup } = setupHub();
  const { code } = send(owner, 'pairing.create').result;
  const seller = pair(code, 'Back counter').result;
  const reply = send(seller, 'setup.run', { name: 'Shop', timeZone: 'Africa/Harare', pricingCurrency: 'USD' });
  assert.equal(reply.error.code, 'owner_only');
  assert.equal(setup().ok, true);
});

test('after setup, journal batches are stored in the Journal folder', () => {
  const { setup, send, owner, drive } = setupHub();
  setup();
  const reply = send(owner, 'journal.put', client.batch(1, [client.saleEvent('P1-E261103-0001')]));
  assert.equal(reply.result.status, 'accepted');
  const stored = named(drive, 'P1-000001.json');
  assert.deepEqual([...stored.parents], [named(drive, 'Journal').id]);
});

test('a signed request reads Script Properties once before its lock and once inside', () => {
  const { send, owner, google } = setupHub();
  const calls = google.PropertiesService.getScriptProperties().calls;
  const before = calls.reads;
  send(owner, 'journal.put', client.batch(1, [client.saleEvent('P1-E261103-0001')]));
  assert.equal(calls.reads - before, 2);
});

test('the pricing currency chooses which templates are used', () => {
  const { setup, drive, google } = setupHub();
  const reply = setup({ name: 'Mai Rudo Stall', timeZone: 'Africa/Harare', pricingCurrency: 'ZWG' });
  assert.equal(reply.ok, true, JSON.stringify(reply));
  assert.equal(named(drive, 'My Shop').content, 'ZWG my shop bytes');
  assert.equal(named(drive, '2026-11 November').content, 'ZWG month bytes');
  assert.deepEqual([...google.UrlFetchApp.log].sort(), [TEMPLATES.ZWG.month.url, TEMPLATES.ZWG.myShop.url]);
});
