// Maintained by the Dura POS contributors.
import 'package:dura_core/dura_core.dart';

import 'local_database.dart';

/// SQLite adapter; credentials must not be stored as plain preferences.
final class SqlitePreferences implements PreferenceStore {
  SqlitePreferences(this.database);
  final LocalDatabase database;

  @override
  Future<String?> read(String key) async {
    final row = await (database.select(
      database.appPreferences,
    )..where((row) => row.key.equals(key))).getSingleOrNull();
    return row?.value;
  }

  @override
  Future<void> write(String key, String value) async {
    await database
        .into(database.appPreferences)
        .insertOnConflictUpdate(
          AppPreferencesCompanion.insert(key: key, value: value),
        );
  }
}
