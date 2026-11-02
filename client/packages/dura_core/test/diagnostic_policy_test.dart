// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:test/test.dart';

void main() {
  test('default diagnostic storage is bounded to fifty MiB', () {
    const policy = DiagnosticPolicy();
    expect(policy.maxFiles, 10);
    expect(policy.maxFileBytes, 5 * 1024 * 1024);
    expect(policy.maxFiles * policy.maxFileBytes, 50 * 1024 * 1024);
  });
}
