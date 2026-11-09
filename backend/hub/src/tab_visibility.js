// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Tabs a shop doesn't use yet stay hidden, so the owner sees only what they
// need. Clean templates start with these hidden, and nothing is ever deleted:
// turning a feature on shows its tab with whatever it already holds. A file costs
// no Sheets call until a shop's features differ from how the template starts.

/** @param {any} services @param {any} master */
function featuresOn_(services, master) {
  /** @type {Object<string, string>} */
  var settings = {};
  master.tables[TABLES_.settings].forEach(function (row) { settings[row.setting] = row.value; });
  var on = function (name) {
    return String(settings[name] || SHEET_WORDS_.off).indexOf(SHEET_WORDS_.off) !== 0;
  };
  var hasKeys = Object.keys(services.store.getAll()).some(function (key) {
    return key.indexOf(STORE_PREFIXES_.paymentKeys) === 0;
  });
  return { fiscal: on(SETTINGS_.fiscalisation), quotes: on(SETTINGS_.quotes), payments: hasKeys };
}

/** The optional tabs in a workbook, and whether each should show. */
function wantedTabs_(workbook, features) {
  /** @type {Object<string, boolean>} */
  var tabs = {};
  if (workbook === WORKBOOKS_.myShop) {
    tabs[TABLES_.hsCodes] = features.fiscal;
    tabs[TABLES_.paymentCallbacks] = features.payments;
  } else {
    tabs[TABLES_.fiscalDays] = features.fiscal;
    tabs[TABLES_.quotes] = features.quotes;
  }
  return tabs;
}

/**
 * Shows or hides one file's optional tabs, if they've changed. Call inside the lock.
 * @param {any} services @param {string} fileId @param {string} workbook WORKBOOKS_ @param {any} features
 */
function applyTabVisibility_(services, fileId, workbook, features) {
  var tabs = wantedTabs_(workbook, features);
  var names = Object.keys(tabs);
  var state = JSON.stringify(tabs);
  var mark = STORE_PREFIXES_.tabsShown + fileId;
  var hiddenAtFirst = JSON.stringify(wantedTabs_(workbook, { fiscal: false, quotes: false, payments: false }));
  if ((services.store.get(mark) || hiddenAtFirst) === state) return;
  var info = sheetInfo_(services, fileId, names);
  var requests = names.filter(function (name) { return info[name]; }).map(function (name) {
    return { updateSheetProperties: { properties: { sheetId: info[name].id, hidden: !tabs[name] }, fields: 'hidden' } };
  });
  if (requests.length > 0) Sheets.Spreadsheets.batchUpdate({ requests: requests }, fileId);
  services.store.set(mark, state);
}

/**
 * Brings My Shop and this month's file into line with the shop's features.
 * @param {any} services @param {any} master @param {string} period e.g. "2026-11"
 */
function refreshTabVisibility_(services, master, period) {
  var features = featuresOn_(services, master);
  var shop = services.store.get(STORE_KEYS_.fileMyShop);
  if (shop) applyTabVisibility_(services, shop, WORKBOOKS_.myShop, features);
  var month = services.store.get(STORE_PREFIXES_.monthFile + period);
  if (month) applyTabVisibility_(services, month, WORKBOOKS_.month, features);
}
