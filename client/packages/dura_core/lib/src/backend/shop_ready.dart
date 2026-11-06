// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// A shop whose records exist on its backend.
final class ShopReady {
  const ShopReady({required this.business, required this.period});

  final String business;

  /// The month the shop started in, e.g. `2026-11`.
  final String period;
}
