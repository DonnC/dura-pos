// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'workspace.dart';

Future<void> main() async {
  await runChecked('dart', [
    'format',
    '--output=none',
    '--set-exit-if-changed',
    'apps/dura/lib',
    'apps/dura/test',
    'packages',
    'tool',
    'test',
  ]);
  await runChecked('dart', ['run', 'tool/check_repository.dart']);
  await runChecked('flutter', ['analyze', '--no-pub', '--fatal-infos']);
  await runChecked('dart', ['run', 'tool/test_workspace.dart']);
}
