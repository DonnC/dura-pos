// Maintained by the Dura POS contributors.
import 'dart:io';
import 'dart:isolate';

import 'package:archive/archive_io.dart';
import 'package:path/path.dart' as path;

/// A top-level boundary avoids capturing the writer's unsendable Future queue.
Future<void> writeSupportArchiveInBackground(
  List<String> inputs,
  String destination,
) => Isolate.run(() => writeSupportArchive(inputs, destination));

/// Called in a worker isolate while the owner holds the diagnostic write queue.
Future<void> writeSupportArchive(
  List<String> inputs,
  String destination,
) async {
  final encoder = ZipFileEncoder()..create(destination);
  try {
    for (final input in inputs) {
      await encoder.addFile(File(input), path.basename(input));
    }
  } finally {
    await encoder.close();
  }
}
