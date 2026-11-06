// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * The signing string of PROTOCOL.md: keys sorted at every depth, no spacing,
 * integers only. Every client must produce the same text for the same value,
 * so non-integer numbers are refused rather than formatted differently.
 * @param {any} value
 * @returns {string}
 */
function canonicalJson_(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return '[' + value.map(canonicalJson_).join(',') + ']';
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isSafeInteger(value)) {
        throw new Error('Only integers can be signed; send amounts as strings.');
      }
      return String(value);
    case 'object':
      return '{' + Object.keys(value)
        .filter(function (key) { return value[key] !== undefined; })
        .sort()
        .map(function (key) { return JSON.stringify(key) + ':' + canonicalJson_(value[key]); })
        .join(',') + '}';
    default:
      throw new Error('Cannot sign a value of type ' + typeof value + '.');
  }
}
