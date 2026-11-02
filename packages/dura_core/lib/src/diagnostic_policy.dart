// Maintained by the Dura POS contributors.

/// Bounded storage policy; smaller limits support deterministic rotation tests.
final class DiagnosticPolicy {
  const DiagnosticPolicy({
    this.maxFiles = defaultMaxFiles,
    this.maxFileBytes = defaultMaxFileBytes,
  }) : assert(maxFiles > 0),
       assert(maxFileBytes >= minimumFileBytes);

  static const defaultMaxFiles = 10;
  static const defaultMaxFileBytes = 5 * 1024 * 1024;
  static const minimumFileBytes = 256;
  static const logPrefix = 'dura-';
  static const logExtension = '.jsonl';
  static const exportSuffix = '-exports';
  static const maxExportFiles = 2;
  static const logDirectory = 'diagnostics';

  final int maxFiles;
  final int maxFileBytes;
}
