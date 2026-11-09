// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:drift/drift.dart';

/// Events not yet sealed, and the batch each one went into.
class OutboxEvents extends Table {
  IntColumn get sequence => integer().autoIncrement()();
  TextColumn get eventId => text().unique()();
  TextColumn get payload => text()();
  IntColumn get batchNumber => integer().nullable()();
}
