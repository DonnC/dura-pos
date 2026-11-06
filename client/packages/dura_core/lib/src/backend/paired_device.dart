// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// This phone's identity with a backend.
///
/// [secret] signs every request, so it belongs in secure storage. It's left
/// out of [toString] so it can't reach a log.
final class PairedDevice {
  const PairedDevice({
    required this.id,
    required this.secret,
    required this.role,
    required this.business,
  });

  final String id;
  final String secret;
  final String role;
  final String business;

  bool get isOwner => role == 'owner';

  @override
  String toString() => 'PairedDevice($id, $role)';
}
