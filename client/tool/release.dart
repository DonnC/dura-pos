// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:pub_semver/pub_semver.dart';

import 'release_manifest.dart';
import 'workspace.dart';

Future<void> main() async {
  final value = jsonDecode(
    File('../release.json').readAsStringSync(),
  ) as Map<String, Object?>;
  final app = packageManifest('apps/dura')['version'] as String;
  final manifest = validateReleaseManifest(value, app);
  if (!manifest.publish) {
    stdout.writeln('Release publication disabled in release.json.');
    return;
  }
  final env = Platform.environment;
  if (env['GITHUB_ACTIONS'] != 'true' ||
      env['GITHUB_REF'] != 'refs/heads/main' ||
      env['GITHUB_EVENT_NAME'] != 'push') {
    throw StateError(
      'Publication is limited to the verified main-push workflow.',
    );
  }
  final sha = env['GITHUB_SHA'];
  if (sha == null || !RegExp(r'^[a-f0-9]{40}$').hasMatch(sha)) {
    throw StateError('Missing exact release commit.');
  }
  final tag = 'v${manifest.version}';
  final history = await Process.run('gh', [
    'release',
    'list',
    '--limit',
    '100',
    '--json',
    'tagName',
  ]);
  if (history.exitCode != 0) {
    throw StateError(
      'Cannot verify remote release history; publication stopped.',
    );
  }
  final releases = jsonDecode(history.stdout as String) as List;
  final tagCheck = await Process.run('git', ['tag', '--list', tag]);
  if (tagCheck.exitCode != 0) {
    throw StateError('Cannot verify repository tags.');
  }
  if ((tagCheck.stdout as String).trim().isNotEmpty ||
      releases.any((release) => (release as Map)['tagName'] == tag)) {
    throw StateError(
      'Release already exists; refusing to replace published assets.',
    );
  }
  if (releases.isNotEmpty) {
    final previousTag = (releases.first as Map)['tagName'] as String;
    final old = await Process.run('git', ['show', '$previousTag:release.json']);
    if (old.exitCode != 0) {
      throw StateError('Cannot verify previous build number.');
    }
    final oldBuild =
        (jsonDecode(old.stdout as String) as Map)['buildNumber'] as int;
    final oldVersion =
        (jsonDecode(old.stdout as String) as Map)['version'] as String;
    if (Version.parse(manifest.version) <= Version.parse(oldVersion)) {
      throw StateError('Product version must increase.');
    }
    if (manifest.build <= oldBuild) {
      throw StateError('Build number must increase.');
    }
  }
  final notes = File('../${manifest.notes}');
  if (!notes.existsSync() ||
      !File('../CHANGELOG.md').readAsStringSync().contains(manifest.version)) {
    throw StateError('Missing reviewed release notes.');
  }
  const signingKeys = [
    'DURA_SIGNING_KEYSTORE_BASE64',
    'DURA_SIGNING_STORE_PASSWORD',
    'DURA_SIGNING_KEY_ALIAS',
    'DURA_SIGNING_KEY_PASSWORD',
  ];
  if (signingKeys.any((key) => env[key]?.isNotEmpty != true)) {
    throw StateError('Release signing is not configured.');
  }
  final signing = await Directory.systemTemp.createTemp('dura-signing-');
  final key = File('${signing.path}/release.jks');
  try {
    await key.writeAsBytes(base64Decode(env[signingKeys.first]!));
    await runChecked(
      'flutter',
      [
        'build',
        'apk',
        '--release',
        '--build-name=${manifest.version}',
        '--build-number=${manifest.build}',
      ],
      directory: 'apps/dura',
      environment: {...env, 'DURA_SIGNING_KEYSTORE_PATH': key.path},
    );
    final output = Directory('artifacts/release')..createSync(recursive: true);
    final artifact = await File(
      'apps/dura/build/app/outputs/flutter-apk/app-release.apk',
    ).copy('${output.path}/dura-pos-${manifest.version}.apk');
    final digest = await sha256.bind(artifact.openRead()).first;
    final checksums = File('${output.path}/SHA256SUMS');
    await checksums.writeAsString(
      '$digest  ${artifact.uri.pathSegments.last}\n',
    );
    await runChecked('gh', [
      'release',
      'create',
      tag,
      artifact.path,
      checksums.path,
      '--target',
      sha,
      '--title',
      'Dura POS ${manifest.version}',
      '--notes-file',
      notes.path,
      if (manifest.prerelease) '--prerelease',
    ]);
  } finally {
    if (await key.exists()) await key.delete();
    await signing.delete();
  }
}
