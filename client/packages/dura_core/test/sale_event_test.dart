// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:test/test.dart';

Money _usd(String text) => Money.parse(text, Currency.usd);

SaleLine _line(String id, String qty, String price) => SaleLine(
  productId: id,
  nameAtSale: 'Item $id',
  quantity: Quantity.parse(qty),
  unitPrice: _usd(price),
);

SaleDetails _details(String id, {DateTime? at}) => SaleDetails(
  id: id,
  device: 'P1',
  at: at ?? DateTime(2026, 11, 9, 14, 5, 31),
  location: 'Main',
  seller: 'Rudo',
  unitCosts: {'P001': _usd('0.82'), 'P002': _usd('2.75')},
);

Map<String, Object?> _sale(String id, {DateTime? at}) {
  final sale = CashSale([
    _line('P001', '2', '1.00'),
    _line('P002', '1', '4.00'),
  ]);
  return saleEvent(sale, sale.payCash(_usd('10.00')), _details(id, at: at));
}

List<Map<String, Object?>> _rows(Map<String, Object?> event, String table) =>
    ((event['rows']! as Map)[table]! as List).cast<Map<String, Object?>>();

void main() {
  test('a cash sale records the sale, its lines and its payments', () {
    final event = _sale('P1-S261109-0001');
    expect(event['type'], 'sale.completed');
    expect(event['at'], '2026-11-09T14:05:31');
    final sale = _rows(event, 'Sales').single;
    expect(sale['total'], '6.00');
    expect(sale['time'], '14:05:31');
    expect(_rows(event, 'Items Sold').map((r) => r['line_cost_pricing']), [
      '1.64',
      '2.75',
    ]);
  });

  test('the payment rows post exactly the sale total', () {
    final payments = _rows(_sale('P1-S261109-0001'), 'Payments');
    expect(payments[0]['amount_pricing'], '10.00');
    expect(payments[0]['debit_account'], 'Till cash');
    expect(payments[0]['credit_account'], 'Sales');
    expect(payments[1]['kind'], 'Change');
    expect(payments[1]['amount'], '-4.00');
    expect(payments[1]['amount_pricing'], '4.00');
    expect(payments[1]['debit_account'], 'Sales');
    expect(payments[1]['credit_account'], 'Till cash');
  });

  test('exact money writes no change row', () {
    final sale = CashSale([_line('P001', '1', '1.00')]);
    final event = saleEvent(sale, sale.payCash(_usd('1.00')), _details('S1'));
    expect(_rows(event, 'Payments'), hasLength(1));
  });

  test('a product with no cost is refused', () {
    final sale = CashSale([_line('P999', '1', '1.00')]);
    expect(
      () => saleEvent(sale, sale.payCash(_usd('1.00')), _details('S1')),
      throwsArgumentError,
    );
  });

  group('sealing', () {
    test('stock leaves once per product, however many sales', () {
      final sealed = sealedEvents(12, 'P1', [_sale('S1'), _sale('S2')]);
      expect(sealed, hasLength(3));
      final stock = sealed.last;
      expect(stock['id'], 'P1-L261109-0012');
      expect(stock['type'], 'stock.sold');
      final rows = _rows(stock, 'Stock Ledger');
      expect(rows, hasLength(2));
      expect(rows[0]['product_id'], 'P001');
      expect(rows[0]['qty'], '-4');
      expect(rows[0]['stock_value_pricing'], '-3.28');
      expect(rows[0]['amount_pricing'], '3.28');
      expect(rows[0]['debit_account'], 'Cost of goods sold');
      expect(rows[0]['credit_account'], 'Stock');
    });

    test('the stock rows equal the cost of the lines', () {
      final sealed = sealedEvents(1, 'P1', [_sale('S1')]);
      final cost = _rows(sealed.first, 'Items Sold')
          .map((r) => _usd(r['line_cost_pricing']! as String))
          .reduce((a, b) => a + b);
      final moved = _rows(sealed.last, 'Stock Ledger')
          .map((r) => _usd(r['amount_pricing']! as String))
          .reduce((a, b) => a + b);
      expect(moved, cost);
    });

    test('a batch across two days keeps each day on its own row', () {
      final sealed = sealedEvents(1, 'P1', [
        _sale('S1', at: DateTime(2026, 11, 30, 20)),
        _sale('S2', at: DateTime(2026, 12, 1, 8)),
      ]);
      final dates = _rows(sealed.last, 'Stock Ledger').map((r) => r['date']);
      expect(dates.toSet(), {'2026-11-30', '2026-12-01'});
    });

    test('a batch with no sales gains nothing', () {
      final other = {'id': 'E1', 'type': 'note', 'at': '2026-11-09T10:00:00'};
      expect(sealedEvents(1, 'P1', [other]), [other]);
    });
  });

  test('every field a sale writes is one the workbook has', () {
    final contract = jsonDecode(
      File('../../../backend/templates/dist/contract.json').readAsStringSync(),
    ) as Map<String, Object?>;
    final tables = contract['tables']! as Map<String, Object?>;
    for (final event in sealedEvents(1, 'P1', [_sale('S1')])) {
      final rows = event['rows']! as Map<String, Object?>;
      for (final table in rows.keys) {
        final fields =
            (tables[table]! as Map<String, Object?>)['fields']!
                as Map<String, Object?>;
        for (final row in _rows(event, table)) {
          expect(fields.keys, containsAll(row.keys), reason: table);
        }
      }
    }
  });
}
