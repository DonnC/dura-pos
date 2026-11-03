// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

var XLSX_MIME_ = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Downloads the named templates in one parallel fetchAll and checks each
 * against its pinned SHA-256 before anything is created from it.
 * @param {any} set one pricing currency's templates from the manifest
 * @param {string[]} names keys of `set`, e.g. ['myShop', 'month']
 * @returns {Object<string, GoogleAppsScript.Base.Blob>}
 */
function fetchTemplates_(set, names) {
  if (names.length === 0) return {};
  var entries = names.map(function (name) {
    var entry = set && set[name];
    if (!entry || !entry.url || !PATTERNS_.hash.test(entry.sha256)) {
      throw hubError_('retryable_unavailable', 'template_unavailable',
        'This hub version has no released template for ' + name + '.');
    }
    return entry;
  });
  var responses = UrlFetchApp.fetchAll(entries.map(function (entry) {
    return { url: entry.url, muteHttpExceptions: true, followRedirects: true };
  }));
  /** @type {Object<string, GoogleAppsScript.Base.Blob>} */
  var blobs = {};
  responses.forEach(function (response, i) {
    if (response.getResponseCode() !== 200) {
      throw hubError_('retryable_unavailable', 'template_unavailable',
        'A template could not be downloaded; try again.');
    }
    var digest = bytesToHex_(Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, response.getContent()));
    if (!constantTimeEqual_(digest, entries[i].sha256)) {
      throw hubError_('integrity_conflict', 'template_mismatch',
        'A template does not match its pinned hash.');
    }
    blobs[names[i]] = response.getBlob().setContentType(XLSX_MIME_);
  });
  return blobs;
}
