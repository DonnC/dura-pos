// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';

import 'source_header.dart';
import 'ui_tracker.dart';
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
  final appSource = File('apps/dura/lib/app/app_version.dart')
      .readAsStringSync();
  final versions = <String, String?>{
    'backend/hub/package.json': hub['version'] as String?,
    'backend/hub/src/protocol.js': RegExp("HUB_VERSION_ = '([^']+)'")
        .firstMatch(hubSource)
        ?.group(1),
    'apps/dura/lib/app/app_version.dart': RegExp("version = '([^']+)'")
        .firstMatch(appSource)
        ?.group(1),
  };
  final appBuild = RegExp(r'build = (\d+);').firstMatch(appSource)?.group(1);
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
  final build = release['buildNumber']! as int;
  return [
    ...versionDrift(
      version: version,
      build: build,
      appVersion: appVersion,
      versions: versions,
      dependencies: dependencies,
    ),
    if (appBuild != '$build')
      'apps/dura/lib/app/app_version.dart build is $appBuild, '
          'but release.json says $build',
  ];
}

/// Checks `handbook/design/ui-tracker.md` against the app's screens and tests.
List<String> repositoryTrackerProblems() {
  Iterable<File> dartFiles(String root) => Directory(root).existsSync()
      ? Directory(root)
            .listSync(recursive: true)
            .whereType<File>()
            .where((file) => file.path.endsWith('.dart'))
      : const [];
  final testRoots = [
    'apps/dura/test',
    'test',
    for (final package in workspacePackages.where(
      (p) => p.startsWith('packages/'),
    ))
      '$package/test',
  ];
  return trackerProblems(
    tracker: File('../handbook/design/ui-tracker.md')
        .readAsStringSync()
        .replaceAll('\r\n', '\n'),
    registered: registeredIds(
      dartFiles('apps/dura/lib').map((file) => file.readAsStringSync()),
    ),
    tests: {
      for (final root in testRoots)
        for (final file in dartFiles(root)) file.path: file.readAsStringSync(),
    },
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
          RegExp(r'Color\(0x|\bColors\.').hasMatch(text)) {
        errors.add('$name contains colours outside the theme');
      }
    }
  }
  errors.addAll(straySourceHeaders());
  errors.addAll(repositoryVersionDrift());
  errors.addAll(repositoryTrackerProblems());
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
