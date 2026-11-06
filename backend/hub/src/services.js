// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * The Google services one execution uses, in one object so tests can replace
 * any of them. Handlers never reach for Google globals directly, except the
 * thin Drive and fetch wrappers.
 * @param {object} [overrides]
 */
function createServices_(overrides) {
  var store = createPropertyStore_(PropertiesService.getScriptProperties());
  var services = {
    store: store,
    cache: CacheService.getScriptCache(),
    lock: LockService.getScriptLock(),
    now: function () { return Math.floor(Date.now() / 1000); },
    install: { codeHash: INSTALL_CODE_HASH_, installedAt: INSTALLED_AT_ },
    templates: TEMPLATE_MANIFEST_,
    journalWriter: driveJournalWriter_(store),
  };
  return Object.assign(services, overrides || {});
}

/**
 * Runs `work` under the script lock and always releases it. The property
 * store is reloaded once the lock is held, so counters read inside are
 * current. A lock that can't be had in time is a retryable error.
 * @template T
 * @param {any} services
 * @param {() => T} work
 * @returns {T}
 */
function withLock_(services, work) {
  try {
    services.lock.waitLock(LIMITS_.lockWaitMillis);
  } catch (error) {
    throw hubError_(ERRORS_.busy, 'The hub is busy; try again.');
  }
  try {
    services.store.reload();
    return work();
  } finally {
    services.lock.releaseLock();
  }
}
