// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Batch acceptance. Each device numbers its batches from 1; the hub keeps
// only the highest number stored (journal:P2), so duplicate detection costs
// one small property per device however long the shop trades.

/** @param {any} body */
function checkBatch_(body) {
  var valid = Number.isSafeInteger(body.batch) && body.batch >= 1 &&
    Array.isArray(body.events) && body.events.length >= 1 &&
    body.events.length <= LIMITS_.maxEvents &&
    typeof body.hash === 'string' && PATTERNS_.hash.test(body.hash);
  if (!valid) {
    throw hubError_('validation', 'bad_batch',
      'A batch needs a number from 1, 1 to 500 events and a SHA-256 hash.');
  }
  if (!constantTimeEqual_(sha256Hex_(canonicalJson_(body.events)), body.hash)) {
    throw hubError_('integrity_conflict', 'hash_mismatch', 'The events do not match their hash.');
  }
}

/**
 * `journal.put`: stores the next batch durably, then acknowledges it. A batch
 * already stored is acknowledged again without being stored twice.
 * @param {any} request
 * @param {any} services
 * @param {any} device
 */
function putJournal_(request, services, device) {
  var body = request.body;
  checkBatch_(body);
  return withLock_(services, function () {
    var key = 'journal:' + device.id;
    var through = Number(services.store.get(key) || '0');
    if (body.batch <= through) return { status: 'accepted', through: through };
    if (body.batch > through + 1) return { status: 'gap', need: through + 1 };
    var stored;
    try {
      stored = services.journalWriter.write({
        device: device.id, batch: body.batch, events: body.events,
        hash: body.hash, receivedAt: services.now(),
      });
    } catch (error) {
      if (/** @type {any} */ (error).hub) throw error;
      throw hubError_('retryable_unavailable', 'storage_unavailable',
        'The batch could not be stored; send it again.');
    }
    var queued = 'viewq:' + device.id + ':' + ('00000' + body.batch).slice(-6);
    /** @type {Object<string, string | number>} */
    var marks = {};
    marks[key] = body.batch;
    marks[queued] = stored.id;
    marks['seen:' + device.id] = services.now();
    services.store.setMany(marks); // accepted and queued for views, in one write
    /** @type {Object<string, any[]>} */
    var known = {};
    known[queued] = body.events;
    tryDrain_(services, known);
    return { status: 'accepted', through: body.batch };
  });
}
