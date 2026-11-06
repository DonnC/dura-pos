// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:decimal/decimal.dart';

import 'currency.dart';
import 'quantity.dart';

/// An exact amount in one currency, never a floating-point number.
///
/// Arithmetic and comparison across currencies throw, because Dura never adds
/// currencies together. Converting needs an explicit `ExchangeRate`.
final class Money implements Comparable<Money> {
  const Money._(this.amount, this.currency);

  /// Parses a decimal string such as `1.50`.
  ///
  /// Rejects more decimal places than [currency] allows, so an entered price
  /// is never silently rounded.
  factory Money.parse(String amount, Currency currency) {
    final value = Decimal.tryParse(amount.trim());
    if (value == null) {
      throw ArgumentError.value(amount, 'amount', 'is not a decimal number');
    }
    if (value.scale > currency.scale) {
      throw ArgumentError.value(
        amount,
        'amount',
        'has more decimal places than $currency allows',
      );
    }
    return Money._(value, currency);
  }

  factory Money.zero(Currency currency) => Money._(Decimal.zero, currency);

  /// Rounds [amount] half away from zero to the scale of [currency].
  factory Money.rounded(Decimal amount, Currency currency) =>
      Money._(amount.round(scale: currency.scale), currency);

  final Decimal amount;
  final Currency currency;

  Money operator +(Money other) =>
      Money._(amount + _same(other).amount, currency);

  Money operator -(Money other) =>
      Money._(amount - _same(other).amount, currency);

  /// The price of [quantity] units, rounded to the currency's scale.
  Money times(Quantity quantity) =>
      Money.rounded(amount * quantity.value, currency);

  bool get isNegative => amount < Decimal.zero;

  @override
  int compareTo(Money other) => amount.compareTo(_same(other).amount);

  Money _same(Money other) {
    if (other.currency != currency) {
      throw ArgumentError(
        'Cannot combine $currency with ${other.currency}; convert first.',
      );
    }
    return other;
  }

  @override
  bool operator ==(Object other) =>
      other is Money && other.currency == currency && other.amount == amount;

  @override
  int get hashCode => Object.hash(currency, amount);

  /// Shows the currency with every amount, e.g. `USD 2.00`.
  @override
  String toString() => '$currency ${amount.toStringAsFixed(currency.scale)}';
}
