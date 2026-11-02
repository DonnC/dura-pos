// Maintained by the Dura POS contributors.
import 'dart:io';

import 'workspace.dart';

Future<void> main() async {
  await runChecked('dart', ['test', 'test']);
  for (final directory in workspacePackages) {
    final tests = Directory('$directory/test');
    if (!tests.existsSync() ||
        !tests
            .listSync(recursive: true)
            .any((entry) => entry.path.endsWith('_test.dart'))) {
      throw StateError('Missing test target: $directory');
    }
    final flutter =
        (packageManifest(directory)['dependencies'] as Map?)?.containsKey(
          'flutter',
        ) ??
        false;
    await runChecked(
      flutter ? 'flutter' : 'dart',
      flutter ? ['test', '--no-pub'] : ['test'],
      directory: directory,
    );
  }
}
