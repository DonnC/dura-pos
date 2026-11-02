// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'diagnostic_file.dart';
import 'diagnostics.dart';

/// Replaceable native/browser storage boundary for diagnostic settings.
abstract interface class DiagnosticStore implements Diagnostics {
  Future<List<DiagnosticFile>> listFiles();
  Future<String> createArchive();
}
