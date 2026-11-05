// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// `changes.pull`: the tabs the owner edits, read once and handed to phones.
// Sheet edits are proposals: a bad row is skipped and listed, never passed on.
// The version is a hash of what was read, so a phone already up to date gets
// a short reply and spends almost no data.

var MASTER_TABLES_ = ['Products', 'Locations', 'Staff', 'Contacts', 'Currencies', 'Payment Methods',
  'Settings', 'Exchange Rates'];

/**
 * A heading's field ID, the same rule as the generator's: `Price (USD)` is
 * `price_pricing`, whatever the pricing currency.
 * @param {string} heading @param {string} pricing
 */
function fieldId_(heading, pricing) {
  return heading.replace('(' + pricing + ')', 'pricing').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** The reason a row can't be used, or null. @param {string} table @param {any} row */
function rowProblem_(table, row) {
  if (table !== 'Products') return null;
  var price = row.price_pricing;
  if (!row.product_id || !row.name || price === '' || price === undefined || isNaN(Number(price))) {
    return 'A product needs an ID, a name and a price.';
  }
  return null;
}

/**
 * Rows as objects keyed by field ID, all values as strings.
 * @param {string} table @param {any[][]} grid headings first @param {string} pricing
 * @param {any[]} skipped collects rows that were refused
 */
function tableRows_(table, grid, pricing, skipped) {
  var ids = (grid[0] || []).map(function (heading) { return fieldId_(String(heading), pricing); });
  var rows = [];
  grid.slice(1).forEach(function (cells, index) {
    if (!cells.some(function (cell) { return cell !== ''; })) return;
    /** @type {Object<string, string>} */
    var row = {};
    ids.forEach(function (id, column) {
      row[id] = cells[column] === undefined ? '' : String(cells[column]);
    });
    var problem = rowProblem_(table, row);
    if (problem) skipped.push({ table: table, row: index + 2, reason: problem });
    else rows.push(row);
  });
  return rows;
}

/** One read of every tab. Dates come back formatted, numbers as numbers. */
function readMasterData_(services) {
  var fileId = services.store.get('file:myshop');
  if (!fileId) throw hubError_('retryable_unavailable', 'not_set_up', 'The shop is not set up yet.');
  var reply = Sheets.Spreadsheets.Values.batchGet(fileId, {
    ranges: MASTER_TABLES_.map(function (table) { return "'" + table + "'!A:AZ"; }),
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });
  var pricing = services.store.get('pricingCurrency');
  /** @type {Object<string, any[]>} */
  var tables = {};
  /** @type {any[]} */
  var skipped = [];
  MASTER_TABLES_.forEach(function (table, i) {
    tables[table] = tableRows_(table, reply.valueRanges[i].values || [], pricing, skipped);
  });
  return { tables: tables, skipped: skipped, version: sha256Hex_(JSON.stringify(tables)) };
}

/** Keeps an ID as text when the row is written USER_ENTERED, so `007` stays `007` and `=x` stays `=x`. */
function plainText_(value) {
  return /^[A-Za-z]/.test(value) ? value : "'" + value;
}

/**
 * Writes a Stock row per active product and location, from the contract's
 * formulas, and blanks rows no longer needed. Skipped when nothing changed.
 * @param {any} services @param {any} master from readMasterData_
 */
function refreshStockRows_(services, master) {
  var locations = master.tables.Locations.filter(function (l) { return l.active !== 'No'; });
  var products = master.tables.Products.filter(function (p) { return p.active !== 'No'; });
  /** @type {any[][]} */
  var values = [];
  locations.forEach(function (location) {
    products.forEach(function (product) {
      var r = values.length + 2;
      var row = ['', '', '', '', '', '', '', ''];
      row[0] = plainText_(product.product_id);
      row[2] = plainText_(location.location);
      Object.keys(VIEW_CONTRACT_.stockRow).forEach(function (column) {
        row[Number(column) - 1] = VIEW_CONTRACT_.stockRow[column].replace(/\{r\}/g, String(r));
      });
      values.push(row);
    });
  });
  var hash = sha256Hex_(JSON.stringify(values));
  if (services.store.get('stock:hash') === hash) return;
  var before = Number(services.store.get('stock:rows') || '0');
  var count = values.length;
  while (values.length < before) values.push(['', '', '', '', '', '', '', '']);
  if (values.length > 0) {
    var fileId = services.store.get('file:myshop');
    var last = values.length + 1;
    growIfNeeded_(services, fileId, 'Stock', sheetInfo_(services, fileId, ['Stock']).Stock, last);
    Sheets.Spreadsheets.Values.batchUpdate({
      valueInputOption: 'USER_ENTERED', // these are formulas, and they should calculate
      data: [{ range: "'Stock'!A2:H" + last, values: values }],
    }, fileId);
  }
  services.store.setMany({ 'stock:hash': hash, 'stock:rows': count });
}

/**
 * `changes.pull`: master data, or a short reply if `since` is still current.
 * @param {any} request @param {any} services
 */
function pullChanges_(request, services) {
  return withLock_(services, function () {
    var master = readMasterData_(services);
    refreshStockRows_(services, master);
    if (request.body.since === master.version) return { unchanged: true, version: master.version };
    return { unchanged: false, version: master.version, tables: master.tables, skipped: master.skipped };
  });
}
