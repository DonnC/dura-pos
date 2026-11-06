// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/currency.dart';

/// What the owner chooses when a shop is created.
///
/// [pricingCurrency] has no default: the owner always chooses it.
final class ShopSetup {
  const ShopSetup({
    required this.name,
    required this.timeZone,
    required this.pricingCurrency,
  });

  final String name;
  final String timeZone;
  final Currency pricingCurrency;
}
