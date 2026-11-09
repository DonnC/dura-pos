// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:test/test.dart';

import '../tool/version_drift.dart';

List<String> _drift({
  String app = '1.2.0+7',
  String? hub = '1.2.0',
  String constraint = '^1.2.0',
}) => versionDrift(
  version: '1.2.0',
  build: 7,
  appVersion: app,
  versions: {'hub': hub},
  dependencies: {'app: dura_core': constraint},
);

void main() {
  test('matching versions pass', () => expect(_drift(), isEmpty));

  test('a stale app version or build is named', () {
    expect(_drift(app: '1.1.0+7').single, contains('1.1.0+7'));
    expect(_drift(app: '1.2.0+6').single, contains('1.2.0+6'));
  });

  test('a file on another version is named', () {
    expect(_drift(hub: '1.1.0').single, contains('hub is 1.1.0'));
  });

  test('a file with no version is named', () {
    expect(_drift(hub: null).single, contains('hub is null'));
  });

  test('a stale package constraint is named', () {
    expect(_drift(constraint: '^1.1.0').single, contains('app: dura_core'));
  });
}
