// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHub } = require('./support/load_hub');

function post(hub, text) {
  const output = hub.doPost({ postData: { contents: text, type: 'application/json' } });
  return { mimeType: output.mimeType, reply: JSON.parse(output.text) };
}

test('doPost answers JSON through ContentService', () => {
  const { hub } = loadHub();
  const { mimeType, reply } = post(hub, JSON.stringify({
    v: 1, ts: Math.floor(Date.now() / 1000), action: 'pair',
    body: { code: 'f'.repeat(32), name: 'Phone' },
  }));
  assert.equal(mimeType, 'JSON');
  assert.equal(reply.ok, false);
  assert.equal(reply.error.code, 'bad_code');
});

test('a body that is not JSON is a bad envelope', () => {
  const { hub } = loadHub();
  const { reply } = post(hub, '{not json');
  assert.deepEqual([reply.error.category, reply.error.code], ['validation', 'bad_envelope']);
});

test('an unexpected failure is reported without its details', () => {
  const { hub } = loadHub();
  hub.handleRequest_ = () => {
    throw new Error('secret path C:/keys/shop.json');
  };
  const { reply } = post(hub, '{}');
  assert.deepEqual([reply.error.category, reply.error.code],
    ['retryable_unavailable', 'internal_error']);
  assert.equal(JSON.stringify(reply).includes('secret path'), false);
});

test('the Drive journal writer stores each batch as a named JSON file', () => {
  const { hub, google } = loadHub();
  google.PropertiesService.getScriptProperties().setProperty('file:journal', 'folder-1');
  const writer = hub.createServices_().journalWriter;
  const file = writer.write({ device: 'P2', batch: 124, events: [], hash: 'h', receivedAt: 1 });
  assert.equal(file.id, 'file-1');
  const stored = google.Drive.files[0];
  assert.equal(stored.name, 'P2-000124.json');
  assert.deepEqual([...stored.parents], ['folder-1']);
  assert.equal(JSON.parse(stored.content).batch, 124);
});

test('the Drive journal writer refuses to write before the hub is set up', () => {
  const { hub } = loadHub();
  const writer = hub.createServices_().journalWriter;
  assert.throws(() => writer.write({ device: 'P1', batch: 1, events: [] }), /not set up/);
});
