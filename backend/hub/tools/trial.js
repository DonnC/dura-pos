// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// `npm run trial`: the whole real-account test as one command. It installs a
// hub on the Google account you sign in with, waits for what only a person can
// do, runs every check it can, and writes .try/report.md. Run it again at any
// time: it picks up from what already exists, and repeats the checks.

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const hub = require('./try_hub');

const { TRY, DEVICE } = hub;
const { ACTIONS_, ATTACHMENT_KINDS_, ERRORS_, EXPORT_FORMATS_, SETUP_READY_, TABLES_, WORKBOOKS_ } = require('../test/support/hub_names');
const SHOP = { name: 'Test Corner Shop', timeZone: 'Africa/Harare', pricingCurrency: 'USD' };
const WAIT_MILLIS = 5000;
const WAIT_LIMIT_MILLIS = 30 * 60 * 1000;
const PHOTO = Buffer.from('a small test file').toString('base64');

const wait = (millis) => new Promise((resolve) => { setTimeout(resolve, millis); });

/** The result of an action, or an error naming what the hub said. */
function resultOf(reply) {
  if (reply.ok) return reply.result;
  throw new Error(`${reply.error.category} / ${reply.error.code}`);
}

/**
 * The checks, in order. `client` is how they reach a hub, so the tests can run
 * them on the hub's own code and `npm run trial` on a real one.
 * @param {{device: string, send: Function, sendTwice: Function, page: Function}} client
 */
function hubChecks(client) {
  const call = async (action, body = {}) => resultOf(await client.send(action, body));
  const phone = async () => (await call(ACTIONS_.status)).phones.find((p) => p.device === client.device);
  let item;
  const upload = async (count) => {
    item ??= hub.itemFrom((await call(ACTIONS_.changesPull)).tables);
    const number = (await phone()).through + 1;
    const body = hub.saleBatch(client.device, number, count, item);
    const started = Date.now();
    const first = resultOf(await client.send(ACTIONS_.journalPut, body));
    return { number, body, first, seconds: (Date.now() - started) / 1000 };
  };
  const expect = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  return [
    ['Setup is ready', async () => {
      const result = await call(ACTIONS_.setupRun, SHOP);
      expect(result.status === SETUP_READY_, `status ${result.status}`);
      return result.business;
    }],
    ['Status answers, with no views behind', async () => {
      const result = await call(ACTIONS_.status);
      expect(result.views.queued === 0, `${result.views.queued} batches queued`);
      return `hub ${result.hub}`;
    }],
    ['A sale reaches the journal and the views', async () => {
      const skippedBefore = (await call(ACTIONS_.status)).views.skipped;
      const { number, first } = await upload(1);
      expect(first.through === number, `through ${first.through}`);
      const after = await phone();
      expect(after.viewed === number, `viewed ${after.viewed} of ${number}`);
      const { views } = await call(ACTIONS_.status);
      expect(views.skipped === skippedBefore, `${views.skipped - skippedBefore} cells had no column`);
      return `batch ${number}`;
    }],
    ['200 sales in one batch', async () => {
      const { number, first, seconds } = await upload(200);
      expect(first.through === number, `through ${first.through}`);
      return `${seconds.toFixed(1)} seconds`;
    }],
    ['A batch sent twice is stored once', async () => {
      const { number, body } = await upload(1);
      const again = resultOf(await client.send(ACTIONS_.journalPut, body));
      expect(again.through === number, `through ${again.through}`);
      expect((await phone()).through === number, 'the batch number moved');
      return 'acknowledged';
    }],
    ['A replayed request is refused', async () => {
      const [first, second] = await client.sendTwice();
      expect(first.ok, 'the first request failed');
      expect(second.error?.code === ERRORS_.replayedRequest.code, `second: ${JSON.stringify(second.error ?? second.ok)}`);
      return 'refused';
    }],
    ['Master data can be pulled', async () => {
      const result = await call(ACTIONS_.changesPull);
      expect(result.tables[TABLES_.settings].length > 0, 'no Settings');
      return `${result.tables[TABLES_.products].length} products, ${result.skipped.length} skipped`;
    }],
    ['A photo is saved', async () => (await call(ACTIONS_.attachmentPut,
      { kind: ATTACHMENT_KINDS_.product, id: 'TRIAL-PHOTO', contentType: 'image/png', data: PHOTO })).name],
    ['A tab exports as CSV', async () => (await call(ACTIONS_.exportRequest,
      { file: WORKBOOKS_.myShop, format: EXPORT_FORMATS_.csv, table: TABLES_.products })).name],
    ['A workbook exports as Excel', async () => (await call(ACTIONS_.exportRequest,
      { file: WORKBOOKS_.myShop, format: EXPORT_FORMATS_.xlsx })).name],
    ['The shop page opens with no sign-in', async () => {
      const page = await client.page();
      expect(page.status === 200, `HTTP ${page.status}`);
      expect(page.text.includes(SHOP.name), 'the shop name is not on it');
      return 'shown';
    }],
  ];
}

/** Runs every check, and carries on after a failure so one report shows them all. */
async function runChecks(checks, say = () => {}) {
  const results = [];
  for (const [name, run] of checks) {
    try {
      const detail = await run();
      results.push({ name, ok: true, detail: String(detail ?? '') });
    } catch (error) {
      results.push({ name, ok: false, detail: error.message });
    }
    const last = results[results.length - 1];
    say(`${last.ok ? 'PASS' : 'FAIL'}  ${name}${last.detail ? `: ${last.detail}` : ''}`);
  }
  return results;
}

/** The report. It's safe to share: it holds no code, secret or address. */
function report(results, date) {
  const rows = results.map((r) => `| ${r.ok ? 'Pass' : '**Fail**'} | ${r.name} | ${r.detail} |`);
  const failed = results.filter((r) => !r.ok).length;
  return [`# Hub trial, ${date}`, '', `${results.length - failed} passed, ${failed} failed.`, '',
    '| Result | Check | Detail |', '|---|---|---|', ...rows, ''].join('\n');
}

/** Installs a hub if there isn't one, and returns once this machine is paired. */
async function install(say) {
  if (fs.existsSync(DEVICE)) return say('Using the hub already paired on this machine.');
  fs.mkdirSync(TRY, { recursive: true });
  const template = await fetch(`${hub.RAW}/USD/Month.xlsx`, { method: 'HEAD' });
  if (!template.ok) throw new Error('The templates are not public yet. See step 2 of the guide.');
  if (!fs.existsSync(path.join(os.homedir(), '.clasprc.json'))) {
    say('Sign in with the TEST account in the browser that opens.');
    hub.claspLive('login');
  }
  say(`Signed in to clasp as: ${hub.clasp('show-authorized-user').trim()}`);
  if (!fs.existsSync(path.join(TRY, '.clasp.json'))) {
    hub.claspLive('create-script --type standalone --title "Dura Shop Hub test" --rootDir .');
  }
  hub.prepare(TRY, hub.RAW, Math.floor(Date.now() / 1000));
  hub.clasp('push --force');
  if (!hub.deploymentId()) hub.clasp('create-deployment --description "Trial"');
  const address = hub.hubAddress(hub.deploymentId());
  const { scriptId } = JSON.parse(fs.readFileSync(path.join(TRY, '.clasp.json'), 'utf8'));
  say(`
Your turn: authorise the hub. Only the owner can do this.
  1. Open https://script.google.com/d/${scriptId}/edit
  2. Open jobs.gs, choose runViews in the function menu, and click Run.
  3. Click Review permissions, choose the account, then Advanced,
     Go to Dura Shop Hub test (unsafe), tick everything, and Continue.
Waiting for that. This carries on by itself.
`);
  const started = Date.now();
  while (!(await hub.isAuthorised(address))) {
    if (Date.now() - started > WAIT_LIMIT_MILLIS) throw new Error('Gave up waiting for authorisation.');
    await wait(WAIT_MILLIS);
  }
  say('Authorised. Issuing the install code and pairing.');
  const { code } = hub.fresh();
  const paired = await hub.pair(address, code);
  if (!paired.ok) {
    throw new Error(`Pairing failed: ${paired.error?.code}. If this hub already has an owner, delete .try and start again.`);
  }
  return undefined;
}

const MANUAL_CHECKS = (page) => `
Now check these by eye. Only a person can:
  1. In Drive, open Dura POS/${SHOP.name}/My Shop: are the dropdowns, colours and charts there?
  2. In My Shop, add products and a location, then run: npm run trial
  3. Open the shop page on a phone, in your normal browser:
     ${page}
     Try search, Call, WhatsApp and Directions.
`;

function liveClient() {
  const device = JSON.parse(fs.readFileSync(DEVICE, 'utf8'));
  return {
    device: device.device,
    send: hub.send,
    sendTwice: hub.sendTwice,
    page: async () => {
      const reply = await fetch(hub.shopPageAddress(device.url), { redirect: 'follow' });
      return { status: reply.status, text: await reply.text() };
    },
    address: device.url,
  };
}

async function main() {
  await install(console.log);
  const client = liveClient();
  console.log('\nRunning the checks.\n');
  const results = await runChecks(hubChecks(client), console.log);
  fs.writeFileSync(path.join(TRY, 'report.md'), report(results, new Date().toISOString().slice(0, 10)));
  console.log(MANUAL_CHECKS(hub.shopPageAddress(client.address)));
  const failed = results.filter((r) => !r.ok).length;
  console.log(`${results.length - failed} of ${results.length} checks passed. Report: backend/hub/.try/report.md`);
  process.exitCode = failed ? 1 : 0;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`\nStopped: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { hubChecks, runChecks, report };
