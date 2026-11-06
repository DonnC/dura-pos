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
const { hubChecks, runChecks, report } = require('../tools/trial');
const { shopPageAddress, deploymentFrom } = require('../tools/try_hub');

/** The trial's client, wired to the hub's own code. */
function localClient(fixture) {
  const { owner, send, call, hub, google, drive } = fixture;
  google.Sheets.cells.Settings = [['Setting', 'Value', 'Note'], ['Business name', 'Test Corner Shop', '']];
  google.UrlFetchApp.routes.set(
    `https://www.googleapis.com/drive/v3/files/${named(drive, 'My Shop').id}/export?mimeType=application%2Fvnd.openxmlformats-officedocument.spreadsheetml.sheet`,
    { code: 200, body: 'xlsx bytes' },
  );
  return {
    device: owner.device,
    send: (action, body) => send(owner, action, body),
    sendTwice: () => {
      const request = client.signed({ device: owner.device, secret: owner.secret, action: 'status', ts: google.clock.now() });
      return [call(request), call(request)];
    },
    page: () => ({ status: 200, text: hub.doGet().html }),
  };
}

test('every trial check passes on a working hub', async () => {
  const results = await runChecks(hubChecks(localClient(readyShop())));
  assert.deepEqual(results.filter((r) => !r.ok), []);
  assert.equal(results.length, 11);
});

test('a hub that loses a batch fails the trial', async () => {
  const fixture = readyShop();
  const local = localClient(fixture);
  const honest = local.send;
  local.send = (action, body) => {
    if (action === 'journal.put') return { ok: true, result: { status: 'accepted', through: 0 } };
    return honest(action, body);
  };
  const results = await runChecks(hubChecks(local));
  assert.equal(results.find((r) => r.name.startsWith('A sale')).ok, false);
});

test('a page without the shop fails the trial', async () => {
  const local = localClient(readyShop());
  local.page = () => ({ status: 200, text: 'This shop page is not available.' });
  const results = await runChecks(hubChecks(local));
  assert.equal(results.at(-1).ok, false);
});

test('one failed check does not stop the rest', async () => {
  const lines = [];
  const results = await runChecks([
    ['first', () => { throw new Error('broken'); }],
    ['second', () => 'fine'],
  ], (line) => lines.push(line));
  assert.deepEqual(results.map((r) => r.ok), [false, true]);
  assert.deepEqual(lines, ['FAIL  first: broken', 'PASS  second: fine']);
});

test('the report counts failures', () => {
  const text = report([{ name: 'a', ok: true, detail: '' }, { name: 'b', ok: false, detail: 'no' }], '2026-11-06');
  assert.match(text, /1 passed, 1 failed/);
  assert.match(text, /\*\*Fail\*\* \| b \| no/);
});

test('the shop page uses the address that works with several Google accounts', () => {
  assert.equal(shopPageAddress('https://script.google.com/macros/s/ABC/exec'),
    'https://script.google.com/a/~/macros/s/ABC/exec');
});

test('the deployment is the versioned one, never HEAD', () => {
  const list = 'Found 2 deployments.\n- AKfyHEAD @HEAD \n- AKfyREAL @2 - Fresh install code\n';
  assert.equal(deploymentFrom(list), 'AKfyREAL');
  assert.equal(deploymentFrom('Found 1 deployment.\n- AKfyHEAD @HEAD \n'), undefined);
});
