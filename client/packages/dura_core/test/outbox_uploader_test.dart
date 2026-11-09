// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:test/test.dart';

final class _MemoryOutbox implements Outbox {
  final waiting = <Map<String, Object?>>[];
  final batches = <int, JournalBatch>{};
  final uploaded = <int>{};

  @override
  Future<void> add(Map<String, Object?> event) async => waiting.add(event);

  @override
  Future<JournalBatch?> batch(int number) async => batches[number];

  @override
  Future<int?> firstUnsent() async {
    final open = batches.keys.where((n) => !uploaded.contains(n)).toList()
      ..sort();
    return open.isEmpty ? null : open.first;
  }

  @override
  Future<void> markUploaded(int number) async => uploaded.add(number);

  @override
  Future<int?> seal(int maxEvents, BatchBuilder build) async {
    if (waiting.isEmpty) return null;
    final number = batches.length + 1;
    final taken = waiting.take(maxEvents).toList();
    waiting.removeRange(0, taken.length);
    batches[number] = JournalBatch(
      number: number,
      events: build(number, taken),
    );
    return number;
  }
}

/// Answers from a script, one reply per call.
final class _Backend implements ShopBackend {
  _Backend(this.replies);

  final List<Object> replies;
  final sent = <int>[];

  @override
  Future<JournalAck> putJournal(JournalBatch batch) async {
    sent.add(batch.number);
    final reply = replies.removeAt(0);
    if (reply is BackendFailure) throw reply;
    return reply as JournalAck;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Map<String, Object?> _event(int n) => {
  'id': 'P1-E$n',
  'type': 'note',
  'at': '2026-11-09T10:00:00',
};

OutboxUploader _uploader(
  _MemoryOutbox outbox,
  _Backend backend, {
  int max = 1,
}) => OutboxUploader(
  outbox: outbox,
  backend: backend,
  device: 'P1',
  maxEvents: max,
);

const _busy = BackendFailure(BackendFailureKind.retryableUnavailable, 'busy');

void main() {
  test('everything waiting is sealed and sent in order', () async {
    final outbox = _MemoryOutbox();
    await outbox.add(_event(1));
    await outbox.add(_event(2));
    final backend = _Backend([
      const JournalAck.accepted(1),
      const JournalAck.accepted(2),
    ]);
    final result = await _uploader(outbox, backend).run();
    expect(result.state, UploadState.allSent);
    expect(result.uploaded, 2);
    expect(backend.sent, [1, 2]);
  });

  test('nothing waiting sends nothing', () async {
    final backend = _Backend([]);
    final result = await _uploader(_MemoryOutbox(), backend).run();
    expect(result.state, UploadState.allSent);
    expect(backend.sent, isEmpty);
  });

  test('a lost reply sends the same batch next time, unchanged', () async {
    final outbox = _MemoryOutbox();
    await outbox.add(_event(1));
    final first = await _uploader(outbox, _Backend([_busy])).run();
    expect(first.state, UploadState.tryLater);
    expect(first.code, 'busy');
    expect(outbox.uploaded, isEmpty);
    final sealed = outbox.batches[1]!.events;

    await outbox.add(_event(2));
    final backend = _Backend([
      const JournalAck.accepted(1),
      const JournalAck.accepted(2),
    ]);
    await _uploader(outbox, backend).run();
    expect(backend.sent, [1, 2]);
    expect(outbox.batches[1]!.events, sealed);
  });

  test('a gap sends the batch the backend asks for, then carries on', () async {
    final outbox = _MemoryOutbox();
    for (final n in [1, 2, 3]) {
      await outbox.add(_event(n));
      await outbox.seal(1, (_, events) => events);
    }
    await outbox.markUploaded(1);
    await outbox.markUploaded(2);
    final backend = _Backend([
      const JournalAck.gap(2),
      const JournalAck.accepted(2),
      const JournalAck.accepted(3),
    ]);
    final result = await _uploader(outbox, backend).run();
    expect(result.state, UploadState.allSent);
    expect(backend.sent, [3, 2, 3]);
  });

  test('a gap the phone cannot fill asks for attention', () async {
    final outbox = _MemoryOutbox();
    await outbox.add(_event(1));
    final result = await _uploader(
      outbox,
      _Backend([const JournalAck.gap(9)]),
    ).run();
    expect(result.state, UploadState.needsAttention);
    expect(result.code, 'batch_not_on_phone');
  });

  test('the same gap twice stops rather than looping', () async {
    final outbox = _MemoryOutbox();
    await outbox.add(_event(1));
    final result = await _uploader(
      outbox,
      _Backend([const JournalAck.gap(1), const JournalAck.gap(1)]),
    ).run();
    expect(result.state, UploadState.needsAttention);
    expect(result.code, 'batch_gap');
  });

  test('a refused batch stays on the phone and asks for attention', () async {
    final outbox = _MemoryOutbox();
    await outbox.add(_event(1));
    final result = await _uploader(
      outbox,
      _Backend([
        const BackendFailure(
          BackendFailureKind.integrityConflict,
          'batch_reused',
        ),
      ]),
    ).run();
    expect(result.state, UploadState.needsAttention);
    expect(result.code, 'batch_reused');
    expect(await outbox.firstUnsent(), 1);
  });
}
