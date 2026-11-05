// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Scheduled work, which runs whether or not any phone is on. Time triggers
// share a daily runtime budget (90 minutes on a Gmail account), so runViews
// does nothing when the queue is empty and dailyJob makes one pass.

var MONEY_IN_STATUSES_ = ['Paid', 'Given', 'Refunded', 'Paid later'];
var FIRST_DAY_OF_NEXT_MONTH_FILE_ = 25;
var DAYS_TO_CLOSE_LAST_MONTH_ = 3;

/** Timer: catches the Sheets views up. */
function runViews() {
  drainViews_(createServices_());
}

/** Timer: the daily pass. */
function dailyJob() {
  runDaily_(createServices_());
}

/** Creates each timer once. */
function installTriggers_() {
  var existing = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  if (existing.indexOf('runViews') < 0) {
    ScriptApp.newTrigger('runViews').timeBased().everyMinutes(15).create();
  }
  if (existing.indexOf('dailyJob') < 0) {
    ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(3).create();
  }
}

/** @param {string} period @param {number} months e.g. ("2026-12", 1) is "2027-01" */
function addMonths_(period, months) {
  var total = Number(period.slice(0, 4)) * 12 + Number(period.slice(5)) - 1 + months;
  return Math.floor(total / 12) + '-' + ('0' + (total % 12 + 1)).slice(-2);
}

/** Money received in a month, per currency, from its Payments rows. @param {any[][]} grid */
function moneyIn_(grid) {
  var heads = grid[0] || [];
  var column = function (name) { return heads.indexOf(name); };
  /** @type {Object<string, number>} */
  var totals = { USD: 0, ZWG: 0, ZAR: 0 };
  grid.slice(1).forEach(function (row) {
    var currency = row[column('Currency')];
    var counted = MONEY_IN_STATUSES_.indexOf(row[column('Status')]) >= 0 &&
      String(row[column('Method')]).indexOf('Kept change') !== 0;
    if (counted && currency in totals) totals[currency] += Number(row[column('Amount')]) || 0;
  });
  Object.keys(totals).forEach(function (c) { totals[c] = Math.round(totals[c] * 100) / 100; });
  return totals;
}

/** A column's distinct values, sorted. @param {any[][]} grid @param {string} heading */
function distinct_(grid, heading) {
  var at = (grid[0] || []).indexOf(heading);
  if (at < 0) return [];
  /** @type {Object<string, boolean>} */
  var seen = {};
  grid.slice(1).forEach(function (row) { if (row[at] !== '' && row[at] !== undefined) seen[row[at]] = true; });
  return Object.keys(seen).sort();
}

/** Each product sold, best seller first, as [id, name]. @param {any[][]} grid */
function productsSold_(grid) {
  var heads = grid[0] || [];
  /** @type {Object<string, {name: string, qty: number}>} */
  var totals = {};
  grid.slice(1).forEach(function (row) {
    var id = row[heads.indexOf('Product ID')];
    if (!id) return;
    totals[id] = totals[id] || { name: row[heads.indexOf('Product')], qty: 0 };
    totals[id].qty += Number(row[heads.indexOf('Qty')]) || 0;
  });
  return Object.keys(totals).sort(function (a, b) { return totals[b].qty - totals[a].qty || (a < b ? -1 : 1); })
    .map(function (id) { return [id, totals[id].name]; });
}

/** One block's labels as a write, blank to its end. @param {any} block @param {any[][]} rows @param {number} width */
function blockWrite_(block, rows, width) {
  var values = rows.slice(0, block.rows);
  while (values.length < block.rows) values.push(width === 1 ? [''] : ['', '']);
  var last = block.first + block.rows - 1;
  return { range: "'Summary'!A" + block.first + ':' + columnLetter_(width) + last, values: values };
}

/**
 * Labels the month's Summary breakdowns; each row's formulas do the rest.
 * Skipped when the labels haven't changed.
 * @param {any} services @param {string} monthFile @param {string} period @param {any[]} ranges
 */
function writeSummaryLabels_(services, monthFile, period, ranges) {
  var sales = ranges[2].values || [];
  var one = function (value) { return [value]; };
  var blocks = VIEW_CONTRACT_.summaryBlocks;
  var data = [
    blockWrite_(blocks.location, distinct_(sales, 'Location').map(one), 1),
    blockWrite_(blocks.phone, distinct_(sales, 'Phone').map(one), 1),
    blockWrite_(blocks.seller, distinct_(sales, 'Seller').map(one), 1),
    blockWrite_(blocks.method, distinct_(ranges[1].values || [], 'Method').map(one), 1),
    blockWrite_(blocks.product, productsSold_(ranges[3].values || []), 2),
  ];
  var key = 'summary:' + period;
  var hash = sha256Hex_(JSON.stringify(data));
  if (services.store.get(key) === hash) return;
  Sheets.Spreadsheets.Values.batchUpdate({ valueInputOption: 'RAW', data: data }, monthFile);
  services.store.set(key, hash);
}

/**
 * Writes one month's row in My Shop's Months tab, from the month file's own
 * formulas. The Reports tab reads Months, because formulas can't cross files.
 * @param {any} services @param {string} period @param {string} status
 */
function refreshMonthRow_(services, period, status) {
  var store = services.store;
  var monthFile = store.get('file:month:' + period);
  if (!monthFile) return;
  var reply = Sheets.Spreadsheets.Values.batchGet(monthFile, {
    ranges: ["'Summary'!A:E", "'Payments'!A:Z", "'Sales'!A:AZ", "'Items Sold'!A:Z"],
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  /** @type {Object<string, any[]>} */
  var summary = {};
  (reply.valueRanges[0].values || []).forEach(function (row) { summary[row[0]] = row; });
  var cell = function (label, column) { return (summary[label] || [])[column === undefined ? 1 : column]; };
  var vat = "VAT in this month's sales, less returns";
  var money = moneyIn_(reply.valueRanges[1].values || []);
  var row = {
    year: Number(period.slice(0, 4)),
    month: MONTH_NAMES_[Number(period.slice(5)) - 1].slice(0, 3),
    status: status,
    sales: cell('Month'),
    sales_incl_vat_pricing: cell('Sales, VAT included'),
    vat_pricing: cell('VAT in those sales'),
    sales_before_vat_pricing: cell('Sales before VAT'),
    cost_of_goods_sold_pricing: cell('Cost of goods sold'),
    gross_profit_pricing: cell('Gross profit'),
    output_vat_usd: cell(vat, 1), output_vat_zwg: cell(vat, 2), output_vat_zar: cell(vat, 3),
    money_in_usd: money.USD, money_in_zwg: money.ZWG, money_in_zar: money.ZAR,
    written_by: 'Shop Hub',
  };
  var shop = store.get('file:myshop');
  var rowKey = 'months:' + period;
  var pointer = 'row:' + shop + ':Months';
  var at = Number(store.get(rowKey) || store.get(pointer) || '2');
  writeRowAt_(services, shop, 'Months', at, row);
  writeSummaryLabels_(services, monthFile, period, reply.valueRanges);
  if (!store.get(rowKey)) {
    /** @type {Object<string, string | number>} */
    var marks = {};
    marks[rowKey] = at;
    marks[pointer] = at + 1;
    store.setMany(marks);
  }
}

/** Runs one step; a failure is logged and the next step still runs. */
function dailyStep_(name, work) {
  try {
    work();
  } catch (error) {
    console.error('Daily step failed: ' + name + ': ' + (error && error.name));
  }
}

/** One daily pass, in the shop's time zone. @param {any} services */
function runDaily_(services) {
  return withLock_(services, function () {
    var store = services.store;
    if (!store.get('file:myshop')) return;
    var today = Utilities.formatDate(new Date(services.now() * 1000), store.get('timeZone'), 'yyyy-MM-dd');
    var period = today.slice(0, 7);
    var year = today.slice(0, 4);
    var date = Number(today.slice(8));
    dailyStep_('month files', function () {
      ensureMonthFile_(services, period);
      if (date >= FIRST_DAY_OF_NEXT_MONTH_FILE_) ensureMonthFile_(services, addMonths_(period, 1));
    });
    dailyStep_('data year', function () {
      if (store.get('dataYear') === year) return;
      /** @type {Object<string, string | number>} */
      var cells = {};
      cells[TEMPLATE_CELLS_.myShop.dataYear] = Number(year);
      writeCells_(store.get('file:myshop'), cells);
      store.set('dataYear', year);
    });
    tryDrain_(services, {});
    dailyStep_('months', function () {
      refreshMonthRow_(services, period, 'To date');
      if (date <= DAYS_TO_CLOSE_LAST_MONTH_) refreshMonthRow_(services, addMonths_(period, -1), 'Closed');
    });
    dailyStep_('payments', function () {
      reviewPayments_(services);
    });
    dailyStep_('stock rows', function () {
      refreshStockRows_(services, readMasterData_(services));
    });
    dailyStep_('balances', function () {
      refreshBalanceRows_(services);
    });
  });
}

/**
 * `status`: the backend's health, for the owner's screen. No secrets.
 * @param {any} request @param {any} services
 */
function readStatus_(request, services) {
  var store = services.store;
  var phones = Object.keys(store.getAll())
    .filter(function (key) { return key.indexOf('device:') === 0; })
    .map(function (key) { return JSON.parse(store.get(key)); })
    .filter(function (device) { return !device.revoked; })
    .map(function (device) {
      return {
        device: device.id, name: device.name, role: device.role,
        through: Number(store.get('journal:' + device.id) || '0'),
        viewed: Number(store.get('view:' + device.id) || '0'),
        lastSeen: Number(store.get('seen:' + device.id) || '0'),
      };
    });
  return {
    hub: HUB_VERSION_,
    protocols: [PROTOCOL_VERSION_],
    business: store.get('businessId') || '',
    pricingCurrency: store.get('pricingCurrency') || '',
    views: { queued: viewQueue_(services).length, skipped: Number(store.get('view:skipped') || '0') },
    payments: Object.keys(store.getAll())
      .filter(function (key) { return key.indexOf('paykey:') === 0; })
      .map(function (key) { return key.slice('paykey:'.length); }),
    phones: phones,
  };
}
