// Maintained by the Dura POS contributors.

/// Accepts operational metadata, never messages, payloads or credentials.
abstract interface class Diagnostics {
  Future<void> record(
    String event, {
    String? traceId,
    Map<String, Object?> fields = const {},
  });
}
