// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * Utilities returns Java-style signed bytes (-128..127).
 * @param {number[]} bytes
 */
function bytesToHex_(bytes) {
  return bytes.map(function (b) {
    var unsigned = (b + 256) % 256;
    return (unsigned < 16 ? '0' : '') + unsigned.toString(16);
  }).join('');
}

/** @param {string} text */
function sha256Hex_(text) {
  return bytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8));
}

/**
 * @param {string} message
 * @param {string} key used as its UTF-8 text, as PROTOCOL.md specifies
 */
function hmacSha256Hex_(message, key) {
  return bytesToHex_(Utilities.computeHmacSha256Signature(
    message, key, Utilities.Charset.UTF_8));
}

/**
 * Random hex for secrets and codes. Apps Script has no random-bytes API, so
 * this hashes fresh random UUIDs: 122 random bits each, two per 32 bytes.
 * Assumes getUuid draws from a secure source (a spike checks this).
 * @param {number} byteCount
 */
function randomHex_(byteCount) {
  var hex = '';
  while (hex.length < byteCount * 2) {
    hex += sha256Hex_(Utilities.getUuid() + Utilities.getUuid() + hex.length);
  }
  return hex.slice(0, byteCount * 2);
}

/**
 * Compares two strings without stopping at the first difference, so timing
 * doesn't reveal how much of a signature was right. Lengths aren't secret.
 * @param {string} a
 * @param {string} b
 */
function constantTimeEqual_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  var difference = 0;
  for (var i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}
