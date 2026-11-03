// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:decimal/decimal.dart';
import 'package:dura_core/dura_core.dart';
import 'package:test/test.dart';

void main() {
  group('Money', () {
    test('parses an exact amount and shows its currency', () {
      final price = Money.parse('1.5', Currency.usd);
      expect(price.amount, Decimal.parse('1.50'));
      expect(price.toString(), 'USD 1.50');
    });

    test('rejects amounts finer than the currency allows', () {
      expect(() => Money.parse('1.005', Currency.usd), throwsArgumentError);
    });

    test('adds and subtracts within one currency', () {
      final a = Money.parse('5.00', Currency.usd);
      final b = Money.parse('3.25', Currency.usd);
      expect((a + b).toString(), 'USD 8.25');
      expect((a - b).toString(), 'USD 1.75');
      expect((b - a).toString(), 'USD -1.75');
    });

    test('never adds different currencies together', () {
      final usd = Money.parse('1.00', Currency.usd);
      final zwg = Money.parse('1.00', Currency.zwg);
      expect(() => usd + zwg, throwsArgumentError);
      expect(() => usd - zwg, throwsArgumentError);
      expect(() => usd.compareTo(zwg), throwsArgumentError);
    });

    test('equal amounts in the same currency are equal', () {
      expect(Money.parse('2', Currency.zar), Money.parse('2.00', Currency.zar));
      expect(
        Money.parse('2', Currency.zar),
        isNot(Money.parse('2', Currency.usd)),
      );
    });

    test('multiplies by a quantity, rounding half away from zero', () {
      final perKg = Money.parse('2.25', Currency.usd);
      // 2.25 x 0.5 = 1.125 -> 1.13
      expect(perKg.times(Quantity.parse('0.5')).toString(), 'USD 1.13');
    });
  });

  group('Quantity', () {
    test('must be greater than zero', () {
      expect(() => Quantity.parse('0'), throwsArgumentError);
      expect(() => Quantity.parse('-1'), throwsArgumentError);
      expect(Quantity.parse('1.5').value, Decimal.parse('1.5'));
    });
  });

  group('ExchangeRate', () {
    test('converts at the recorded rate and rounds to the target', () {
      // Fictional rate: 1 USD = 26.75 ZWG.
      final rate = ExchangeRate(
        from: Currency.usd,
        to: Currency.zwg,
        rate: Decimal.parse('26.75'),
      );
      expect(
        rate.convert(Money.parse('2.00', Currency.usd)).toString(),
        'ZWG 53.50',
      );
      expect(
        rate.convert(Money.parse('0.03', Currency.usd)).toString(),
        'ZWG 0.80',
      );
    });

    test('refuses money in the wrong currency and non-positive rates', () {
      final rate = ExchangeRate(
        from: Currency.usd,
        to: Currency.zwg,
        rate: Decimal.parse('26.75'),
      );
      expect(
        () => rate.convert(Money.parse('1.00', Currency.zar)),
        throwsArgumentError,
      );
      expect(
        () => ExchangeRate(
          from: Currency.usd,
          to: Currency.zwg,
          rate: Decimal.zero,
        ),
        throwsArgumentError,
      );
    });
  });
}
