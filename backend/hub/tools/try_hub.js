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

const HUB = path.join(__dirname, '..');
const TRY = path.join(HUB, '.try');
const DEVICE = path.join(TRY, 'device.json');
const DIST = path.join(HUB, '..', 'templates', 'dist');
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

/** A batch body of `count` sales, each with a Sales row. */
function saleBatch(deviceId, number, count = 1) {
  const at = new Date().toISOString();
  const events = Array.from({ length: count }, (_, i) => {
    const id = `${deviceId}-S${at.slice(2, 10).replace(/-/g, '')}-B${number}-${i + 1}`;
    return {
      id, type: 'sale.completed', at,
      data: { total: '1.00', currency: 'USD' },
      rows: { Sales: [{ sale_id: id, date: at.slice(0, 10), phone: deviceId, currency: 'USD', total: '1.00' }] },
    };
  });
  return client.batch(number, events);
}

/** One sale, with rows for the Sales tab, as the next batch. */
async function sale() {
  const device = loadDevice();
  device.batch = (device.batch || 0) + 1;
  const at = new Date().toISOString();
  const id = `${device.device}-S${at.slice(2, 10).replace(/-/g, '')}-${String(device.batch).padStart(4, '0')}`;
  const event = {
    id, type: 'sale.completed', at,
    data: { total: '2.00', currency: 'USD' },
    rows: { Sales: [{ sale_id: id, date: at.slice(0, 10), phone: device.device, currency: 'USD', total: '2.00' }] },
  };
  const reply = await send('journal.put', client.batch(device.batch, [event]));
  if (reply.ok) fs.writeFileSync(DEVICE, JSON.stringify(device, null, 2));
  return reply;
}

/** Times one batch of many sales, then re-sends it, as a phone does after a lost reply. */
async function load(count = '200') {
  const device = loadDevice();
  device.batch = (device.batch || 0) + 1;
  const at = new Date().toISOString();
  const events = Array.from({ length: Number(count) }, (_, i) => {
    const id = `${device.device}-S${at.slice(2, 10).replace(/-/g, '')}-L${device.batch}-${i + 1}`;
    return {
      id, type: 'sale.completed', at,
      data: { total: '1.00', currency: 'USD' },
      rows: { Sales: [{ sale_id: id, date: at.slice(0, 10), phone: device.device, currency: 'USD', total: '1.00' }] },
    };
  });
  const body = client.batch(device.batch, events);
  const started = Date.now();
  const first = await send('journal.put', body);
  const seconds = (Date.now() - started) / 1000;
  if (first.ok) fs.writeFileSync(DEVICE, JSON.stringify(device, null, 2));
  return { seconds, first: first.result ?? first.error, again: (await send('journal.put', body)).result };
}

/** Sends the very same signed request twice. The second must be refused. */
async function sendTwice() {
  const device = loadDevice();
  const request = client.signed({ device: device.device, secret: device.secret, action: 'status', body: {}, ts: Math.floor(Date.now() / 1000) });
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
  const reply = await post(url, { v: 1, ts: Math.floor(Date.now() / 1000), action: 'pair', body: { code, name: 'Test phone' } });
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
  setup: (name, timeZone = 'Africa/Harare', pricingCurrency = 'USD') => send('setup.run', { name, timeZone, pricingCurrency }),
  status: () => send('status', {}),
  pull: () => send('changes.pull', {}),
  sale,
  keys: (currency, integrationId, integrationKey, authEmail) => send('keys.set',
    { provider: 'paynow', currency, integrationId, integrationKey, authEmail }),
  pay: (payer, method = 'ecocash', amount = '1.00', currency = 'USD') => {
    const stamp = new Date().toISOString().slice(2, 19).replace(/\D/g, '');
    return send('payment.start', { reference: `T-PAY${stamp}`, provider: 'paynow', method, amount, currency, payer });
  },
  check: (reference) => send('payment.check', { reference }),
  load,
  retry,
  photo: () => send('attachment.put', {
    kind: 'product', id: 'TRY-PHOTO', contentType: 'image/png',
    data: fs.readFileSync(path.join(HUB, 'src', 'appsscript.json')).toString('base64'),
  }),
  export: (file = 'myShop', format = 'xlsx', table) => send('export.request', { file, format, ...(table ? { table } : {}) }),
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
  TRY, DEVICE, RAW, prepare, fresh, pair, send, sendTwice, saleBatch, clasp, claspLive,
  deploymentId, deploymentFrom, hubAddress, shopPageAddress, isAuthorised,
};
