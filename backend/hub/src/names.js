// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Every word two places must spell the same: protocol words, Script Property
// and cache keys, workbook and tab names. A typo in a name fails `npm run
// check`; a typo in free text is a bug nobody sees. Object.freeze is what gives
// that check: TypeScript lets a plain object literal in a .js file grow new
// properties, so a misspelt name there would pass.
//
// Only plain values here, because Apps Script may load files in any order: no
// other file's constants at load time. The protocol words are also pinned in
// the fixture protocol_names.json, which the Dart client's tests read too.
// Changing a store value strands what installed hubs already saved.

var ACTIONS_ = Object.freeze({
  pair: 'pair',
  pairingCreate: 'pairing.create',
  deviceRevoke: 'device.revoke',
  journalPut: 'journal.put',
  setupRun: 'setup.run',
  changesPull: 'changes.pull',
  status: 'status',
  keysSet: 'keys.set',
  paymentStart: 'payment.start',
  paymentCheck: 'payment.check',
  attachmentPut: 'attachment.put',
  exportRequest: 'export.request',
});

var ERROR_CATEGORIES_ = Object.freeze({
  validation: 'validation',
  permission: 'permission',
  authenticationRequired: 'authentication_required',
  retryableUnavailable: 'retryable_unavailable',
  unknownExternalOutcome: 'unknown_external_outcome',
  integrityConflict: 'integrity_conflict',
});

/** One entry per error, so a code can't be paired with the wrong category. */
var ERRORS_ = Object.freeze({
  badAttachment: { category: ERROR_CATEGORIES_.validation, code: 'bad_attachment' },
  badBatch: { category: ERROR_CATEGORIES_.validation, code: 'bad_batch' },
  badEnvelope: { category: ERROR_CATEGORIES_.validation, code: 'bad_envelope' },
  badExport: { category: ERROR_CATEGORIES_.validation, code: 'bad_export' },
  badKeys: { category: ERROR_CATEGORIES_.validation, code: 'bad_keys' },
  badPayment: { category: ERROR_CATEGORIES_.validation, code: 'bad_payment' },
  badSetup: { category: ERROR_CATEGORIES_.validation, code: 'bad_setup' },
  cannotRevokeSelf: { category: ERROR_CATEGORIES_.validation, code: 'cannot_revoke_self' },
  noSuchDevice: { category: ERROR_CATEGORIES_.validation, code: 'no_such_device' },
  noSuchPayment: { category: ERROR_CATEGORIES_.validation, code: 'no_such_payment' },
  paymentsNotSetUp: { category: ERROR_CATEGORIES_.validation, code: 'payments_not_set_up' },
  unknownAction: { category: ERROR_CATEGORIES_.validation, code: 'unknown_action' },
  unsupportedVersion: { category: ERROR_CATEGORIES_.validation, code: 'unsupported_version' },
  ownerOnly: { category: ERROR_CATEGORIES_.permission, code: 'owner_only' },
  badCode: { category: ERROR_CATEGORIES_.authenticationRequired, code: 'bad_code' },
  badSignature: { category: ERROR_CATEGORIES_.authenticationRequired, code: 'bad_signature' },
  replayedRequest: { category: ERROR_CATEGORIES_.authenticationRequired, code: 'replayed_request' },
  staleRequest: { category: ERROR_CATEGORIES_.authenticationRequired, code: 'stale_request' },
  unknownDevice: { category: ERROR_CATEGORIES_.authenticationRequired, code: 'unknown_device' },
  busy: { category: ERROR_CATEGORIES_.retryableUnavailable, code: 'busy' },
  exportFailed: { category: ERROR_CATEGORIES_.retryableUnavailable, code: 'export_failed' },
  internalError: { category: ERROR_CATEGORIES_.retryableUnavailable, code: 'internal_error' },
  notSetUp: { category: ERROR_CATEGORIES_.retryableUnavailable, code: 'not_set_up' },
  providerUnavailable: { category: ERROR_CATEGORIES_.retryableUnavailable, code: 'provider_unavailable' },
  storageUnavailable: { category: ERROR_CATEGORIES_.retryableUnavailable, code: 'storage_unavailable' },
  templateUnavailable: { category: ERROR_CATEGORIES_.retryableUnavailable, code: 'template_unavailable' },
  paymentOutcomeUnknown: { category: ERROR_CATEGORIES_.unknownExternalOutcome, code: 'payment_outcome_unknown' },
  hashMismatch: { category: ERROR_CATEGORIES_.integrityConflict, code: 'hash_mismatch' },
  referenceReused: { category: ERROR_CATEGORIES_.integrityConflict, code: 'reference_reused' },
  templateMismatch: { category: ERROR_CATEGORIES_.integrityConflict, code: 'template_mismatch' },
});

var JOURNAL_REPLIES_ = Object.freeze({ accepted: 'accepted', gap: 'gap' });
var SETUP_READY_ = 'ready';
var ROLES_ = Object.freeze({ owner: 'owner', seller: 'seller' });
var ATTACHMENT_KINDS_ = Object.freeze({ product: 'product', invoice: 'invoice' });
var EXPORT_FORMATS_ = Object.freeze({ xlsx: 'xlsx', csv: 'csv' });
var PROVIDERS_ = Object.freeze({ paynow: 'paynow' });
var PAYMENT_STATES_ = Object.freeze({ pending: 'pending', paid: 'paid', failed: 'failed', cancelled: 'cancelled', unknown: 'unknown' });
var PAYMENT_DONE_ = [PAYMENT_STATES_.paid, PAYMENT_STATES_.failed, PAYMENT_STATES_.cancelled];

/** The functions timers call. Renaming one strands the timers already installed. */
var TRIGGERS_ = Object.freeze({ runViews: 'runViews', dailyJob: 'dailyJob' });

var WORKBOOKS_ = Object.freeze({ myShop: 'myShop', month: 'month' });
var FIELD_KINDS_ = Object.freeze({ text: 'text', date: 'date', time: 'time', datetime: 'datetime' });

var TABLES_ = Object.freeze({
  balances: 'Balances',
  contacts: 'Contacts',
  currencies: 'Currencies',
  exchangeRates: 'Exchange Rates',
  fiscalDays: 'Fiscal Days',
  hsCodes: 'HS Codes',
  itemsSold: 'Items Sold',
  locations: 'Locations',
  moneyLedger: 'Money Ledger',
  months: 'Months',
  paymentCallbacks: 'Payment Callbacks',
  paymentMethods: 'Payment Methods',
  payments: 'Payments',
  products: 'Products',
  quotes: 'Quotes',
  sales: 'Sales',
  settings: 'Settings',
  staff: 'Staff',
  stock: 'Stock',
  summary: 'Summary',
});

/** The tabs a phone may pull. Their order feeds the master data's version hash. */
var MASTER_TABLES_ = [TABLES_.products, TABLES_.locations, TABLES_.staff, TABLES_.contacts,
  TABLES_.currencies, TABLES_.paymentMethods, TABLES_.settings, TABLES_.exchangeRates];

var HEADINGS_ = Object.freeze({
  amount: 'Amount',
  creditAccount: 'Credit account',
  currency: 'Currency',
  debitAccount: 'Debit account',
  location: 'Location',
  method: 'Method',
  phone: 'Phone',
  product: 'Product',
  productId: 'Product ID',
  qty: 'Qty',
  seller: 'Seller',
  status: 'Status',
});

var SETTINGS_ = Object.freeze({
  acceptedCurrencies: 'Accepted currencies',
  address: 'Address',
  businessName: 'Business name',
  fiscalisation: 'Fiscalisation',
  phone: 'Phone',
  quotes: 'Quotes',
  shopPage: 'Shop page',
});

/** Words the owner picks from dropdowns, which come from the Lists tab. */
var SHEET_WORDS_ = Object.freeze({ yes: 'Yes', no: 'No', off: 'Off', customer: 'Customer', supplier: 'Supplier' });

/** Script Properties with a fixed name. */
var STORE_KEYS_ = Object.freeze({
  businessId: 'businessId',
  businessName: 'businessName',
  dataYear: 'dataYear',
  devicesNext: 'devices:next',
  fileBusiness: 'file:business',
  fileDirectory: 'file:directory',
  fileExports: 'file:exports',
  fileJournal: 'file:journal',
  fileMyShop: 'file:myshop',
  filePhotos: 'file:photos',
  fileRoot: 'file:root',
  filledMyShop: 'filled:myshop',
  installUsed: 'install:used',
  pricingCurrency: 'pricingCurrency',
  timeZone: 'timeZone',
  viewSkipped: 'view:skipped',
});

/** Script Properties named after something, such as `device:P2`. */
var STORE_PREFIXES_ = Object.freeze({
  device: 'device:',
  filledMonth: 'filled:month:',
  formatted: 'formatted:',
  invoicesFile: 'file:invoices:',
  journal: 'journal:',
  masterHash: 'hash:',
  masterRows: 'rows:',
  monthFile: 'file:month:',
  monthRow: 'months:',
  pairing: 'pairing:',
  payment: 'pay:',
  paymentKeys: 'paykey:',
  rowPointer: 'row:',
  seen: 'seen:',
  summary: 'summary:',
  tabsShown: 'tabs:',
  view: 'view:',
  viewQueue: 'viewq:',
  yearFile: 'file:year:',
});

var CACHE_KEYS_ = Object.freeze({
  attachment: 'attachment:',
  nonce: 'nonce:',
  sheet: 'sheet:',
  storefrontList: 'storefront:list:',
  storefrontPage: 'storefront:page',
});

/** @param {string} fileId @param {string} table */
function rowPointerKey_(fileId, table) {
  return STORE_PREFIXES_.rowPointer + fileId + ':' + table;
}

/** @param {string} provider @param {string} currency */
function paymentKeysKey_(provider, currency) {
  return STORE_PREFIXES_.paymentKeys + provider + ':' + currency;
}

/** Padded, so the keys sort in batch order. @param {string} device @param {number} batch */
function viewQueueKey_(device, batch) {
  return STORE_PREFIXES_.viewQueue + device + ':' + ('00000' + batch).slice(-6);
}

/** @param {string} fileId @param {string} table */
function sheetCacheKey_(fileId, table) {
  return CACHE_KEYS_.sheet + fileId + ':' + table;
}

/** An A1 range on a named tab. @param {string} table @param {string} cells e.g. "A:E" */
function tabRange_(table, cells) {
  return "'" + table + "'!" + cells;
}
