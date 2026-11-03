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

function createProperties() {
  const map = new Map();
  return {
    map,
    getProperty: (key) => (map.has(key) ? map.get(key) : null),
    setProperty(key, value) {
      map.set(key, String(value));
      return this;
    },
    deleteProperty(key) {
      map.delete(key);
      return this;
    },
    getProperties: () => Object.fromEntries(map),
  };
}

function createCache(clock) {
  const map = new Map();
  return {
    get(key) {
      const entry = map.get(key);
      if (!entry || entry.expires <= clock.now()) return null;
      return entry.value;
    },
    put(key, value, seconds) {
      map.set(key, { value: String(value), expires: clock.now() + seconds });
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

function createDrive() {
  const files = [];
  return {
    files,
    Files: {
      create(resource, blob) {
        const file = { id: `file-${files.length + 1}`, ...resource };
        file.content = blob ? blob.getDataAsString() : null;
        files.push(file);
        return file;
      },
    },
  };
}

/** The fake Google globals, plus handles tests use to inspect them. */
function createGoogle(options = {}) {
  const clock = { seconds: options.now ?? 1793700000 };
  clock.now = () => clock.seconds;
  const properties = createProperties();
  const cache = createCache(clock);
  const lock = createLock();
  const drive = createDrive();
  return {
    clock,
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest(algorithm, value) {
        return toSignedBytes(crypto.createHash('sha256').update(toBuffer(value)).digest());
      },
      computeHmacSha256Signature(value, key) {
        const mac = crypto.createHmac('sha256', toBuffer(key));
        return toSignedBytes(mac.update(toBuffer(value)).digest());
      },
      getUuid: () => crypto.randomUUID(),
      newBlob: (data, contentType, name) => ({
        getDataAsString: () => String(data),
        contentType,
        name,
      }),
    },
    PropertiesService: { getScriptProperties: () => properties },
    CacheService: { getScriptCache: () => cache },
    LockService: { getScriptLock: () => lock },
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
  };
}

module.exports = { createGoogle };
