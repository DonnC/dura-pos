// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';

import 'package:dura_core/dura_core.dart';

/// Fields a diagnostic record may carry, and the lists a crash adds.
const _allowedFields = {
  'code',
  'status',
  'operationId',
  'durationMs',
  'count',
  'errorType',
  'fatal',
  'screen',
  'appVersion',
  'buildNumber',
  'schemaVersion',
  'os',
};
const _listFields = {'trail', 'frames'};
const maxListItems = 20;
final _identifier = RegExp(r'^[a-zA-Z0-9_.-]{1,64}$');
final _eventName = RegExp(r'^[a-z][a-z0-9_.]{0,63}$');

/// Allowlisted metadata only. Unknown keys and free-form messages are omitted.
///
/// A crash may add `frames` (from `safeFrames`) and `trail` (from
/// `Breadcrumbs`); each item is checked again here, so a caller's mistake
/// can't write a message or a path.
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
      for (final MapEntry(:key, :value) in fields.entries)
        if (_allowedFields.contains(key) && _safeValue(value))
          key: value
        else if (_listFields.contains(key) && value is List)
          key: _safeList(key, value),
    },
  };
  return fitRecord(record, maxBytes);
}

/// Drops the details of a record too large for one file, keeping its event.
Map<String, Object?> fitRecord(Map<String, Object?> record, int maxBytes) {
  if (utf8.encode('${jsonEncode(record)}\n').length > maxBytes) {
    record.remove('fields');
    record.remove('traceId');
    record['fieldsOmitted'] = true;
  }
  return record;
}

List<String> _safeList(String key, List<Object?> items) {
  final pattern = key == 'frames' ? safeFramePattern : _identifier;
  return [
    for (final item in items.take(maxListItems))
      if (item is String && pattern.hasMatch(item)) item,
  ];
}

bool _safeValue(Object? value) =>
    value is int ||
    value is bool ||
    (value is String && _identifier.hasMatch(value));
