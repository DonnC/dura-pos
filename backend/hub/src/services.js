// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * The Google services a request uses, in one object so tests can replace any
 * of them. Handlers never reach for Google globals directly.
 * @param {object} [overrides]
 */
function createServices_(overrides) {
  var props = PropertiesService.getScriptProperties();
  var services = {
    props: props,
    cache: CacheService.getScriptCache(),
    lock: LockService.getScriptLock(),
    now: function () { return Math.floor(Date.now() / 1000); },
    business: props.getProperty('businessId') || '',
    install: { codeHash: INSTALL_CODE_HASH_, installedAt: INSTALLED_AT_ },
    journalWriter: driveJournalWriter_(props),
  };
  return Object.assign(services, overrides || {});
}

/**
 * Runs `work` under the script lock and always releases it. A lock that
 * can't be had in time is a retryable error, never a half-done write.
 * @template T
 * @param {any} services
 * @param {() => T} work
 * @returns {T}
 */
function withLock_(services, work) {
  try {
    services.lock.waitLock(LIMITS_.lockWaitMillis);
  } catch (error) {
    throw hubError_('retryable_unavailable', 'busy', 'The hub is busy; try again.');
  }
  try {
    return work();
  } finally {
    services.lock.releaseLock();
  }
}
