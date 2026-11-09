// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';

import 'source_header.dart';
import 'version_drift.dart';
import 'workspace.dart';

const sourceLineLimit = 500;
const headerSearchLines = 14;

/// Tracked files that aren't source code and still carry the source header.
Iterable<String> straySourceHeaders() sync* {
  final tracked = Process.runSync('git', ['ls-files'], workingDirectory: '..');
  final names = (tracked.stdout as String).split('\n');
  for (final name in names.where(isHeaderFree)) {
    final file = File('../$name');
    if (!file.existsSync()) continue;
    final head = file.readAsLinesSync().take(headerSearchLines);
    if (head.any((line) => line.contains('SPDX-License-Identifier'))) {
      yield '$name is not source code and must not carry the licence header';
    }
  }
}

/// Compares each file that repeats the product version with `release.json`.
List<String> repositoryVersionDrift() {
  final release = jsonDecode(
    File('../release.json').readAsStringSync(),
  ) as Map<String, Object?>;
  final version = release['version']! as String;
  final hub = jsonDecode(
    File('../backend/hub/package.json').readAsStringSync(),
  ) as Map<String, Object?>;
  final hubSource = File('../backend/hub/src/protocol.js').readAsStringSync();
  final versions = <String, String?>{
    'backend/hub/package.json': hub['version'] as String?,
    'backend/hub/src/protocol.js': RegExp("HUB_VERSION_ = '([^']+)'")
        .firstMatch(hubSource)
        ?.group(1),
  };
  final dependencies = <String, String>{};
  var appVersion = '';
  for (final directory in workspacePackages) {
    final manifest = packageManifest(directory);
    final declared = manifest['version'] as String?;
    if (directory.startsWith('packages/')) {
      versions[directory] = declared;
    } else if (declared != null) {
      appVersion = declared;
    }
    final needs = manifest['dependencies'] as Map? ?? const {};
    for (final MapEntry(:key, :value) in needs.entries) {
      if ('$key'.startsWith('dura_') && value is String) {
        dependencies['$directory: $key'] = value;
      }
    }
  }
  return versionDrift(
    version: version,
    build: release['buildNumber']! as int,
    appVersion: appVersion,
    versions: versions,
    dependencies: dependencies,
  );
}

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
  errors.addAll(straySourceHeaders());
  errors.addAll(repositoryVersionDrift());
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
