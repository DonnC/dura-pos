// Maintained by the Dura POS contributors.
import 'dart:io';

import 'workspace.dart';

const sourceLineLimit = 500;
const contributorHeader = '// Maintained by the Dura POS contributors.';

void main() {
  final errors = <String>[];
  for (final root in [
    'apps/dura/lib',
    'apps/dura/test',
    'tool',
    'test',
    for (final package in workspacePackages.where(
      (p) => p.startsWith('packages/'),
    )) ...['$package/lib', '$package/test'],
  ]) {
    for (final file in Directory(
      root,
    ).listSync(recursive: true).whereType<File>()) {
      final name = file.path.replaceAll('\\', '/');
      if (!name.endsWith('.dart') ||
          name.endsWith('.g.dart') ||
          name.contains('/.dart_tool/') ||
          name.contains('/build/')) {
        continue;
      }
      final lines = file.readAsLinesSync();
      if (lines.length > sourceLineLimit) errors.add('$name exceeds 500 lines');
      if (lines.isEmpty || lines.first != contributorHeader) {
        errors.add('$name needs the contributor header');
      }
      final text = lines.join('\n');
      if (name.contains('packages/dura_core/lib/') &&
          RegExp(
            r'''import ['"]package:(flutter|flutter_riverpod|drift|dura_data|dura_ui)/''',
          ).hasMatch(text)) {
        errors.add('$name violates the core boundary');
      }
      if (name.contains('packages/dura_ui/lib/') &&
          RegExp(r'''import ['"]package:(dura_data|dura_pos)/''')
              .hasMatch(text)) {
        errors.add('$name imports a concrete application/data implementation');
      }
      if (name.contains('/lib/') &&
          !name.endsWith('/tokens.dart') &&
          RegExp(r'Color\(0x|Colors\.').hasMatch(text)) {
        errors.add('$name contains colours outside the theme');
      }
    }
  }
  for (final directory in workspacePackages) {
    if (packageManifest(directory)['resolution'] != 'workspace') {
      errors.add('$directory is not in workspace resolution');
    }
    if (File('$directory/pubspec.lock').existsSync()) {
      errors.add('$directory has a stray package lockfile');
    }
  }
  if (errors.isNotEmpty) {
    stderr.writeln(errors.join('\n'));
    exitCode = 1;
  } else {
    stdout.writeln('Repository policy checks passed.');
  }
}
