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
 * One row from a contract row template: `cells` by 1-based column, the
 * contract's formulas for the rest.
 * @param {Object<string, string>} template @param {number} r @param {number} width @param {Object<string, any>} cells
 */
function formulaRow_(template, r, width, cells) {
  var row = [];
  for (var column = 1; column <= width; column++) row.push(cells[column] === undefined ? '' : cells[column]);
  Object.keys(template).forEach(function (column) {
    row[Number(column) - 1] = template[column].replace(/\{r\}/g, String(r));
  });
  return row;
}

/**
 * Writes a tab's whole hub-made rows from row 2, as formulas, and blanks rows
 * no longer needed. Skipped when nothing changed.
 * @param {any} services @param {string} table @param {number} width @param {any[][]} values
 */
function writeFormulaRows_(services, table, width, values) {
  var hash = sha256Hex_(JSON.stringify(values));
  if (services.store.get('hash:' + table) === hash) return;
  var before = Number(services.store.get('rows:' + table) || '0');
  var padded = values.slice();
  while (padded.length < before) padded.push(new Array(width).fill(''));
  if (padded.length > 0) {
    var fileId = services.store.get('file:myshop');
    var last = padded.length + 1;
    growIfNeeded_(services, fileId, table, sheetInfo_(services, fileId, [table])[table], last);
    Sheets.Spreadsheets.Values.batchUpdate({
      valueInputOption: 'USER_ENTERED', // these are formulas, and they should calculate
      data: [{ range: "'" + table + "'!A2:" + columnLetter_(width) + last, values: padded }],
    }, fileId);
  }
  /** @type {Object<string, string | number>} */
  var marks = {};
  marks['hash:' + table] = hash;
  marks['rows:' + table] = values.length;
  services.store.setMany(marks);
}

/**
 * A Stock row per active product and location, from the contract's formulas.
 * @param {any} services @param {any} master from readMasterData_
 */
function refreshStockRows_(services, master) {
  var locations = master.tables.Locations.filter(function (l) { return l.active !== 'No'; });
  var products = master.tables.Products.filter(function (p) { return p.active !== 'No'; });
  /** @type {any[][]} */
  var values = [];
  locations.forEach(function (location) {
    products.forEach(function (product) {
      values.push(formulaRow_(VIEW_CONTRACT_.stockRow, values.length + 2, 8,
        { 1: plainText_(product.product_id), 3: plainText_(location.location) }));
    });
  });
  writeFormulaRows_(services, 'Stock', 8, values);
}

/**
 * A Balances row per contact and currency in the Money Ledger. Limits apply
 * to accounts; Settings holds no numeric limit for kept change yet.
 * @param {any} services
 */
function refreshBalanceRows_(services) {
  var reply = Sheets.Spreadsheets.Values.batchGet(services.store.get('file:myshop'), {
    ranges: ["'Money Ledger'!A:Z", "'Contacts'!A:AZ"], valueRenderOption: 'UNFORMATTED_VALUE',
  });
  var ledger = reply.valueRanges[0].values || [];
  var pricing = services.store.get('pricingCurrency');
  /** @type {Object<string, any>} */
  var byId = {};
  tableRows_('Contacts', reply.valueRanges[1].values || [], pricing, []).forEach(function (c) { byId[c.contact_id] = c; });
  var heads = ledger[0] || [];
  var idAt = heads.indexOf('Contact ID');
  var currencyAt = heads.indexOf('Currency');
  /** @type {Object<string, boolean>} */
  var seen = {};
  var values = [];
  ledger.slice(1).forEach(function (row) {
    var id = row[idAt];
    var key = id + '|' + row[currencyAt];
    if (!id || seen[key]) return;
    seen[key] = true;
    var contact = byId[id] || {};
    var account = contact.type === 'Customer' && contact.on_account === 'Yes';
    var what = account ? 'Account (invoices)' : contact.type === 'Supplier' ? 'Supplier invoices' : 'Kept change';
    values.push(formulaRow_(VIEW_CONTRACT_.balanceRow, values.length + 2, 10, {
      1: plainText_(String(id)), 4: what, 5: row[currencyAt],
      8: account ? contact.credit_limit_pricing : undefined,
    }));
  });
  writeFormulaRows_(services, 'Balances', 10, values);
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
