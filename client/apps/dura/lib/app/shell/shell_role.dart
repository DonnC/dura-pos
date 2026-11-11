// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Who is using the phone, which decides the navigation's words.
///
/// This only chooses what the shell shows. Permissions are enforced by
/// controllers and the hub once people and PINs exist (phase 4).
enum ShellRole {
  /// Sell, Stock, Money, My shop.
  owner,

  /// Sell, Stock, My till, Me.
  seller,
}
