// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// A backend's answer to a batch.
final class JournalAck {
  const JournalAck.accepted(int this.through) : need = null;

  const JournalAck.gap(int this.need) : through = null;

  /// The highest batch stored for this device, when the batch was accepted.
  final int? through;

  /// The batch to send next, when this one skipped ahead.
  final int? need;

  bool get isAccepted => through != null;
}
