// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Thin wrappers over the Drive v3 advanced service. Each asks Drive for only
// the new file's id, and turns a Drive failure into a retryable error.

var FOLDER_MIME_ = 'application/vnd.google-apps.folder';
var SHEET_MIME_ = 'application/vnd.google-apps.spreadsheet';

/**
 * @param {any} resource Drive v3 file metadata
 * @param {GoogleAppsScript.Base.Blob | null} media
 * @returns {string} the new file's id
 */
function driveCreate_(resource, media) {
  try {
    return Drive.Files.create(resource, media, { fields: 'id' }).id;
  } catch (error) {
    throw hubError_(ERRORS_.storageUnavailable,
      'Google Drive did not accept the file; try again.');
  }
}

/** @param {string} name @param {string | null} parentId */
function createFolder_(name, parentId) {
  var resource = { name: name, mimeType: FOLDER_MIME_ };
  if (parentId) resource.parents = [parentId];
  return driveCreate_(resource, null);
}

/**
 * Uploads an .xlsx blob and lets Drive convert it into a Google Sheet.
 * @param {string} name
 * @param {string} parentId
 * @param {GoogleAppsScript.Base.Blob} xlsx
 */
function createSheetFromXlsx_(name, parentId, xlsx) {
  return driveCreate_({ name: name, mimeType: SHEET_MIME_, parents: [parentId] }, xlsx);
}

/** @param {string} name @param {string} parentId @param {any} value */
function createJsonFile_(name, parentId, value) {
  var blob = Utilities.newBlob(JSON.stringify(value, null, 2), 'application/json', name);
  return driveCreate_({ name: name, mimeType: 'application/json', parents: [parentId] }, blob);
}
