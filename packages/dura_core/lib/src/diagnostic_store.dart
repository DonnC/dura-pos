// Maintained by the Dura POS contributors.
import 'diagnostics.dart';

/// Safe metadata for the preview shown before a support archive is shared.
final class DiagnosticFile {
  const DiagnosticFile({required this.name, required this.sizeBytes});
  final String name;
  final int sizeBytes;
}

/// Replaceable native/browser storage boundary for diagnostic settings.
abstract interface class DiagnosticStore implements Diagnostics {
  Future<List<DiagnosticFile>> listFiles();
  Future<String> createArchive();
}
