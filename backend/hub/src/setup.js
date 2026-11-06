// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// `setup.run`: builds the shop's files in Drive.
//
//   Dura POS/
//     <shop name>/
//       business.json        the directory a new install reads; no secrets
//       My Shop              from the myShop template
//       Journal/             accepted batches
//       2026/
//         2026-11 November   from the month template
//
// After converting, one Sheets call per file fills the cells named in
// TEMPLATE_CELLS_: My Shop's name, hub version and data year, and the month's
// first day. Each fill is recorded (filled:...) so a repeat doesn't write again.
//
// The registry is Script Properties keys (file:root, file:month:2026-11, ...)
// holding Drive file IDs; files are never found by name. Each step records
// its ID as soon as it succeeds, so a run that fails part-way resumes on the
// next call without making anything twice.

var MONTH_NAMES_ = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

var TIME_ZONE_PATTERN_ = /^(UTC|[A-Z][A-Za-z_]+(\/[A-Za-z0-9_+-]+)+)$/;

// The owner chooses the pricing currency; there is no default (note 12 §7).
var PRICING_CURRENCIES_ = ['USD', 'ZWG', 'ZAR'];

/** @param {any} body */
function readSetupInput_(body) {
  var name = typeof body.name === 'string' ? body.name.trim() : '';
  var timeZone = typeof body.timeZone === 'string' ? body.timeZone : '';
  var currency = body.pricingCurrency;
  if (name.length < 1 || name.length > 80 || !TIME_ZONE_PATTERN_.test(timeZone) ||
      PRICING_CURRENCIES_.indexOf(currency) < 0) {
    throw hubError_(ERRORS_.badSetup,
      'Setup needs a shop name of 1 to 80 characters, a time zone like Africa/Harare, ' +
      'and the pricing currency the owner chose: USD, ZWG or ZAR.');
  }
  return { name: name, timeZone: timeZone, pricingCurrency: currency };
}

/**
 * A readable, unique business ID: the name, the setup date and 4 random hex,
 * e.g. chipos-corner-shop-261103-a1b2.
 * @param {string} name @param {string} yymmdd
 */
function makeBusinessId_(name, yymmdd) {
  var slug = name.toLowerCase().replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'shop';
  return slug + '-' + yymmdd + '-' + randomHex_(2);
}

/**
 * Returns the registry ID for `key`, creating it with `make` only if missing.
 * @param {any} services @param {string} key @param {() => string} make
 */
function ensureFile_(services, key, make) {
  var existing = services.store.get(key);
  if (existing) return existing;
  var id = make();
  services.store.set(key, id);
  return id;
}

/**
 * Runs `write` once for this key, recording that it's done.
 * @param {any} services @param {string} key @param {() => void} write
 */
function fillOnce_(services, key, write) {
  if (services.store.get(key)) return;
  write();
  services.store.set(key, services.now());
}

/**
 * The month's workbook, creating and filling it if it doesn't exist yet. Used
 * by setup, by the next-month job, and when a late sale needs an old month.
 * @param {any} services @param {string} period e.g. "2026-11"
 * @param {GoogleAppsScript.Base.Blob} [template] already fetched, if any
 */
function ensureMonthFile_(services, period, template) {
  var store = services.store;
  var key = STORE_PREFIXES_.monthFile + period;
  var year = period.slice(0, 4);
  var id = ensureFile_(services, key, function () {
    var blob = template ||
      fetchTemplates_(services.templates[store.get(STORE_KEYS_.pricingCurrency)], [WORKBOOKS_.month]).month;
    var folder = ensureFile_(services, STORE_PREFIXES_.yearFile + year, function () {
      return createFolder_(year, store.get(STORE_KEYS_.fileBusiness));
    });
    var name = period + ' ' + MONTH_NAMES_[Number(period.slice(5)) - 1];
    return createSheetFromXlsx_(name, folder, blob);
  });
  fillOnce_(services, STORE_PREFIXES_.filledMonth + period, function () {
    /** @type {Object<string, string | number>} */
    var cells = {};
    cells[TEMPLATE_CELLS_.month.period] = monthSerial_(period);
    writeCells_(id, cells);
  });
  return id;
}

/** @param {any} request @param {any} services @param {any} device */
function runSetup_(request, services, device) {
  requireOwner_(device);
  var input = readSetupInput_(request.body);
  return withLock_(services, function () {
    var store = services.store;
    if (!store.get(STORE_KEYS_.businessId)) {
      var day = Utilities.formatDate(new Date(services.now() * 1000), input.timeZone, 'yyMMdd');
      store.setMany({
        businessId: makeBusinessId_(input.name, day),
        businessName: input.name,
        timeZone: input.timeZone,
        pricingCurrency: input.pricingCurrency,
      });
    }
    var timeZone = store.get(STORE_KEYS_.timeZone);
    var period = Utilities.formatDate(new Date(services.now() * 1000), timeZone, 'yyyy-MM');
    var year = period.slice(0, 4);
    var monthKey = STORE_PREFIXES_.monthFile + period;

    var needed = [];
    if (!store.get(STORE_KEYS_.fileMyShop)) needed.push(WORKBOOKS_.myShop);
    if (!store.get(monthKey)) needed.push(WORKBOOKS_.month);
    var templates = fetchTemplates_(services.templates[store.get(STORE_KEYS_.pricingCurrency)], needed);

    var root = ensureFile_(services, STORE_KEYS_.fileRoot, function () { return createFolder_('Dura POS', null); });
    var shop = ensureFile_(services, STORE_KEYS_.fileBusiness, function () {
      return createFolder_(store.get(STORE_KEYS_.businessName), root);
    });
    var journal = ensureFile_(services, STORE_KEYS_.fileJournal, function () { return createFolder_('Journal', shop); });
    ensureFile_(services, STORE_PREFIXES_.yearFile + year, function () { return createFolder_(year, shop); });
    var myShop = ensureFile_(services, STORE_KEYS_.fileMyShop, function () {
      return createSheetFromXlsx_('My Shop', shop, templates.myShop);
    });
    var month = ensureMonthFile_(services, period, templates.month);
    ensureFile_(services, STORE_KEYS_.fileDirectory, function () {
      return createJsonFile_('business.json', shop, {
        format: 1,
        businessId: store.get(STORE_KEYS_.businessId),
        businessName: store.get(STORE_KEYS_.businessName),
        timeZone: timeZone,
        pricingCurrency: store.get(STORE_KEYS_.pricingCurrency),
        files: { root: root, business: shop, journal: journal, myShop: myShop },
      });
    });
    fillOnce_(services, STORE_KEYS_.filledMyShop, function () {
      /** @type {Object<string, string | number>} */
      var cells = {};
      cells[TEMPLATE_CELLS_.myShop.businessName] = store.get(STORE_KEYS_.businessName);
      cells[TEMPLATE_CELLS_.myShop.hubVersion] = HUB_VERSION_;
      cells[TEMPLATE_CELLS_.myShop.dataYear] = Number(year);
      writeCells_(myShop, cells);
      store.set(STORE_KEYS_.dataYear, year);
    });
    installTriggers_();
    return {
      status: SETUP_READY_,
      business: store.get(STORE_KEYS_.businessId),
      period: period,
      files: { business: shop, journal: journal, myShop: myShop, month: month },
    };
  });
}
