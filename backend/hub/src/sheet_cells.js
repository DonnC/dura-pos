// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * Writes single cells in one Sheets call. RAW stores each value as given, so
 * a shop name that looks like a formula stays plain text. The advanced
 * service accepts the drive.file scope for files the hub created, so the hub
 * needs no access to the owner's other spreadsheets.
 * @param {string} spreadsheetId
 * @param {Object<string, string | number>} cells A1 range to value
 */
function writeCells_(spreadsheetId, cells) {
  var data = Object.keys(cells).map(function (range) {
    return { range: range, values: [[cells[range]]] };
  });
  try {
    Sheets.Spreadsheets.Values.batchUpdate({ valueInputOption: 'RAW', data: data }, spreadsheetId);
  } catch (error) {
    throw hubError_(ERRORS_.storageUnavailable,
      'Google Sheets did not accept the update; try again.');
  }
}

/**
 * A month's first day as a spreadsheet date serial, which needs no parsing
 * and so can't be misread under the sheet's locale.
 * @param {string} period e.g. "2026-11"
 */
function monthSerial_(period) {
  var utc = Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5)) - 1, 1);
  return utc / 86400000 + 25569;
}
