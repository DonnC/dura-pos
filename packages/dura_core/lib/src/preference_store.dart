// Maintained by the Dura POS contributors.

/// Non-secret local preferences. Credentials require a separate secure store.
abstract interface class PreferenceStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}
