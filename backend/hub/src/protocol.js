// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Protocol constants and errors (PROTOCOL.md). `var`, not `const`, so every
// file sees them in Apps Script's shared global scope whatever the load order.

var PROTOCOL_VERSION_ = 1;
var HUB_VERSION_ = '0.1.0-dev.1';

var LIMITS_ = {
  clockSkewSeconds: 300,
  nonceSeconds: 600,
  pairingCodeSeconds: 600,
  installCodeSeconds: 900,
  maxEvents: 500,
  lockWaitMillis: 10000,
  deviceNameLength: 60,
  attachmentBase64Length: 1400000, // about 1 MB of photo; phones send about 150 KB
};

var PATTERNS_ = {
  action: /^[a-z]+(\.[a-z]+)*$/,
  device: /^P[1-9][0-9]{0,3}$/,
  nonce: /^[0-9a-f]{32,64}$/,
  signature: /^[0-9a-f]{64}$/,
  code: /^[0-9a-f]{32}$/,
  hash: /^[0-9a-f]{64}$/,
};

/**
 * An error the client should see. Its category is one of PROTOCOL.md's six;
 * anything else thrown is reported only as an internal error.
 * @param {string} category
 * @param {string} code
 * @param {string} message plain words for logs; never secrets or payloads
 */
function hubError_(category, code, message) {
  var error = new Error(message);
  /** @type {any} */ (error).hub = { category: category, code: code, message: message };
  return error;
}
