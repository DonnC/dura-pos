// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:io';
import 'dart:math';

import 'package:dura_core/dura_core.dart';

import '../diagnostics/rotating_diagnostics.dart';
import 'analytics_record.dart';

/// The usage log: rotated files on this phone, apart from diagnostics and the
/// journal. A later release uploads them to the owner's own Drive through the
/// Shop Hub, only when the owner turns that on.
///
/// While [enabled] is false nothing is written.
final class RotatingAnalytics implements Analytics {
  RotatingAnalytics(
    Directory directory, {
    this.enabled = true,
    DiagnosticPolicy policy = defaultPolicy,
    Random? random,
  }) : session = _sessionId(random ?? Random.secure()),
       _writer = RotatingDiagnostics(
         directory,
         policy: policy,
         fileNamePrefix: filePrefix,
         shape: analyticsRecord,
       );

  /// Smaller than diagnostics: five files of 1 MiB.
  static const defaultPolicy = DiagnosticPolicy(
    maxFiles: 5,
    maxFileBytes: 1024 * 1024,
    maxExportFiles: 1,
  );
  static const directoryName = 'usage';
  static const filePrefix = 'usage';

  final RotatingDiagnostics _writer;

  /// A random ID for this launch, so one person's steps can be followed
  /// without knowing who they are.
  final String session;
  bool enabled;

  /// The person serving, by staff ID, once people exist (phase 4).
  String? person;

  static String _sessionId(Random random) =>
      [for (var i = 0; i < 6; i++) random.nextInt(256).toRadixString(16)]
          .map((part) => part.padLeft(2, '0'))
          .join();

  @override
  Future<void> track(
    String event, {
    Map<String, Object?> fields = const {},
  }) async {
    if (!enabled) return;
    try {
      await _writer.record(
        event,
        fields: {
          ...fields,
          AnalyticsFields.session: session,
          AnalyticsFields.person: ?person,
        },
      );
    } on Object {
      // Usage records are expendable; a full disk must never reach a screen.
    }
  }

  Future<List<DiagnosticFile>> listFiles() => _writer.listFiles();

  Future<void> close() => _writer.close();
}
