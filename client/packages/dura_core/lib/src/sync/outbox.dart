// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../backend/journal_batch.dart';

/// Builds a batch's final events from the ones waiting in it.
typedef BatchBuilder = List<Map<String, Object?>> Function(
  int number,
  List<Map<String, Object?>> events,
);

/// Events waiting on this phone, and the batches they were sealed into.
///
/// A sealed batch keeps its number and content for good, so a retry always
/// sends exactly what was sent before.
abstract interface class Outbox {
  /// Saves an event durably. Adding the same event ID again changes nothing.
  Future<void> add(Map<String, Object?> event);

  /// Seals up to [maxEvents] waiting events as the next batch, in one
  /// transaction, and returns its number; null if nothing is waiting.
  Future<int?> seal(int maxEvents, BatchBuilder build);

  /// A sealed batch, or null if this phone doesn't hold that number.
  Future<JournalBatch?> batch(int number);

  /// The lowest sealed batch not yet confirmed stored.
  Future<int?> firstUnsent();

  /// Records that the backend has stored batch [number].
  Future<void> markUploaded(int number);
}
