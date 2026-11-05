// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Photos and exports, stored in the shop's own Drive:
//
//   <shop>/Product photos/P001.jpg
//   <shop>/2026/Supplier invoices/P2-PUR261103-0001.jpg
//   <shop>/Exports/2026-11 November 2026-11-30.xlsx

var ATTACHMENT_ID_ = /^[A-Za-z0-9-]{1,40}$/;
var ATTACHMENT_TYPES_ = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
var ATTACHMENT_RETRY_SECONDS_ = 21600;
var XLSX_MIME_ = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Today in the shop's time zone. @param {any} services */
function shopToday_(services) {
  return Utilities.formatDate(new Date(services.now() * 1000), services.store.get('timeZone'), 'yyyy-MM-dd');
}

/** The folder a kind of photo goes in. Call inside the lock. @param {any} services @param {string} kind */
function attachmentFolder_(services, kind) {
  var store = services.store;
  var shop = store.get('file:business');
  if (!shop) throw hubError_('retryable_unavailable', 'not_set_up', 'The shop is not set up yet.');
  if (kind === 'product') {
    return ensureFile_(services, 'file:photos', function () { return createFolder_('Product photos', shop); });
  }
  var year = shopToday_(services).slice(0, 4);
  var parent = ensureFile_(services, 'file:year:' + year, function () { return createFolder_(year, shop); });
  return ensureFile_(services, 'file:invoices:' + year, function () { return createFolder_('Supplier invoices', parent); });
}

/**
 * `attachment.put`: a product or supplier-invoice photo. The request's
 * signature already covers the bytes. A retry of the same photo within
 * hours returns the first file instead of making a second.
 * @param {any} request @param {any} services
 */
function putAttachment_(request, services) {
  var body = request.body;
  var extension = ATTACHMENT_TYPES_[body.contentType];
  var valid = (body.kind === 'product' || body.kind === 'invoice') && ATTACHMENT_ID_.test(body.id) && extension &&
    typeof body.data === 'string' && body.data.length > 0 && body.data.length <= LIMITS_.attachmentBase64Length;
  if (!valid) {
    throw hubError_('validation', 'bad_attachment', 'A photo needs a kind, an ID, a JPEG, PNG or WebP type, and at most 1 MB of data.');
  }
  var name = body.id + extension;
  var retryKey = 'attachment:' + sha256Hex_(body.kind + body.id + body.data);
  var seen = services.cache.get(retryKey);
  if (seen) return JSON.parse(seen);
  var bytes;
  try {
    bytes = Utilities.base64Decode(body.data);
  } catch (error) {
    throw hubError_('validation', 'bad_attachment', 'The photo is not valid base64.');
  }
  var folder = withLock_(services, function () { return attachmentFolder_(services, body.kind); });
  var file = driveCreate_({ name: name, parents: [folder] }, Utilities.newBlob(bytes, body.contentType, name));
  var reply = { file: file, name: name };
  services.cache.put(retryKey, JSON.stringify(reply), ATTACHMENT_RETRY_SECONDS_);
  return reply;
}

/** Text in a CSV cell. A leading =, +, - or @ is kept from running as a formula in Excel. @param {any} value */
function csvCell_(value) {
  var text = value === undefined || value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text) && isNaN(Number(text))) text = "'" + text;
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

/** The workbook's whole .xlsx, through Drive's export. @param {string} fileId */
function exportXlsx_(fileId) {
  var url = 'https://www.googleapis.com/drive/v3/files/' + fileId + '/export?mimeType=' + encodeURIComponent(XLSX_MIME_);
  var reply = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  if (reply.getResponseCode() !== 200) {
    throw hubError_('retryable_unavailable', 'export_failed', 'Google Drive could not export the workbook.');
  }
  return reply.getBlob().setContentType(XLSX_MIME_);
}

/** One tab as CSV, as the sheet shows it. @param {string} fileId @param {string} table */
function exportCsv_(fileId, table) {
  var reply = Sheets.Spreadsheets.Values.batchGet(fileId, { ranges: ["'" + table + "'!A:AZ"] });
  var rows = (reply.valueRanges[0].values || []).map(function (row) { return row.map(csvCell_).join(','); });
  return Utilities.newBlob(rows.join('\r\n'), 'text/csv', table + '.csv');
}

/**
 * `export.request`, owner only: an Excel copy of a workbook, or one tab as
 * CSV, saved to `Exports/`. The shop's records may hold customers' details,
 * so a seller's phone can't ask for them.
 * @param {any} request @param {any} services @param {any} device
 */
function requestExport_(request, services, device) {
  requireOwner_(device);
  var body = request.body;
  var store = services.store;
  var isMonth = /^\d{4}-\d{2}$/.test(body.file);
  var fileId = body.file === 'myShop' ? store.get('file:myshop') : isMonth ? store.get('file:month:' + body.file) : null;
  var csv = body.format === 'csv' && typeof body.table === 'string' && /^[A-Za-z -]{1,40}$/.test(body.table);
  if (!fileId || !(csv || body.format === 'xlsx')) {
    throw hubError_('validation', 'bad_export', 'An export needs myShop or a month with a file, and xlsx, or csv with a tab name.');
  }
  var title = isMonth ? body.file + ' ' + MONTH_NAMES_[Number(body.file.slice(5)) - 1] : 'My Shop';
  var name = title + (csv ? ' ' + body.table : '') + ' ' + shopToday_(services) + (csv ? '.csv' : '.xlsx');
  var blob = csv ? exportCsv_(fileId, body.table) : exportXlsx_(fileId);
  var folder = withLock_(services, function () {
    return ensureFile_(services, 'file:exports', function () { return createFolder_('Exports', store.get('file:business')); });
  });
  var file = driveCreate_({ name: name, parents: [folder] }, blob);
  return { file: file, name: name };
}
