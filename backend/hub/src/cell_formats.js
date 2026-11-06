// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Column formats. The hub writes dates and times as serials and amounts as
// numbers, so a cell only reads properly if its column has a format. Clean
// templates have no rows to carry one, so the hub sets each column here, once
// per file, in one Sheets call. Growing a tab clears the mark, because the new
// rows may not take the format from the rows above.

/** The Sheets API's type for each format kind; anything else is a number. */
var SHEET_FORMAT_TYPES_ = Object.freeze({ date: 'DATE', time: 'TIME', datetime: 'DATE_TIME' });

/** @param {number} sheetId @param {number} column 0-based @param {string} kind */
function columnFormatRequest_(sheetId, column, kind) {
  return {
    repeatCell: {
      range: { sheetId: sheetId, startRowIndex: 1, startColumnIndex: column, endColumnIndex: column + 1 },
      cell: {
        userEnteredFormat: {
          numberFormat: { type: SHEET_FORMAT_TYPES_[kind] || 'NUMBER', pattern: VIEW_CONTRACT_.formats[kind] },
        },
      },
      fields: 'userEnteredFormat.numberFormat',
    },
  };
}

/** One tab's formatted columns, by column index. Columns are found by heading. */
function tableColumnKinds_(table, sheet, pricing) {
  /** @type {Object<string, string>} */
  var kinds = {};
  var fields = VIEW_CONTRACT_.tables[table].fields;
  Object.keys(fields).forEach(function (id) {
    var at = sheet.headings.indexOf(fields[id].heading.replace('{pricing}', pricing));
    if (at >= 0 && VIEW_CONTRACT_.formats[fields[id].kind]) kinds[at] = fields[id].kind;
  });
  return kinds;
}

/**
 * Sets a workbook's column formats, unless that's already done. Call inside
 * the lock.
 * @param {any} services @param {string} fileId @param {string} workbook WORKBOOKS_
 */
function formatFile_(services, fileId, workbook) {
  var mark = STORE_PREFIXES_.formatted + fileId;
  if (services.store.get(mark)) return;
  var tables = Object.keys(VIEW_CONTRACT_.tables).filter(function (table) {
    return VIEW_CONTRACT_.tables[table].file === workbook;
  });
  var fixed = workbook === WORKBOOKS_.myShop ? Object.keys(VIEW_CONTRACT_.columnFormats) : [];
  var info = sheetInfo_(services, fileId, tables.concat(fixed));
  var pricing = services.store.get(STORE_KEYS_.pricingCurrency);
  var requests = [];
  tables.filter(function (table) { return info[table]; }).forEach(function (table) {
    var kinds = tableColumnKinds_(table, info[table], pricing);
    Object.keys(kinds).forEach(function (at) {
      requests.push(columnFormatRequest_(info[table].id, Number(at), kinds[at]));
    });
  });
  fixed.filter(function (table) { return info[table]; }).forEach(function (table) {
    var kinds = VIEW_CONTRACT_.columnFormats[table];
    Object.keys(kinds).forEach(function (column) {
      requests.push(columnFormatRequest_(info[table].id, Number(column) - 1, kinds[column]));
    });
  });
  if (requests.length > 0) Sheets.Spreadsheets.batchUpdate({ requests: requests }, fileId);
  services.store.set(mark, services.now());
}
