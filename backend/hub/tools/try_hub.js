// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Single commands against a real hub, without the app. `npm run trial` uses
// these for the whole test; run them by hand to look into one thing. It acts
// as a phone, using the same signing as the tests. Everything it makes stays in
// .try/, which Git ignores: the copy of the hub, the install code and the
// device secret.

'use strict';

const { execSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const client = require('../test/support/test_client');
const { ACTIONS_, ATTACHMENT_KINDS_, EXPORT_FORMATS_, PROVIDERS_, SHEET_WORDS_, TABLES_, WORKBOOKS_ } = require('../test/support/hub_names');

const HUB = path.join(__dirname, '..');
const TRY = path.join(HUB, '.try');
const DEVICE = path.join(TRY, 'device.json');
const DIST = path.join(HUB, '..', 'templates', 'dist');
const EVENT_TYPES = { sale: 'sale.completed', stockIn: 'stock.received' };
const RAW = 'https://raw.githubusercontent.com/DonnC/dura-pos/develop/backend/templates/dist';

/** Copies the hub into `folder`, with an install code and the template URLs filled in. */
function prepare(folder, base, nowSeconds) {
  const code = crypto.randomBytes(16).toString('hex');
  fs.mkdirSync(folder, { recursive: true });
  fs.cpSync(path.join(HUB, 'src'), folder, { recursive: true });
  const header = fs.readFileSync(path.join(folder, 'install_config.js'), 'utf8').split('var INSTALL_CODE_HASH_')[0];
  fs.writeFileSync(path.join(folder, 'install_config.js'),
    `${header}var INSTALL_CODE_HASH_ = '${client.sha256Hex(code)}';\nvar INSTALLED_AT_ = ${nowSeconds};\n`);
  const { templates } = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));
  const set = {};
  for (const [currency, files] of Object.entries(templates)) {
    set[currency] = {};
    for (const [key, entry] of Object.entries(files)) {
      set[currency][key] = { url: `${base}/${encodeURI(entry.file)}`, sha256: entry.sha256 };
    }
  }
  const manifest = path.join(folder, 'template_manifest.js');
  const text = fs.readFileSync(manifest, 'utf8');
  fs.writeFileSync(manifest, text.replace(/var TEMPLATE_MANIFEST_ = \{[\s\S]*?\n\};/,
    `var TEMPLATE_MANIFEST_ = ${JSON.stringify(set, null, 2)};`));
  return code;
}

async function post(url, request) {
  const reply = await fetch(url, { method: 'POST', body: JSON.stringify(request), redirect: 'follow' });
  const text = await reply.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`The hub did not answer JSON (HTTP ${reply.status}). Did you authorise the script and deploy it?`);
  }
}

function loadDevice() {
  if (!fs.existsSync(DEVICE)) throw new Error('Pair first: node tools/try_hub.js pair <hub url> <install code>');
  return JSON.parse(fs.readFileSync(DEVICE, 'utf8'));
}

async function send(action, body) {
  const device = loadDevice();
  const ts = Math.floor(Date.now() / 1000);
  return post(device.url, client.signed({ device: device.device, secret: device.secret, action, body, ts }));
}

/** Used when a shop has no products yet. */
const SAMPLE_ITEM = { product_id: 'P001', product: 'Test product', location: 'Main', price: '1.00', cost: '0.50' };

/** The first active product and location, so stock rows land on real ones. */
function itemFrom(tables = {}) {
  const active = (row) => row.active !== SHEET_WORDS_.no;
  const product = (tables[TABLES_.products] ?? []).find(active);
  const location = (tables[TABLES_.locations] ?? []).find(active);
  if (!product || !location) return SAMPLE_ITEM;
  return {
    product_id: product.product_id, product: product.name, location: location.location,
    price: Number(product.price_pricing).toFixed(2), cost: Number(product.cost_pricing).toFixed(2),
  };
}

const money = (value) => value.toFixed(2);
/** A date and time as the shop's clock shows them, which is what a phone records. */
function clock(at) {
  const [date, time] = new Date(at).toLocaleString('sv-SE', { timeZone: 'Africa/Harare' }).split(' ');
  return { date, time };
}

/**
 * One cash sale, as a phone records it: the sale, its line and its payment in
 * the month file, and the stock leaving in the Stock Ledger.
 */
function saleEvent(id, deviceId, at, item = SAMPLE_ITEM, qty = 1) {
  const { date, time } = clock(at);
  const total = money(Number(item.price) * qty);
  const cost = money(Number(item.cost) * qty);
  const shared = { sale_id: id, date, phone: deviceId, location: item.location, type: 'Sale', currency: 'USD' };
  return {
    id, type: EVENT_TYPES.sale, at,
    data: { total, currency: 'USD' },
    rows: {
      Sales: [{
        ...shared, time, items: qty, subtotal: total, discount: '0.00', total, vat: '0.00',
        paid_by: 'Cash USD', payment_status: 'Paid', note: 'Test sale', total_pricing: total, vat_pricing: '0.00',
      }],
      'Items Sold': [{
        ...shared, line: 1, product_id: item.product_id, product: item.product, qty, unit_price: item.price,
        discount: '0.00', line_total: total, vat: '0.00', unit_cost_pricing: item.cost, line_cost_pricing: cost,
      }],
      Payments: [{
        payment_id: `${id}-1`, sale_id: id, date, time, phone: deviceId, kind: 'Payment', method: 'Cash USD',
        currency: 'USD', amount: total, rate_used: '1', sale_currency: 'USD', amount_in_sale_currency: total,
        status: 'Paid', confirmed_by: 'Test', zimra_money_type: 'Cash',
      }],
      'Stock Ledger': [{
        row_id: `${id}-L1`, date, time, phone: deviceId, location: item.location, type: 'Sold',
        product_id: item.product_id, product: item.product, qty: -qty, unit_cost_pricing: item.cost,
        stock_value_pricing: money(-Number(cost)), cost_currency: 'USD', reference: id, note: 'Test sale',
      }],
    },
  };
}

/** Stock arriving, the other half of what a shop's Stock tab adds up. */
function stockInEvent(id, deviceId, at, item, qty) {
  const { date, time } = clock(at);
  return {
    id, type: EVENT_TYPES.stockIn, at,
    data: { qty },
    rows: {
      'Stock Ledger': [{
        row_id: id, date, time, phone: deviceId, location: item.location, type: 'Stock in',
        product_id: item.product_id, product: item.product, qty, unit_cost_pricing: item.cost,
        stock_value_pricing: money(Number(item.cost) * qty), cost_currency: 'USD', note: 'Test stock',
      }],
    },
  };
}

/** A batch body of `count` sales. */
function saleBatch(deviceId, number, count = 1, item = SAMPLE_ITEM) {
  const at = new Date().toISOString();
  const events = Array.from({ length: count }, (_, i) =>
    saleEvent(`${deviceId}-S${at.slice(2, 10).replace(/-/g, '')}-B${number}-${i + 1}`, deviceId, at, item));
  return client.batch(number, events);
}

async function liveItem() {
  const reply = await send(ACTIONS_.changesPull, {});
  return itemFrom(reply.result?.tables);
}

/**
 * The next batch number, from the hub. The hub acknowledges any number it has
 * passed as a re-send and stores nothing, so a stale number here loses the batch.
 */
async function nextBatch(device) {
  const reply = await send(ACTIONS_.status, {});
  return reply.result.phones.find((phone) => phone.device === device.device).through + 1;
}

const stamp = (device, number, kind, at) => `${device.device}-${kind}${at.slice(2, 10).replace(/-/g, '')}-${String(number).padStart(4, '0')}`;

/** One sale of the shop's first product, on every tab a real sale touches. */
async function sale(qty = '1') {
  const device = loadDevice();
  const item = await liveItem();
  const number = await nextBatch(device);
  const at = new Date().toISOString();
  const event = saleEvent(stamp(device, number, 'S', at), device.device, at, item, Number(qty));
  return { item: item.product, qty: Number(qty), reply: await send(ACTIONS_.journalPut, client.batch(number, [event])) };
}

/** Receives stock of the shop's first product. */
async function stockIn(qty = '20') {
  const device = loadDevice();
  const item = await liveItem();
  const number = await nextBatch(device);
  const at = new Date().toISOString();
  const event = stockInEvent(stamp(device, number, 'L', at), device.device, at, item, Number(qty));
  return { item: item.product, qty: Number(qty), reply: await send(ACTIONS_.journalPut, client.batch(number, [event])) };
}

/** Times one batch of many sales, then re-sends it, as a phone does after a lost reply. */
async function load(count = '200') {
  const device = loadDevice();
  const item = await liveItem();
  const body = saleBatch(device.device, await nextBatch(device), Number(count), item);
  const started = Date.now();
  const first = await send(ACTIONS_.journalPut, body);
  const seconds = (Date.now() - started) / 1000;
  return { seconds, first: first.result ?? first.error, again: (await send(ACTIONS_.journalPut, body)).result };
}

/** Sends the very same signed request twice. The second must be refused. */
async function sendTwice() {
  const device = loadDevice();
  const request = client.signed({ device: device.device, secret: device.secret, action: ACTIONS_.status, body: {}, ts: Math.floor(Date.now() / 1000) });
  return [await post(device.url, request), await post(device.url, request)];
}

async function retry() {
  const [first, second] = await sendTwice();
  return { first: first.ok, second: second.error ?? second.ok };
}

const CLASP = path.join(HUB, 'node_modules', '.bin', 'clasp');

/** Runs clasp in .try and returns what it printed. */
function clasp(args) {
  return execSync(`"${CLASP}" ${args}`, { cwd: TRY, encoding: 'utf8' });
}

/** Runs clasp in .try where the person can see it and answer it. */
function claspLive(args) {
  execSync(`"${CLASP}" ${args}`, { cwd: TRY, stdio: 'inherit' });
}

/** The versioned deployment in clasp's list, never @HEAD. */
function deploymentFrom(list) {
  const line = list.split('\n').filter((text) => /@\d+/.test(text)).pop();
  return line?.match(/AKfy[A-Za-z0-9_-]+/)?.[0];
}

const deploymentId = () => deploymentFrom(clasp('list-deployments'));
const hubAddress = (id) => `https://script.google.com/macros/s/${id}/exec`;

/**
 * The address to give people. Browsers signed in to several Google accounts get
 * Google's error page at the plain address, but open this form (decision 0009).
 */
const shopPageAddress = (address) => address.replace('/macros/s/', '/a/~/macros/s/');

/** Whether the owner has authorised the hub: it answers JSON once they have. */
async function isAuthorised(url) {
  try {
    await post(url, {});
    return true;
  } catch {
    return false;
  }
}

/** A new install code on the same hub, and the address to pair with. */
function fresh(base = RAW) {
  const code = prepare(TRY, base, Math.floor(Date.now() / 1000));
  clasp('push --force');
  const id = deploymentId();
  if (!id) throw new Error('No deployment yet. Run clasp create-deployment in .try first.');
  clasp(`create-deployment --deploymentId ${id} --description "Fresh install code"`);
  const address = hubAddress(id);
  return { address, shopPage: shopPageAddress(address), code, note: 'Valid for 15 minutes.' };
}

async function pair(url, code) {
  const reply = await post(url, { v: 1, ts: Math.floor(Date.now() / 1000), action: ACTIONS_.pair, body: { code, name: 'Test phone' } });
  if (reply.ok) {
    fs.writeFileSync(DEVICE, JSON.stringify({ url, ...reply.result }, null, 2));
    return { ok: true, device: reply.result.device, role: reply.result.role };
  }
  return reply;
}

const COMMANDS = {
  prepare: (base = RAW) => {
    const code = prepare(TRY, base, Math.floor(Date.now() / 1000));
    return { code, note: 'Valid for 15 minutes. Push and deploy now.' };
  },
  fresh,
  pair,
  setup: (name, timeZone = 'Africa/Harare', pricingCurrency = 'USD') => send(ACTIONS_.setupRun, { name, timeZone, pricingCurrency }),
  status: () => send(ACTIONS_.status, {}),
  pull: () => send(ACTIONS_.changesPull, {}),
  sale,
  stock: stockIn,
  keys: (currency, integrationId, integrationKey, authEmail) => send(ACTIONS_.keysSet,
    { provider: PROVIDERS_.paynow, currency, integrationId, integrationKey, authEmail }),
  pay: (payer, method = 'ecocash', amount = '1.00', currency = 'USD') => {
    const stamp = new Date().toISOString().slice(2, 19).replace(/\D/g, '');
    return send(ACTIONS_.paymentStart, { reference: `T-PAY${stamp}`, provider: PROVIDERS_.paynow, method, amount, currency, payer });
  },
  check: (reference) => send(ACTIONS_.paymentCheck, { reference }),
  load,
  retry,
  photo: () => send(ACTIONS_.attachmentPut, {
    kind: ATTACHMENT_KINDS_.product, id: 'TRY-PHOTO', contentType: 'image/png',
    data: fs.readFileSync(path.join(HUB, 'src', 'appsscript.json')).toString('base64'),
  }),
  export: (file = WORKBOOKS_.myShop, format = EXPORT_FORMATS_.xlsx, table) => send(ACTIONS_.exportRequest, { file, format, ...(table ? { table } : {}) }),
};

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!COMMANDS[command]) throw new Error(`Commands: ${Object.keys(COMMANDS).join(', ')}`);
  console.log(JSON.stringify(await COMMANDS[command](...args), null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  TRY, DEVICE, RAW, prepare, fresh, pair, send, sendTwice, saleBatch, saleEvent, itemFrom, clasp, claspLive,
  deploymentId, deploymentFrom, hubAddress, shopPageAddress, isAuthorised,
};
