// Maintained by the Dura POS contributors.
import 'dart:convert';

const _allowedFields = {
  'code',
  'status',
  'operationId',
  'durationMs',
  'count',
  'errorType',
};
final _identifier = RegExp(r'^[a-zA-Z0-9_.-]{1,64}$');
final _eventName = RegExp(r'^[a-z][a-z0-9_.]{0,63}$');

/// Allowlisted metadata only. Unknown keys and free-form messages are omitted.
Map<String, Object?> safeRecord(
  String event,
  String? traceId,
  Map<String, Object?> fields,
  int maxBytes,
) {
  final record = <String, Object?>{
    'timestamp': DateTime.now().toUtc().toIso8601String(),
    'event': _eventName.hasMatch(event) ? event : 'diagnostic.invalid_event',
    if (traceId != null && _identifier.hasMatch(traceId)) 'traceId': traceId,
    'fields': {
      for (final entry in fields.entries)
        if (_allowedFields.contains(entry.key) && _safeValue(entry.value))
          entry.key: entry.value,
    },
  };
  if (utf8.encode('${jsonEncode(record)}\n').length > maxBytes) {
    record.remove('fields');
    record.remove('traceId');
    record['fieldsOmitted'] = true;
  }
  return record;
}

bool _safeValue(Object? value) =>
    value is int ||
    value is bool ||
    (value is String && _identifier.hasMatch(value));
