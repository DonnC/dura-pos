// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'skipped_row.dart';

/// Products, prices, rates, staff and settings, by table and field ID.
///
/// Every value is a string, so amounts stay exact. When [isUnchanged] is true,
/// [tables] is empty and the phone keeps what it has.
final class MasterData {
  const MasterData.unchanged(this.version)
    : isUnchanged = true,
      tables = const {},
      skipped = const [];

  const MasterData.changed({
    required this.version,
    required this.tables,
    required this.skipped,
  }) : isUnchanged = false;

  final String version;
  final bool isUnchanged;
  final Map<String, List<Map<String, String>>> tables;
  final List<SkippedRow> skipped;
}
