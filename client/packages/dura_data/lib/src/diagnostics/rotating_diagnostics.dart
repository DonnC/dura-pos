// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:path/path.dart' as path;
import 'package:rotation_log/rotation_log.dart';

import 'safe_record.dart';
import 'support_archive.dart';

/// One bootstrap-owned writer serialises writes and archive snapshots.
///
/// Future background isolates must use this owner through a broker rather than
/// opening a second writer over the same files. No raw exception text is stored.
final class RotatingDiagnostics implements DiagnosticStore {
  RotatingDiagnostics(
    this.directory, {
    this.policy = const DiagnosticPolicy(),
  }) {
    policy.validate();
    _logger = RotationLogger(
      RotationLogTerm.size(policy.maxFileBytes),
      options: RotationLogOptions(
        directoryName: DiagnosticPolicy.logDirectory,
        fileNamePrefix: DiagnosticPolicy.logPrefix,
        // The package counts archives separately from the active file.
        maxArchivedFiles: policy.maxFiles - 1,
      ),
      directoryProvider: () async => directory,
    );
  }

  final Directory directory;
  final DiagnosticPolicy policy;
  Future<void> _tail = Future.value();
  int _exportSequence = 0;
  late final RotationLogger _logger;
  bool _closed = false;

  Future<T> _serial<T>(Future<T> Function() action) {
    final result = _tail.then((_) => action());
    // A failed write reaches its caller, but must not poison later operations.
    _tail = result.then<void>((_) {}, onError: (Object _, StackTrace _) {});
    return result;
  }

  @override
  Future<void> record(
    String event, {
    String? traceId,
    Map<String, Object?> fields = const {},
  }) => _serial(() async {
    await _initialize();
    // An older run may have retained files above a newly lowered byte cap.
    for (final file in await files()) {
      if (await file.length() > policy.maxFileBytes) await file.delete();
    }
    final line = jsonEncode(
      safeRecord(event, traceId, fields, policy.maxFileBytes),
    );
    _logger.append(line);
    await _logger.flush();
  });

  Future<void> _initialize() async {
    if (_closed) throw StateError('Diagnostic storage is closed.');
    if (!_logger.isInitialized) await _logger.init();
  }

  /// Package order is active/newest first; consumers receive oldest to active.
  Future<List<File>> files() async =>
      (await _logger.listLogFiles()).reversed.map(File.new).toList();

  /// Called by the bootstrap owner after its provider scope is disposed.
  Future<void> close() => _serial(() async {
    if (_closed) return;
    _closed = true;
    await _logger.close();
  });

  @override
  Future<List<DiagnosticFile>> listFiles() => _serial(() async {
    await _initialize();
    return [
      for (final file in await files())
        DiagnosticFile(
          name: path.basename(file.path),
          sizeBytes: await file.length(),
        ),
    ];
  });

  @override
  Future<String> createArchive() async => (await exportZip()).path;

  Future<File> exportZip() => _serial(() async {
    await _initialize();
    await _logger.flush();
    final inputs = [for (final file in await files()) file.path];
    final exportFolder = Directory(
      '${directory.path}${DiagnosticPolicy.exportSuffix}',
    );
    await exportFolder.create(recursive: true);
    final name =
        'support-${DateTime.now().microsecondsSinceEpoch}'
        '-${_exportSequence++}.zip';
    final destination = path.join(exportFolder.path, name);
    try {
      // Stream off the UI isolate while the owner's write queue is held.
      await writeSupportArchiveInBackground(
        directory.path,
        inputs,
        destination,
        policy.maxFileBytes,
      );
    } on Object {
      final partial = File(destination);
      if (await partial.exists()) await partial.delete();
      rethrow;
    }
    final exports = await exportFolder
        .list(followLinks: false)
        .where(
          (entry) =>
              entry is File &&
              path.basename(entry.path).startsWith('support-') &&
              entry.path.endsWith('.zip'),
        )
        .cast<File>()
        .toList();
    exports.sort((a, b) => a.path.compareTo(b.path));
    while (exports.length > policy.maxExportFiles) {
      await exports.removeAt(0).delete();
    }
    return File(destination);
  });
}
