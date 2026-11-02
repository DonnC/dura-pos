// Maintained by the Dura POS contributors.
import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';

part 'local_database.g.dart';

/// Local, non-secret preferences. Business tables arrive in later slices.
class AppPreferences extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}

@DriftDatabase(tables: [AppPreferences])
class LocalDatabase extends _$LocalDatabase {
  LocalDatabase(super.executor);

  LocalDatabase.open(File file) : this(NativeDatabase.createInBackground(file));

  @override
  int get schemaVersion => 1;
}
