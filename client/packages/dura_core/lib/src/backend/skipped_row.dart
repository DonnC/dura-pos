// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// A row the owner edited that a backend couldn't use, for them to fix.
final class SkippedRow {
  const SkippedRow({
    required this.table,
    required this.row,
    required this.reason,
  });

  final String table;
  final int row;
  final String reason;
}
