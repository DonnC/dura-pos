// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Sheets views: accepted journal rows become rows in the workbooks.
//
// An event may carry `rows`: { "Sales": [{ sale_id: ..., total: "2.00" }] },
// keyed by the field IDs in VIEW_CONTRACT_. Columns are found by heading, so
// a moved column keeps working, and unset cells are left alone.
//
// Exactly-once without reading the sheet: rows go to explicit positions
// (row:<file>:<tab>), and those pointers advance together with the batch's
// view:<device> mark, only after every write succeeded. A retry therefore
// overwrites the same rows. Nothing here can fail an upload: the batch is
// already in the journal, and stays in the queue (viewq:<device>:<batch>).

var SECONDS_PER_DAY_ = 86400;
var SERIAL_EPOCH_ = 25569; // 1970-01-01 as a spreadsheet date serial
var SHEET_CACHE_SECONDS_ = 21600; // the longest CacheService keeps a value
var ROWS_TO_ADD_ = 2000;
var VIEW_BATCHES_PER_RUN_ = 20;

/** @param {string} day e.g. "2026-11-03" */
function dateSerial_(day) {
  var parts = day.split('-').map(Number);
  return Date.UTC(parts[0], parts[1] - 1, parts[2]) / (SECONDS_PER_DAY_ * 1000) + SERIAL_EPOCH_;
}

/** @param {string} time e.g. "16:20" or "16:20:30" */
function timeFraction_(time) {
  var parts = time.split(':').map(Number);
  return (parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0)) / SECONDS_PER_DAY_;
}

/**
 * A row value as the cell stores it. Amounts arrive as decimal strings; the
 * cell must hold a number for the sheet's formulas to add it up. Dates are
 * serials, so no locale can misread them. Unknown shapes stay as text.
 * @param {string} kind @param {any} value
 */
function cellValue_(kind, value) {
  if (value === null || value === undefined || value === '') return null;
  if (kind === 'text') return String(value);
  var text = String(value);
  if (kind === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(text)) return dateSerial_(text);
  if (kind === 'time' && /^\d{2}:\d{2}(:\d{2})?$/.test(text)) return timeFraction_(text);
  if (kind === 'datetime' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
    return dateSerial_(text.slice(0, 10)) + timeFraction_(text.slice(11, 19).replace(/[^0-9:].*$/, ''));
  }
  if (kind === 'date' || kind === 'time' || kind === 'datetime') return text;
  var number = Number(text);
  return isNaN(number) ? text : number;
}

/** @param {number} column 1-based */
function columnLetter_(column) {
  var letters = '';
  for (var n = column; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + (n - 1) % 26) + letters;
  }
  return letters;
}

/**
 * Each table's sheet ID, row count and headings, read once per file and then
 * cached. One Spreadsheets.get covers every tab in the file.
 * @param {any} services @param {string} fileId @param {string[]} tables
 */
function sheetInfo_(services, fileId, tables) {
  var keys = tables.map(function (table) { return 'sheet:' + fileId + ':' + table; });
  var cached = services.cache.getAll(keys);
  /** @type {Object<string, any>} */
  var info = {};
  var missing = tables.filter(function (table, i) {
    if (cached[keys[i]]) info[table] = JSON.parse(cached[keys[i]]);
    return !cached[keys[i]];
  });
  if (missing.length === 0) return info;
  var reply = Sheets.Spreadsheets.get(fileId, {
    ranges: missing.map(function (table) { return "'" + table + "'!1:1"; }),
    fields: 'sheets(properties(sheetId,title,gridProperties.rowCount),data.rowData.values.formattedValue)',
  });
  reply.sheets.forEach(function (sheet) {
    var title = sheet.properties.title;
    var first = sheet.data[0].rowData ? sheet.data[0].rowData[0].values : [];
    info[title] = {
      id: sheet.properties.sheetId,
      rows: sheet.properties.gridProperties.rowCount,
      headings: first.map(function (cell) { return cell.formattedValue || ''; }),
    };
    services.cache.put('sheet:' + fileId + ':' + title, JSON.stringify(info[title]), SHEET_CACHE_SECONDS_);
  });
  return info;
}

/** Adds rows when a tab would run past its grid; a write there would fail. */
function growIfNeeded_(services, fileId, table, sheet, lastRow) {
  if (lastRow <= sheet.rows) return;
  var length = Math.max(ROWS_TO_ADD_, lastRow - sheet.rows);
  Sheets.Spreadsheets.batchUpdate(
    { requests: [{ appendDimension: { sheetId: sheet.id, dimension: 'ROWS', length: length } }] }, fileId);
  sheet.rows += length;
  services.cache.put('sheet:' + fileId + ':' + table, JSON.stringify(sheet), SHEET_CACHE_SECONDS_);
}

/**
 * Groups a batch's rows by target workbook. Tables the contract doesn't know
 * are counted and skipped: a newer phone must not jam an older hub.
 * @param {any[]} events
 * @returns {{ targets: Object<string, Object<string, any[]>>, skipped: number }}
 */
function groupRows_(events) {
  /** @type {Object<string, Object<string, any[]>>} */
  var targets = {};
  var skipped = 0;
  events.forEach(function (event) {
    Object.keys(event.rows || {}).forEach(function (table) {
      var spec = VIEW_CONTRACT_.tables[table];
      var period = /^(\d{4}-\d{2})-/.exec(String(event.at));
      if (!spec || spec.hubOnly || (spec.file === 'month' && !period)) {
        skipped += 1;
        return;
      }
      var target = spec.file === 'month' ? 'month:' + period[1] : 'myshop';
      targets[target] = targets[target] || {};
      targets[target][table] = (targets[target][table] || []).concat(event.rows[table]);
    });
  });
  return { targets: targets, skipped: skipped };
}

/** The cells of one row, in the sheet's column order. @returns {{cells: any[], skipped: number}} */
function rowCells_(table, row, headings, pricing) {
  var fields = VIEW_CONTRACT_.tables[table].fields;
  /** @type {Object<string, string>} */
  var byHeading = {};
  Object.keys(fields).forEach(function (id) {
    byHeading[fields[id].heading.replace('{pricing}', pricing)] = id;
  });
  var used = 0;
  var cells = headings.map(function (heading) {
    var id = byHeading[heading];
    if (!id || !(id in row)) return null;
    used += 1;
    return cellValue_(fields[id].kind, row[id]);
  });
  return { cells: cells, skipped: Object.keys(row).length - used };
}

/**
 * Writes one hub-made row at a known position, by heading. Call inside the lock.
 * @param {any} services @param {string} fileId @param {string} table @param {number} at @param {any} row
 */
function writeRowAt_(services, fileId, table, at, row) {
  var sheet = sheetInfo_(services, fileId, [table])[table];
  growIfNeeded_(services, fileId, table, sheet, at);
  var built = rowCells_(table, row, sheet.headings, services.store.get('pricingCurrency'));
  Sheets.Spreadsheets.Values.batchUpdate({
    valueInputOption: 'RAW',
    data: [{ range: "'" + table + "'!A" + at + ':' + columnLetter_(sheet.headings.length) + at, values: [built.cells] }],
  }, fileId);
}

/**
 * Writes one batch's rows, in one Sheets call per workbook, and returns the
 * row pointers to save once every workbook has succeeded.
 * @param {any} services @param {any[]} events
 */
function projectBatch_(services, events) {
  var grouped = groupRows_(events);
  var pricing = services.store.get('pricingCurrency');
  /** @type {Object<string, string | number>} */
  var pointers = {};
  var skipped = grouped.skipped;
  Object.keys(grouped.targets).forEach(function (target) {
    var fileId = target === 'myshop' ? services.store.get('file:myshop')
      : ensureMonthFile_(services, target.slice('month:'.length));
    if (!fileId) {
      throw hubError_('retryable_unavailable', 'not_set_up', 'The shop is not set up yet.');
    }
    var tables = Object.keys(grouped.targets[target]);
    var info = sheetInfo_(services, fileId, tables);
    var data = tables.map(function (table) {
      var sheet = info[table];
      var key = 'row:' + fileId + ':' + table;
      var next = Number(services.store.get(key) || '2');
      var values = grouped.targets[target][table].map(function (row) {
        var built = rowCells_(table, row, sheet.headings, pricing);
        skipped += built.skipped;
        return built.cells;
      });
      var last = next + values.length - 1;
      growIfNeeded_(services, fileId, table, sheet, last);
      pointers[key] = last + 1;
      return {
        range: "'" + table + "'!A" + next + ':' + columnLetter_(sheet.headings.length) + last,
        values: values,
      };
    });
    Sheets.Spreadsheets.Values.batchUpdate({ valueInputOption: 'RAW', data: data }, fileId);
  });
  if (skipped) pointers['view:skipped'] = Number(services.store.get('view:skipped') || '0') + skipped;
  return pointers;
}

/**
 * The queued batches, oldest first per device.
 * @param {any} services @returns {string[]}
 */
function viewQueue_(services) {
  return Object.keys(services.store.getAll())
    .filter(function (key) { return key.indexOf('viewq:') === 0; }).sort();
}

/** A stored batch's events, read back from Drive. @param {string} fileId */
function readBatchEvents_(fileId) {
  var url = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media';
  var reply = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  if (reply.getResponseCode() !== 200) {
    throw hubError_('retryable_unavailable', 'storage_unavailable', 'A journal file could not be read.');
  }
  return JSON.parse(reply.getContentText()).events;
}

/**
 * Projects queued batches in order, and stops at the first failure so a
 * device's batches stay in sequence. Call inside the lock. `known` holds
 * events already in memory, to save a Drive read.
 * @param {any} services @param {Object<string, any[]>} known
 * @returns {boolean} whether the queue was emptied
 */
function drainQueue_(services, known) {
  var queue = viewQueue_(services);
  for (var i = 0; i < Math.min(queue.length, VIEW_BATCHES_PER_RUN_); i++) {
    var key = queue[i];
    var parts = key.split(':');
    var done = 'view:' + parts[1];
    var batch = Number(parts[2]);
    if (batch > Number(services.store.get(done) || '0')) {
      var events = known[key] || readBatchEvents_(services.store.get(key));
      var pointers = projectBatch_(services, events);
      pointers[done] = batch;
      services.store.setMany(pointers); // pointers and the mark move together
    }
    services.store.remove(key);
  }
  return queue.length <= VIEW_BATCHES_PER_RUN_;
}

/**
 * Catches views up, for the timer. Errors stay in the queue for the next run.
 * @param {any} services
 */
function drainViews_(services) {
  return withLock_(services, function () {
    return tryDrain_(services, {});
  });
}

/** Never throws: a view problem must not fail whoever called. */
function tryDrain_(services, known) {
  try {
    return drainQueue_(services, known);
  } catch (error) {
    console.error('Views behind: ' + (error && error.name));
    return false;
  }
}
