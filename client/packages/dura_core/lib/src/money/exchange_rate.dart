// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:decimal/decimal.dart';

import 'currency.dart';
import 'money.dart';

/// A shop's own rate: [rate] units of [to] for one unit of [from].
///
/// A sale records the rate it used, so a later rate change never alters it.
final class ExchangeRate {
  ExchangeRate({required this.from, required this.to, required this.rate}) {
    if (rate <= Decimal.zero) {
      throw ArgumentError.value(rate, 'rate', 'must be greater than zero');
    }
  }

  final Currency from;
  final Currency to;
  final Decimal rate;

  /// Converts [money] from [from] to [to], rounding half away from zero.
  Money convert(Money money) {
    if (money.currency != from) {
      throw ArgumentError('This rate converts $from, not ${money.currency}.');
    }
    return Money.rounded(money.amount * rate, to);
  }
}
