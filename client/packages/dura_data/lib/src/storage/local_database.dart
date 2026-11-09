// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';

import 'app_preferences.dart';
import 'outbox_events.dart';
import 'sealed_batches.dart';
part 'local_database.g.dart';

@DriftDatabase(tables: [AppPreferences, OutboxEvents, SealedBatches])
class LocalDatabase extends _$LocalDatabase {
  LocalDatabase(super.executor);

  LocalDatabase.open(File file) : this(NativeDatabase.createInBackground(file));

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onUpgrade: (migrator, from, to) async {
      if (from < 2) {
        await migrator.createTable(outboxEvents);
        await migrator.createTable(sealedBatches);
      }
    },
  );
}
