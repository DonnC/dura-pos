// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const client = require('./support/test_client');
const { prepare } = require('../tools/try_hub');

test('prepare fills a copy of the hub and leaves the source alone', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'try-hub-'));
  const before = fs.readFileSync(path.join(__dirname, '..', 'src', 'install_config.js'), 'utf8');
  const code = prepare(folder, 'https://example.test/dist', 1793700000);
  const install = fs.readFileSync(path.join(folder, 'install_config.js'), 'utf8');
  assert.match(install, new RegExp(`INSTALL_CODE_HASH_ = '${client.sha256Hex(code)}'`));
  assert.equal(install.includes(code), false);
  assert.match(install, /INSTALLED_AT_ = 1793700000/);
  const manifest = fs.readFileSync(path.join(folder, 'template_manifest.js'), 'utf8');
  assert.match(manifest, /https:\/\/example\.test\/dist\/ZWG\/My%20Shop\.xlsx/);
  assert.match(manifest, /"sha256": "[0-9a-f]{64}"/);
  assert.match(manifest, /TEMPLATE_CELLS_/);
  assert.equal(fs.readFileSync(path.join(__dirname, '..', 'src', 'install_config.js'), 'utf8'), before);
  fs.rmSync(folder, { recursive: true });
});
