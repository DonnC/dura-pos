// Maintained by the Dura POS contributors.
import 'package:dura_core/dura_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final diagnosticStoreProvider = Provider<DiagnosticStore>(
  (ref) =>
      throw StateError('Diagnostic storage must be supplied at bootstrap.'),
);

final diagnosticFilesProvider = FutureProvider<List<DiagnosticFile>>(
  (ref) => ref.watch(diagnosticStoreProvider).listFiles(),
);

/// Sharing is a platform effect injected outside the feature's widget tree.
typedef ShareArchive = Future<void> Function(String path);

final shareArchiveProvider = Provider<ShareArchive>(
  (ref) => throw StateError('Archive sharing must be supplied at bootstrap.'),
);
