// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/currency.dart';
import '../money/money.dart';
import 'cash_payment.dart';
import 'sale_line.dart';

/// A basket priced in one currency, paid in cash in that currency.
///
/// Paying in another currency, and split payments, come in a later slice
/// through `ExchangeRate`.
final class CashSale {
  CashSale(List<SaleLine> lines) : lines = List.unmodifiable(lines) {
    if (this.lines.isEmpty) {
      throw ArgumentError.value(lines, 'lines', 'must not be empty');
    }
    if (this.lines.any((line) => line.unitPrice.currency != currency)) {
      throw ArgumentError('Every line in a sale must use the same currency.');
    }
  }

  final List<SaleLine> lines;

  Currency get currency => lines.first.unitPrice.currency;

  /// The sum of the rounded line totals.
  Money get total =>
      lines.fold(Money.zero(currency), (sum, line) => sum + line.total);

  CashPayment payCash(Money received) =>
      CashPayment(total: total, received: received);
}
