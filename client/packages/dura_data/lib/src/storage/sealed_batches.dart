// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:drift/drift.dart';

/// Batches exactly as they were sealed, so a retry sends the same events.
class SealedBatches extends Table {
  IntColumn get number => integer()();
  TextColumn get events => text()();
  BoolColumn get uploaded => boolean().withDefault(const Constant(false))();

  @override
  Set<Column<Object>> get primaryKey => {number};
}
