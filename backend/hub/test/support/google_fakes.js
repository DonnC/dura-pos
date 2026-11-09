// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// In-memory stand-ins for the Apps Script services the hub uses. They mimic
// the real return shapes, e.g. signed byte arrays from Utilities.

'use strict';

const crypto = require('node:crypto');

/** Java-style signed bytes, as Utilities returns them. */
function toSignedBytes(buffer) {
  return Array.from(buffer, (b) => (b > 127 ? b - 256 : b));
}

function toBuffer(value) {
  if (typeof value === 'string') return Buffer.from(value, 'utf8');
  return Buffer.from(value.map((b) => (b < 0 ? b + 256 : b)));
}

/** Script Properties, counting calls the way the daily quota counts them. */
function createProperties() {
  const map = new Map();
  const calls = { reads: 0, writes: 0 };
  return {
    map,
    calls,
    getProperty(key) {
      calls.reads += 1;
      return map.has(key) ? map.get(key) : null;
    },
    getProperties() {
      calls.reads += 1;
      return Object.fromEntries(map);
    },
    setProperty(key, value) {
      calls.writes += 1;
      map.set(key, String(value));
      return this;
    },
    setProperties(values) {
      calls.writes += 1;
      for (const [key, value] of Object.entries(values)) map.set(key, String(value));
      return this;
    },
    deleteProperty(key) {
      calls.writes += 1;
      map.delete(key);
      return this;
    },
  };
}

function createBlob(data, contentType, name) {
  const bytes = typeof data === 'string' ? Array.from(Buffer.from(data, 'utf8')) : data;
  const blob = {
    bytes,
    contentType: contentType || null,
    name: name || null,
    getBytes: () => bytes,
    getDataAsString: () => toBuffer(bytes).toString('utf8'),
    getContentType: () => blob.contentType,
    setName(value) {
      blob.name = value;
      return blob;
    },
    setContentType(type) {
      blob.contentType = type;
      return blob;
    },
  };
  return blob;
}

/** UrlFetchApp serving fixed responses by URL; unknown URLs answer 404. */
function createUrlFetch() {
  const routes = new Map();
  const log = [];
  const respond = (request, options) => {
    const url = typeof request === 'string' ? request : request.url;
    log.push(url);
    if (options) urlFetch.posts.push({ url, options });
    const media = /drive\/v3\/files\/([^?]+)\?alt=media/.exec(url);
    const stored = media && urlFetch.drive.files.find((f) => f.id === media[1]);
    const found = routes.get(url);
    const answer = typeof found === 'function' ? found(options) : found;
    const route = stored ? { code: 200, body: stored.content } : answer || { code: 404, body: 'Not Found' };
    const bytes = toSignedBytes(Buffer.from(route.body));
    return {
      getResponseCode: () => route.code,
      getContent: () => bytes,
      getContentText: () => Buffer.from(route.body).toString('utf8'),
      getBlob: () => createBlob(bytes, 'application/octet-stream'),
    };
  };
  const urlFetch = {
    routes,
    log,
    posts: [],
    drive: null,
    fetch: (url, options) => respond(url, options),
    fetchAll: (requests) => requests.map((request) => respond(request)),
  };
  return urlFetch;
}

function createCache(clock) {
  const map = new Map();
  return {
    get(key) {
      const entry = map.get(key);
      if (!entry || entry.expires <= clock.now()) return null;
      return entry.value;
    },
    getAll(keys) {
      return Object.fromEntries(keys.filter((k) => this.get(k) !== null).map((k) => [k, this.get(k)]));
    },
    put(key, value, seconds) {
      if (String(value).length > 100 * 1024) throw new Error('Argument too large');
      map.set(key, { value: String(value), expires: clock.now() + seconds });
    },
    putAll(values, seconds) {
      for (const [key, value] of Object.entries(values)) this.put(key, value, seconds);
    },
    remove(key) {
      map.delete(key);
    },
  };
}

function createLock() {
  const lock = { held: false, waits: 0 };
  lock.waitLock = () => {
    lock.waits += 1;
    lock.held = true;
  };
  lock.releaseLock = () => {
    lock.held = false;
  };
  return lock;
}

/** Drive v3 advanced service. `failOnCall` makes the nth create throw. */
function createDrive() {
  const files = [];
  const drive = {
    files,
    calls: 0,
    failOnCall: 0,
    Files: {
      create(resource, blob, optionalArgs) {
        drive.calls += 1;
        if (drive.calls === drive.failOnCall) throw new Error('Drive is unavailable');
        const file = { id: `file-${files.length + 1}`, ...resource };
        file.content = blob ? blob.getDataAsString() : null;
        file.uploadType = blob ? blob.getContentType() : null;
        file.fields = optionalArgs ? optionalArgs.fields : undefined;
        files.push(file);
        return { id: file.id };
      },
      list(options) {
        const name = /name = '([^']+)'/.exec(options.q)[1];
        return { files: files.filter((f) => f.name === name).map((f) => ({ id: f.id })) };
      },
    },
  };
  return drive;
}

/** The Sheets v4 advanced service. `failOnCall` makes the nth write throw. */
function createSheets() {
  const sheets = {
    writes: [],
    calls: 0,
    failOnCall: 0,
    gets: 0,
    grown: [],
    headings: {},
    cells: {},
    perFile: {},
    rowCount: 1000,
    Spreadsheets: {
      get(spreadsheetId, options) {
        sheets.gets += 1;
        return {
          sheets: options.ranges.map((range, index) => {
            const title = range.split('!')[0].replace(/'/g, '');
            const heads = sheets.headings[title] || [];
            return {
              properties: { sheetId: index, title, gridProperties: { rowCount: sheets.rowCount } },
              data: [{ rowData: [{ values: heads.map((h) => ({ formattedValue: h })) }] }],
            };
          }),
        };
      },
      batchUpdate(request) {
        for (const r of request.requests) {
          if (r.appendDimension) sheets.grown.push(r.appendDimension);
        }
        return {};
      },
      Values: {
        batchGet(spreadsheetId, options) {
          sheets.gets += 1;
          return {
            valueRanges: options.ranges.map((range) => ({
              range,
              values: (sheets.perFile[spreadsheetId] || sheets.cells)[range.split('!')[0].replace(/'/g, '')] || [],
            })),
          };
        },
        batchUpdate(request, spreadsheetId) {
          sheets.calls += 1;
          if (sheets.calls === sheets.failOnCall) throw new Error('Sheets is unavailable');
          sheets.writes.push({ spreadsheetId, request: JSON.parse(JSON.stringify(request)) });
          return { totalUpdatedCells: request.data.length };
        },
      },
    },
  };
  return sheets;
}

/** ScriptApp: the OAuth token, and time triggers described in plain words. */
function createScriptApp() {
  const app = { created: [] };
  app.getOAuthToken = () => 'fake-token';
  app.getService = () => ({ getUrl: () => 'https://script.test/exec' });
  app.getProjectTriggers = () => app.created.map((text) => ({ getHandlerFunction: () => text.split(' ')[0] }));
  app.newTrigger = (name) => ({
    timeBased: () => ({
      everyMinutes: (n) => ({ create: () => app.created.push(`${name} every ${n} minutes`) }),
      everyDays: (n) => ({
        atHour: (h) => ({ create: () => app.created.push(`${name} every day at ${h}`) }),
      }),
    }),
  });
  return app;
}

/** Utilities.formatDate for the patterns the hub uses. */
function formatDate(date, timeZone, pattern) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map((p) => [p.type, p.value]));
  return pattern
    .replace("'T'", 'T')
    .replace('HH', parts.hour)
    .replace('mm', parts.minute)
    .replace('ss', parts.second)
    .replace('yyyy', parts.year)
    .replace('yy', parts.year.slice(2))
    .replace('MM', parts.month)
    .replace('dd', parts.day);
}

/** The fake Google globals, plus handles tests use to inspect them. */
function createGoogle(options = {}) {
  const clock = { seconds: options.now ?? 1793700000 };
  clock.now = () => clock.seconds;
  const properties = createProperties();
  const cache = createCache(clock);
  const lock = createLock();
  const drive = createDrive();
  const urlFetch = createUrlFetch();
  urlFetch.drive = drive;
  return {
    clock,
    UrlFetchApp: urlFetch,
    ScriptApp: createScriptApp(),
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256', SHA_512: 'sha512' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest(algorithm, value) {
        return toSignedBytes(crypto.createHash(algorithm).update(toBuffer(value)).digest());
      },
      computeHmacSha256Signature(value, key) {
        const mac = crypto.createHmac('sha256', toBuffer(key));
        return toSignedBytes(mac.update(toBuffer(value)).digest());
      },
      getUuid: () => crypto.randomUUID(),
      newBlob: createBlob,
      base64Decode: (text) => toSignedBytes(Buffer.from(text, 'base64')),
      formatDate,
    },
    PropertiesService: { getScriptProperties: () => properties },
    CacheService: { getScriptCache: () => cache },
    LockService: { getScriptLock: () => lock },
    HtmlService: {
      createHtmlOutput(html) {
        const output = { html, title: '', meta: {} };
        output.setTitle = (value) => {
          output.title = value;
          return output;
        };
        output.addMetaTag = (name, content) => {
          output.meta[name] = content;
          return output;
        };
        return output;
      },
    },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput(text) {
        const output = { text, mimeType: null };
        output.setMimeType = (type) => {
          output.mimeType = type;
          return output;
        };
        return output;
      },
    },
    Drive: drive,
    Sheets: createSheets(),
  };
}

module.exports = { createGoogle };
