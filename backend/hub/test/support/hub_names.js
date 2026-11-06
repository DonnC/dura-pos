// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// The hub's names for code that runs outside Apps Script, so tools use the same
// constants as the hub instead of their own copies.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'names.js'), 'utf8'), context);

module.exports = context;
