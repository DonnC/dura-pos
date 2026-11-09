// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/money.dart';

/// What a sale's records need beyond the basket and the cash.
final class SaleDetails {
  const SaleDetails({
    required this.id,
    required this.device,
    required this.at,
    required this.location,
    required this.seller,
    required this.unitCosts,
  });

  /// A readable ID such as `P1-S261109-0031`, used once.
  final String id;
  final String device;

  /// The shop's local time when the sale completed.
  final DateTime at;
  final String location;
  final String seller;

  /// Each product's cost on the day, by product ID.
  final Map<String, Money> unitCosts;
}
