// Maintained by the Dura POS contributors.
import 'dart:convert';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:path/path.dart' as path;

import 'safe_record.dart';
import 'support_archive.dart';

/// One bootstrap-owned writer serialises writes and archive snapshots.
///
/// Future background isolates must use this owner through a broker rather than
/// opening a second writer over the same files. No raw exception text is stored.
final class RotatingDiagnostics implements DiagnosticStore {
  RotatingDiagnostics(this.directory, {this.policy = const DiagnosticPolicy()});

  final Directory directory;
  final DiagnosticPolicy policy;
  Future<void> _tail = Future.value();
  int _exportSequence = 0;

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
    await directory.create(recursive: true);
    final bytes = utf8.encode(
      '${jsonEncode(safeRecord(event, traceId, fields, policy.maxFileBytes))}\n',
    );
    final currentFiles = await files();
    var file = currentFiles.isEmpty ? null : currentFiles.last;
    if (file == null ||
        await file.length() + bytes.length > policy.maxFileBytes) {
      final index = file == null
          ? 1
          : int.parse(
                  path.basenameWithoutExtension(file.path).split('-').last,
                ) +
                1;
      file = File(
        path.join(
          directory.path,
          '${DiagnosticPolicy.logPrefix}${index.toString().padLeft(8, '0')}'
          '${DiagnosticPolicy.logExtension}',
        ),
      );
      while (currentFiles.length >= policy.maxFiles) {
        await currentFiles.removeAt(0).delete();
      }
    }
    await file.writeAsBytes(bytes, mode: FileMode.append, flush: true);
  });

  Future<List<File>> files() async {
    if (!await directory.exists()) return [];
    final result = await directory
        .list(followLinks: false)
        .where(
          (entry) =>
              entry is File &&
              RegExp(r'^dura-\d{8,}\.jsonl$')
                  .hasMatch(path.basename(entry.path)),
        )
        .cast<File>()
        .toList();
    result.sort((a, b) => a.path.compareTo(b.path));
    return result;
  }

  @override
  Future<List<DiagnosticFile>> listFiles() => _serial(
    () async => [
      for (final file in await files())
        DiagnosticFile(
          name: path.basename(file.path),
          sizeBytes: await file.length(),
        ),
    ],
  );

  @override
  Future<String> createArchive() async => (await exportZip()).path;

  Future<File> exportZip() => _serial(() async {
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
      await writeSupportArchiveInBackground(inputs, destination);
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
    while (exports.length > DiagnosticPolicy.maxExportFiles) {
      await exports.removeAt(0).delete();
    }
    return File(destination);
  });
}
