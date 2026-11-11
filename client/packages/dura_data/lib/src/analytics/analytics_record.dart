// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';

import '../diagnostics/safe_record.dart';

final _identifier = RegExp(r'^[a-zA-Z0-9_.-]{1,64}$');

/// One line of the usage log: a known event and known fields only.
///
/// An event that isn't in `AnalyticsEvents` is written as `analytics.unknown`,
/// and a field outside `AnalyticsFields` is dropped, so nothing typed by a
/// person can reach the file.
Map<String, Object?> analyticsRecord(
  String event,
  String? traceId,
  Map<String, Object?> fields,
  int maxBytes,
) => fitRecord({
  'timestamp': DateTime.now().toUtc().toIso8601String(),
  'event': AnalyticsEvents.all.contains(event) ? event : 'analytics.unknown',
  'fields': {
    for (final MapEntry(:key, :value) in fields.entries)
      if (AnalyticsFields.all.contains(key) &&
          (value is int ||
              value is bool ||
              (value is String && _identifier.hasMatch(value))))
        key: value,
  },
}, maxBytes);
