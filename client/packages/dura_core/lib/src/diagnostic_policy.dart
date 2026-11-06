// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Bounded storage policy; smaller limits support deterministic rotation tests.
final class DiagnosticPolicy {
  const DiagnosticPolicy({
    this.maxFiles = defaultMaxFiles,
    this.maxFileBytes = defaultMaxFileBytes,
    this.maxExportFiles = defaultMaxExportFiles,
  }) : assert(maxFiles > 0),
       assert(maxFileBytes >= minimumFileBytes),
       assert(maxExportFiles > 0);

  /// Override at build time with --dart-define, or inject directly at bootstrap.
  const DiagnosticPolicy.fromEnvironment()
    : this(
        maxFiles: const int.fromEnvironment(
          'DURA_LOG_MAX_FILES',
          defaultValue: defaultMaxFiles,
        ),
        maxFileBytes: const int.fromEnvironment(
          'DURA_LOG_MAX_FILE_BYTES',
          defaultValue: defaultMaxFileBytes,
        ),
        maxExportFiles: const int.fromEnvironment(
          'DURA_LOG_MAX_EXPORT_FILES',
          defaultValue: defaultMaxExportFiles,
        ),
      );

  static const defaultMaxFiles = 10;
  static const defaultMaxFileBytes = 5 * 1024 * 1024;
  static const minimumFileBytes = 256;
  static const logPrefix = 'dura';
  static const logExtension = '.log';
  static const exportSuffix = '-exports';
  static const defaultMaxExportFiles = 2;
  static const logDirectory = 'diagnostics';

  final int maxFiles;
  final int maxFileBytes;
  final int maxExportFiles;

  /// Runtime validation also protects release builds where asserts are removed.
  void validate() {
    if (maxFiles < 1 || maxFileBytes < minimumFileBytes || maxExportFiles < 1) {
      throw ArgumentError(
        'Diagnostic limits must be positive and fit a record.',
      );
    }
  }
}
