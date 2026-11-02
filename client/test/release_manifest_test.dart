// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:test/test.dart';

import '../tool/release_manifest.dart';

void main() {
  Map<String, Object?> fixture() => {
    'version': '0.1.0-dev.1',
    'buildNumber': 1,
    'publish': false,
    'prerelease': true,
    'notes': 'release-notes/0.1.0-dev.1.md',
  };
  test('disabled release remains disabled with an exact app version', () {
    expect(
      validateReleaseManifest(fixture(), '0.1.0-dev.1+1').publish,
      isFalse,
    );
  });
  test('rejects stale app versions and traversal paths', () {
    expect(
      () => validateReleaseManifest(fixture(), '0.1.0+1'),
      throwsFormatException,
    );
    final unsafe = fixture()..['notes'] = '../private/key';
    expect(
      () => validateReleaseManifest(unsafe, '0.1.0-dev.1+1'),
      throwsFormatException,
    );
  });
  test('prerelease cannot be labelled stable', () {
    final invalid = fixture()..['prerelease'] = false;
    expect(
      () => validateReleaseManifest(invalid, '0.1.0-dev.1+1'),
      throwsFormatException,
    );
  });
}
