// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const client = require('./support/test_client');
const { hubWithOwner, hubWithSeller } = require('./support/hub_fixture');

const events = (...ids) => ids.map(client.saleEvent);

test('the next batch is stored, then acknowledged', () => {
  const { send, owner, written } = hubWithOwner();
  const reply = send(owner, 'journal.put', client.batch(1, events('P1-E000001')));
  assert.deepEqual(reply, { v: 1, ok: true, result: { status: 'accepted', through: 1 } });
  assert.equal(written.length, 1);
  assert.equal(written[0].device, 'P1');
  assert.equal(written[0].batch, 1);
  assert.deepEqual(written[0].events, events('P1-E000001'));
});

test('a resent batch is acknowledged again without storing it twice', () => {
  const { send, owner, written } = hubWithOwner();
  const body = client.batch(1, events('P1-E000001'));
  send(owner, 'journal.put', body);
  send(owner, 'journal.put', client.batch(2, events('P1-E000002')));
  const again = send(owner, 'journal.put', body);
  assert.deepEqual(again.result, { status: 'accepted', through: 2 });
  assert.equal(written.length, 2);
});

test('a used number with different events is refused, not acknowledged', () => {
  const { send, owner, written } = hubWithOwner();
  send(owner, 'journal.put', client.batch(1, events('P1-E000001')));
  const reply = send(owner, 'journal.put', client.batch(1, events('P1-E999999')));
  assert.equal(reply.ok, false);
  assert.equal(`${reply.error.category}/${reply.error.code}`, 'integrity_conflict/batch_reused');
  assert.equal(written.length, 1);
});

test('a used number the hub has no file for is refused', () => {
  const { send, owner, written } = hubWithOwner();
  send(owner, 'journal.put', client.batch(1, events('P1-E000001')));
  written.length = 0;
  assert.equal(send(owner, 'journal.put', client.batch(1, events('P1-E000001'))).error.code, 'batch_reused');
});

test('a re-send the hub cannot check is retried, never assumed stored', () => {
  let failing = false;
  const { send, owner } = hubWithOwner({ failReads: () => failing });
  const body = client.batch(1, events('P1-E000001'));
  send(owner, 'journal.put', body);
  failing = true;
  assert.equal(send(owner, 'journal.put', body).error.category, 'retryable_unavailable');
  failing = false;
  assert.equal(send(owner, 'journal.put', body).result.status, 'accepted');
});

test('a batch that skips ahead asks for the missing one', () => {
  const { send, owner, written } = hubWithOwner();
  send(owner, 'journal.put', client.batch(1, events('P1-E000001')));
  const reply = send(owner, 'journal.put', client.batch(3, events('P1-E000003')));
  assert.deepEqual(reply.result, { status: 'gap', need: 2 });
  assert.equal(written.length, 1);
});

test('each phone has its own batch numbers', () => {
  const { send, owner, seller } = hubWithSeller();
  assert.equal(send(owner, 'journal.put', client.batch(1, events('P1-E1'))).result.through, 1);
  assert.equal(send(seller, 'journal.put', client.batch(1, events('P2-E1'))).result.through, 1);
});

test('a batch whose hash does not match its events is refused', () => {
  const { send, owner, written } = hubWithOwner();
  const body = client.batch(1, events('P1-E000001'));
  body.events[0].data.total = '20.00';
  const reply = send(owner, 'journal.put', body);
  assert.deepEqual(reply.error.category, 'integrity_conflict');
  assert.equal(reply.error.code, 'hash_mismatch');
  assert.equal(written.length, 0);
});

test('empty, oversized or misnumbered batches are refused', () => {
  const { send, owner } = hubWithOwner();
  const tooMany = Array.from({ length: 501 }, (_, i) => `P1-E${i}`);
  for (const body of [
    client.batch(1, []),
    client.batch(1, events(...tooMany)),
    client.batch(0, events('P1-E1')),
    { batch: 1, events: events('P1-E1') },
  ]) {
    const reply = send(owner, 'journal.put', body);
    assert.equal(`${reply.error.category}/${reply.error.code}`, 'validation/bad_batch');
  }
});

test('a non-integer number anywhere in a signed body is a bad envelope', () => {
  const { send, owner } = hubWithOwner();
  const reply = send(owner, 'journal.put', client.batch(1.5, events('P1-E1')));
  assert.equal(`${reply.error.category}/${reply.error.code}`, 'validation/bad_envelope');
});

test('when storage fails nothing is acknowledged, and a retry succeeds', () => {
  let failing = true;
  const { send, owner, written } = hubWithOwner({ failWrites: () => failing });
  const body = client.batch(1, events('P1-E000001'));
  const failed = send(owner, 'journal.put', body);
  assert.equal(failed.error.category, 'retryable_unavailable');
  assert.equal(failed.error.code, 'storage_unavailable');

  failing = false;
  assert.deepEqual(send(owner, 'journal.put', body).result, { status: 'accepted', through: 1 });
  assert.equal(written.length, 1);
});

test('batches are accepted under the script lock, which is always released', () => {
  const { send, owner, google } = hubWithOwner();
  const lock = google.LockService.getScriptLock();
  const before = lock.waits;
  send(owner, 'journal.put', client.batch(1, events('P1-E000001')));
  assert.equal(lock.waits - before, 1);
  assert.equal(lock.held, false);
});
