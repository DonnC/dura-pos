// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Loads every hub source file into one shared context, the way Apps Script
// runs them: one global scope, no modules. Google services are fakes.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fakes = require('./google_fakes');

const SRC = path.join(__dirname, '..', '..', 'src');

/** Returns a fresh hub context with fake Google services. */
function loadHub(options = {}) {
  const google = fakes.createGoogle(options);
  const context = vm.createContext({ ...google, console });
  const files = fs
    .readdirSync(SRC)
    .filter((name) => name.endsWith('.js'))
    .sort();
  for (const name of files) {
    const code = fs.readFileSync(path.join(SRC, name), 'utf8');
    vm.runInContext(code, context, { filename: name });
  }
  return { hub: context, google };
}

module.exports = { loadHub };
