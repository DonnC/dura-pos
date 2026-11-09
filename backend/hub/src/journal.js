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
    throw hubError_(ERRORS_.badBatch,
      'A batch needs a number from 1, 1 to 500 events and a SHA-256 hash.');
  }
  if (!constantTimeEqual_(sha256Hex_(canonicalJson_(body.events)), body.hash)) {
    throw hubError_(ERRORS_.hashMismatch, 'The events do not match their hash.');
  }
}

/**
 * A number the hub has passed is a re-send, or a phone reusing a number. Treating
 * the second as a re-send would lose its events without an error, so the batch
 * must match what's stored. Only re-sends pay for this one Drive read.
 * @param {any} services @param {any} device @param {any} body
 */
function confirmSameBatch_(services, device, body) {
  var stored;
  try {
    stored = services.journalWriter.read(device.id, body.batch);
  } catch (error) {
    if (/** @type {any} */ (error).hub) throw error;
    throw hubError_(ERRORS_.storageUnavailable, 'The stored batch could not be read; send it again.');
  }
  if (!stored || !constantTimeEqual_(stored.hash, body.hash)) {
    throw hubError_(ERRORS_.batchReused, 'This batch number already holds different events.');
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
    var key = STORE_PREFIXES_.journal + device.id;
    var through = Number(services.store.get(key) || '0');
    if (body.batch <= through) {
      confirmSameBatch_(services, device, body);
      return { status: JOURNAL_REPLIES_.accepted, through: through };
    }
    if (body.batch > through + 1) return { status: JOURNAL_REPLIES_.gap, need: through + 1 };
    var stored;
    try {
      stored = services.journalWriter.write({
        device: device.id, batch: body.batch, events: body.events,
        hash: body.hash, receivedAt: services.now(),
      });
    } catch (error) {
      if (/** @type {any} */ (error).hub) throw error;
      throw hubError_(ERRORS_.storageUnavailable,
        'The batch could not be stored; send it again.');
    }
    var queued = viewQueueKey_(device.id, body.batch);
    /** @type {Object<string, string | number>} */
    var marks = {};
    marks[key] = body.batch;
    marks[queued] = stored.id;
    marks[STORE_PREFIXES_.seen + device.id] = services.now();
    services.store.setMany(marks); // accepted and queued for views, in one write
    /** @type {Object<string, any[]>} */
    var known = {};
    known[queued] = body.events;
    tryDrain_(services, known);
    return { status: JOURNAL_REPLIES_.accepted, through: body.batch };
  });
}
