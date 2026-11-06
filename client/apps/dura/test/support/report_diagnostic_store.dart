// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';

/// Deterministic report fixture with observable archive preparation.
final class ReportDiagnosticStore implements DiagnosticStore {
  static const archivePath = '/example/report-diagnostics.zip';
  bool failArchive = false;
  int archives = 0;

  @override
  Future<void> record(
    String event, {
    String? traceId,
    Map<String, Object?> fields = const {},
  }) async {}

  @override
  Future<List<DiagnosticFile>> listFiles() async => [];

  @override
  Future<String> createArchive() async {
    if (failArchive) throw StateError('archive unavailable');
    archives++;
    return archivePath;
  }
}
