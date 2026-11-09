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

Map<String, Object?> _event(String id, [String note = '']) => {
  'id': id,
  'type': 'note',
  'note': note,
};

List<Map<String, Object?>> _same(int _, List<Map<String, Object?>> events) =>
    events;

void main() {
  setUp(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = true);
  tearDown(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = false);

  late LocalDatabase database;
  late SqliteOutbox outbox;
  setUp(() {
    database = LocalDatabase(NativeDatabase.memory());
    outbox = SqliteOutbox(database);
  });
  tearDown(() => database.close());

  test('events seal in the order they were added, numbered from 1', () async {
    await outbox.add(_event('A'));
    await outbox.add(_event('B'));
    expect(await outbox.seal(10, _same), 1);
    final batch = await outbox.batch(1);
    expect(batch!.events.map((e) => e['id']), ['A', 'B']);
  });

  test('nothing waiting seals nothing', () async {
    expect(await outbox.seal(10, _same), isNull);
    expect(await outbox.firstUnsent(), isNull);
  });

  test('sealing takes at most the limit and leaves the rest', () async {
    for (final id in ['A', 'B', 'C']) {
      await outbox.add(_event(id));
    }
    expect(await outbox.seal(2, _same), 1);
    expect(await outbox.seal(2, _same), 2);
    expect(await outbox.seal(2, _same), isNull);
    expect((await outbox.batch(2))!.events.single['id'], 'C');
  });

  test('adding the same event twice records it once', () async {
    await outbox.add(_event('A', 'first'));
    await outbox.add(_event('A', 'second'));
    await outbox.seal(10, _same);
    final events = (await outbox.batch(1))!.events;
    expect(events.single['note'], 'first');
  });

  test('a sealed event is never sealed again', () async {
    await outbox.add(_event('A'));
    await outbox.seal(10, _same);
    await outbox.add(_event('A'));
    expect(await outbox.seal(10, _same), isNull);
  });

  test('a batch stays unsent until it is confirmed', () async {
    await outbox.add(_event('A'));
    await outbox.seal(10, _same);
    await outbox.add(_event('B'));
    await outbox.seal(10, _same);
    expect(await outbox.firstUnsent(), 1);
    await outbox.markUploaded(1);
    expect(await outbox.firstUnsent(), 2);
    await outbox.markUploaded(2);
    expect(await outbox.firstUnsent(), isNull);
    expect(await outbox.batch(1), isNotNull);
  });

  test('a failed build leaves every event waiting', () async {
    await outbox.add(_event('A'));
    await expectLater(
      outbox.seal(10, (_, _) => throw StateError('no')),
      throwsStateError,
    );
    expect(await outbox.firstUnsent(), isNull);
    expect(await outbox.seal(10, _same), 1);
  });

  test('a restart keeps waiting events and sealed batches', () async {
    final directory = await Directory.systemTemp.createTemp('dura-outbox-');
    final file = File('${directory.path}/shop.sqlite');
    var db = LocalDatabase(NativeDatabase(file));
    var store = SqliteOutbox(db);
    await store.add(_event('A'));
    await store.seal(10, _same);
    await store.add(_event('B'));
    await db.close();

    db = LocalDatabase(NativeDatabase(file));
    store = SqliteOutbox(db);
    expect(await store.firstUnsent(), 1);
    expect(await store.seal(10, _same), 2);
    await db.close();
    await directory.delete(recursive: true);
  });

  test(
    'a database from before the outbox gains it and keeps its data',
    () async {
      final old = LocalDatabase(
        NativeDatabase.memory(
          setup: (db) {
            db.execute(
              'CREATE TABLE app_preferences (key TEXT NOT NULL PRIMARY KEY, value TEXT NOT NULL)',
            );
            db.execute("INSERT INTO app_preferences VALUES ('theme', 'dark')");
            db.execute('PRAGMA user_version = 1');
          },
        ),
      );
      expect(await SqlitePreferences(old).read('theme'), 'dark');
      final store = SqliteOutbox(old);
      await store.add(_event('A'));
      expect(await store.seal(10, _same), 1);
      await old.close();
    },
  );
}
