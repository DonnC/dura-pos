// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:io';

import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:dura_data/dura_data.dart';
import 'package:test/test.dart';

void main() {
  setUp(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = true);
  tearDown(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = false);
  test(
    'preferences survive closing and reopening the local database',
    () async {
      final directory = await Directory.systemTemp.createTemp(
        'dura-store-test-',
      );
      final file = File('${directory.path}/business.sqlite');
      final database = LocalDatabase(NativeDatabase(file));
      final store = SqlitePreferences(database);
      expect(await store.read('theme'), isNull);
      await store.write('theme', 'dark');
      await store.write('theme', 'light');
      await database.close();
      final reopened = LocalDatabase(NativeDatabase(file));
      expect(await SqlitePreferences(reopened).read('theme'), 'light');
      await reopened.close();
      await directory.delete(recursive: true);
    },
  );

  test('separate stores do not leak preferences across businesses', () async {
    final first = LocalDatabase(NativeDatabase.memory());
    final second = LocalDatabase(NativeDatabase.memory());
    await SqlitePreferences(first).write('theme', 'dark');
    expect(await SqlitePreferences(second).read('theme'), isNull);
    await first.close();
    await second.close();
  });
}
