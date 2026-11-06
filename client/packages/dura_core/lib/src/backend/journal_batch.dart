// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Sealed events to upload, numbered per device from 1.
///
/// A number is never reused for different events: a backend keeps only the
/// highest number, so it would acknowledge them as a duplicate.
final class JournalBatch {
  const JournalBatch({required this.number, required this.events});

  final int number;
  final List<Map<String, Object?>> events;
}
