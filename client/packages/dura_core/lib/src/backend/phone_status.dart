// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// How far one phone's records have reached.
final class PhoneStatus {
  const PhoneStatus({
    required this.device,
    required this.name,
    required this.role,
    required this.uploadedThrough,
    required this.viewedThrough,
    required this.lastSeen,
  });

  final String device;
  final String name;
  final String role;

  /// The last batch stored by the backend.
  final int uploadedThrough;

  /// The last batch that reached the owner's records.
  final int viewedThrough;

  /// The last accepted upload, or null if there hasn't been one.
  final DateTime? lastSeen;
}
