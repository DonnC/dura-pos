// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';

/// Keeps every usage event in memory, for checking what a screen records.
final class RecordingAnalytics implements Analytics {
  final events = <(String, Map<String, Object?>)>[];

  @override
  Future<void> track(
    String event, {
    Map<String, Object?> fields = const {},
  }) async => events.add((event, fields));

  /// The `screen` or `tab` field of each [event], in order.
  List<Object?> named(String event, String field) => [
    for (final (name, fields) in events)
      if (name == event) fields[field],
  ];
}
