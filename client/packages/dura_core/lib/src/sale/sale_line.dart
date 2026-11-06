// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/money.dart';
import '../money/quantity.dart';

/// One product line, keeping the name and price it was sold at.
///
/// Later catalogue changes must not alter a completed sale, so the line holds
/// its own copy of both rather than looking them up.
final class SaleLine {
  SaleLine({
    required this.productId,
    required this.nameAtSale,
    required this.quantity,
    required this.unitPrice,
  }) {
    if (unitPrice.isNegative) {
      throw ArgumentError.value(unitPrice, 'unitPrice', 'must not be negative');
    }
  }

  final String productId;
  final String nameAtSale;
  final Quantity quantity;
  final Money unitPrice;

  /// Quantity times unit price, rounded per line.
  Money get total => unitPrice.times(quantity);
}
