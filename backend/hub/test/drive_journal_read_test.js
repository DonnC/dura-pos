// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHub } = require('./support/load_hub');

function reader(files) {
  const { hub, google } = loadHub();
  const queries = [];
  google.Drive.Files.list = (options) => { queries.push(options); return { files }; };
  google.UrlFetchApp.fetch = () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ hash: 'abc', events: [] }) });
  google.ScriptApp.getOAuthToken = () => 'token';
  const store = { get: (key) => (key === 'file:journal' ? 'FOLDER' : null) };
  return { writer: hub.driveJournalWriter_(store), queries };
}

test('a stored batch is found by its name, inside the journal folder', () => {
  const { writer, queries } = reader([{ id: 'F1' }]);
  assert.equal(writer.read('P2', 31).hash, 'abc');
  assert.match(queries[0].q, /name = 'P2-000031\.json'/);
  assert.match(queries[0].q, /'FOLDER' in parents/);
  assert.match(queries[0].q, /trashed = false/);
});

test('a batch with no file reads as nothing', () => {
  assert.equal(reader([]).writer.read('P2', 31), null);
});
