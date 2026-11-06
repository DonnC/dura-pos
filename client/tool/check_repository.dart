// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:io';

import 'source_header.dart';
import 'workspace.dart';

const sourceLineLimit = 500;

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
      if (!hasSourceHeader(lines)) {
        errors.add('$name needs the project copyright/licence header');
      }
      final text = lines.join('\n');
      if (name.contains('/lib/')) {
        final declarations = RegExp(
          r'^(?:(?:abstract|final|base|sealed|interface)\s+)*class\s+\w+[^\n]*',
          multiLine: true,
        ).allMatches(text).map((match) => match.group(0)!).toList();
        final stateCompanions = declarations.where(
          (line) => RegExp(r'extends (?:Consumer)?State<').hasMatch(line),
        );
        if (declarations.length - stateCompanions.length > 1) {
          errors.add(
            '$name has multiple primary classes; split responsibilities',
          );
        }
      }
      if (name.contains('packages/dura_core/lib/') &&
          RegExp(
            r'''import ['"]package:(flutter|flutter_riverpod|drift|dura_data|dura_hub|dura_ui)/''',
          ).hasMatch(text)) {
        errors.add('$name violates the core boundary');
      }
      if (name.contains('packages/dura_ui/lib/') &&
          RegExp(r'''import ['"]package:(dura_data|dura_pos)/''')
              .hasMatch(text)) {
        errors.add('$name imports a concrete application/data implementation');
      }
      if (name.contains('/lib/') &&
          !name.endsWith('/theme/dura_palette.dart') &&
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
