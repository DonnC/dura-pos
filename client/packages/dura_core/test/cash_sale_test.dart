// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:test/test.dart';

SaleLine _line(String id, String name, String quantity, String price) =>
    SaleLine(
      productId: id,
      nameAtSale: name,
      quantity: Quantity.parse(quantity),
      unitPrice: Money.parse(price, Currency.usd),
    );

void main() {
  test('two loaves at USD 1.00 paid with USD 5.00 give USD 3.00 change', () {
    final sale = CashSale([_line('PR001', 'Bread loaf', '2', '1.00')]);
    final payment = sale.payCash(Money.parse('5.00', Currency.usd));

    expect(sale.total.toString(), 'USD 2.00');
    expect(payment.received.toString(), 'USD 5.00');
    expect(payment.change.toString(), 'USD 3.00');
    expect(payment.applied.toString(), 'USD 2.00');
  });

  test('totals several lines, including a measured quantity', () {
    final sale = CashSale([
      _line('PR001', 'Bread loaf', '2', '1.00'),
      _line('PR005', 'Tomatoes (kg)', '1.5', '1.25'),
    ]);
    // 2.00 + 1.875 -> 2.00 + 1.88 (each line is rounded) = 3.88
    expect(sale.lines[1].total.toString(), 'USD 1.88');
    expect(sale.total.toString(), 'USD 3.88');
  });

  test('exact cash gives zero change', () {
    final sale = CashSale([_line('PR001', 'Bread loaf', '2', '1.00')]);
    expect(sale.payCash(sale.total).change.toString(), 'USD 0.00');
  });

  test('cash short of the total is refused, never recorded as paid', () {
    final sale = CashSale([_line('PR001', 'Bread loaf', '2', '1.00')]);
    expect(
      () => sale.payCash(Money.parse('1.50', Currency.usd)),
      throwsArgumentError,
    );
  });

  test('cash in another currency is refused until conversion is chosen', () {
    final sale = CashSale([_line('PR001', 'Bread loaf', '2', '1.00')]);
    expect(
      () => sale.payCash(Money.parse('60.00', Currency.zwg)),
      throwsArgumentError,
    );
  });

  test('a sale needs at least one line, all in one currency', () {
    expect(() => CashSale([]), throwsArgumentError);
    expect(
      () => CashSale([
        _line('PR001', 'Bread loaf', '1', '1.00'),
        SaleLine(
          productId: 'PR002',
          nameAtSale: 'Cooking oil 2 L',
          quantity: Quantity.parse('1'),
          unitPrice: Money.parse('120.00', Currency.zwg),
        ),
      ]),
      throwsArgumentError,
    );
  });

  test('a line keeps the name and price it was sold at', () {
    final line = _line('PR001', 'Bread loaf', '2', '1.00');
    expect(line.nameAtSale, 'Bread loaf');
    expect(line.unitPrice.toString(), 'USD 1.00');
    expect(line.total.toString(), 'USD 2.00');
  });
}
