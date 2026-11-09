// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:dura_core/dura_core.dart';

import 'local_database.dart';

/// The outbox in the phone's own database, so it survives a restart.
final class SqliteOutbox implements Outbox {
  SqliteOutbox(this.database);

  final LocalDatabase database;

  @override
  Future<void> add(Map<String, Object?> event) async {
    await database
        .into(database.outboxEvents)
        .insert(
          OutboxEventsCompanion.insert(
            eventId: event['id']! as String,
            payload: jsonEncode(event),
          ),
          mode: InsertMode.insertOrIgnore,
        );
  }

  @override
  Future<int?> seal(int maxEvents, BatchBuilder build) => database.transaction(
    () async {
      final waiting =
          await (database.select(database.outboxEvents)
                ..where((row) => row.batchNumber.isNull())
                ..orderBy([(row) => OrderingTerm.asc(row.sequence)])
                ..limit(maxEvents))
              .get();
      if (waiting.isEmpty) return null;
      final number = await _lastNumber() + 1;
      final events = [
        for (final row in waiting)
          jsonDecode(row.payload) as Map<String, Object?>,
      ];
      await database
          .into(database.sealedBatches)
          .insert(
            SealedBatchesCompanion.insert(
              number: Value(number),
              events: jsonEncode(build(number, events)),
            ),
          );
      await (database.update(database.outboxEvents)
            ..where((row) => row.sequence.isIn(waiting.map((r) => r.sequence))))
          .write(OutboxEventsCompanion(batchNumber: Value(number)));
      return number;
    },
  );

  Future<int> _lastNumber() async {
    final highest = database.sealedBatches.number.max();
    final query = database.selectOnly(database.sealedBatches)
      ..addColumns([highest]);
    final row = await query.getSingle();
    return row.read(highest) ?? 0;
  }

  @override
  Future<JournalBatch?> batch(int number) async {
    final row = await (database.select(
      database.sealedBatches,
    )..where((row) => row.number.equals(number))).getSingleOrNull();
    if (row == null) return null;
    return JournalBatch(
      number: number,
      events: (jsonDecode(row.events) as List<Object?>)
          .cast<Map<String, Object?>>(),
    );
  }

  @override
  Future<int?> firstUnsent() async {
    final row =
        await (database.select(database.sealedBatches)
              ..where((row) => row.uploaded.equals(false))
              ..orderBy([(row) => OrderingTerm.asc(row.number)])
              ..limit(1))
            .getSingleOrNull();
    return row?.number;
  }

  @override
  Future<void> markUploaded(int number) async {
    await (database.update(database.sealedBatches)
          ..where((row) => row.number.equals(number)))
        .write(const SealedBatchesCompanion(uploaded: Value(true)));
  }
}
