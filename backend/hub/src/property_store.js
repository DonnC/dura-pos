// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * Script Properties read once per execution. Property calls count against a
 * daily quota, and the whole store is small (devices, counters, registry), so
 * one getProperties() replaces many getProperty() calls. Writes go straight
 * through. withLock_ calls reload() after taking the lock, so anything read
 * inside the lock is current even if another execution just wrote it.
 * @param {GoogleAppsScript.Properties.Properties} props
 */
function createPropertyStore_(props) {
  /** @type {Object<string, string> | null} */
  var values = null;

  function load() {
    if (values === null) values = props.getProperties();
    return values;
  }

  return {
    /** @param {string} key @returns {string | null} */
    get: function (key) {
      var all = load();
      return Object.prototype.hasOwnProperty.call(all, key) ? all[key] : null;
    },
    /** A read-only view of every value; don't modify it. */
    getAll: function () {
      return load();
    },
    /** @param {string} key @param {string | number} value */
    set: function (key, value) {
      props.setProperty(key, String(value));
      load()[key] = String(value);
    },
    /** Several values in one quota call. @param {Object<string, string | number>} entries */
    setMany: function (entries) {
      /** @type {Object<string, string>} */
      var text = {};
      Object.keys(entries).forEach(function (key) { text[key] = String(entries[key]); });
      props.setProperties(text);
      Object.assign(load(), text);
    },
    /** @param {string} key */
    remove: function (key) {
      props.deleteProperty(key);
      delete load()[key];
    },
    reload: function () {
      values = null;
    },
  };
}
