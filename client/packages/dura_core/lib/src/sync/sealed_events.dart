// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:decimal/decimal.dart';

import '../accounting/posting_rules.dart';
import '../accounting/stock_move.dart';
import '../money/currency.dart';
import '../money/money.dart';
import '../sale/sale_event.dart';

const stockSoldEvent = 'stock.sold';

final class _Sold {
  _Sold(this.first);

  final Map<String, Object?> first;
  Decimal quantity = Decimal.zero;
  Money? cost;
}

/// A batch's events: the sales as recorded, then one event taking what they sold
/// out of stock, with one Sold row per day, location and product.
///
/// One row per product keeps the Stock Ledger small however many sales there
/// are. The events are sealed once and never rebuilt, so the IDs stay stable.
List<Map<String, Object?>> sealedEvents(
  int number,
  String device,
  List<Map<String, Object?>> events,
) {
  final sold = <String, _Sold>{};
  var lastAt = '';
  for (final event in events) {
    final rows = (event['rows'] as Map?)?[itemsSoldTable] as List?;
    if (rows == null) continue;
    lastAt = event['at']! as String;
    for (final row in rows.cast<Map<String, Object?>>()) {
      final key = '${row['date']}|${row['location']}|${row['product_id']}';
      final entry = sold.putIfAbsent(key, () => _Sold(row));
      final currency = Currency(row['currency']! as String, scale: 2);
      final cost = Money.parse(row['line_cost_pricing']! as String, currency);
      entry.quantity += Decimal.parse(row['qty']! as String);
      entry.cost = entry.cost == null ? cost : entry.cost! + cost;
    }
  }
  if (sold.isEmpty) return events;

  final id =
      '$device-L${lastAt.substring(2, 10).replaceAll('-', '')}-'
      '${number.toString().padLeft(4, '0')}';
  var row = 0;
  return [
    ...events,
    {
      'id': id,
      'type': stockSoldEvent,
      'at': lastAt,
      'data': {'batch': number},
      'rows': {
        'Stock Ledger': [
          for (final entry in sold.values)
            _soldRow(id, row += 1, device, lastAt, entry),
        ],
      },
    },
  ];
}

Map<String, Object?> _soldRow(
  String id,
  int row,
  String device,
  String lastAt,
  _Sold entry,
) {
  final first = entry.first;
  final cost = entry.cost!;
  final value = Money.zero(cost.currency) - cost;
  return {
    'row_id': '$id-$row',
    'date': first['date'],
    'time': lastAt.substring(11, 19),
    'phone': device,
    'who': 'Dura',
    'location': first['location'],
    'type': StockMove.sold.label,
    'product_id': first['product_id'],
    'product': first['product'],
    'qty': (-entry.quantity).toString(),
    'unit_cost_pricing': first['unit_cost_pricing'],
    'stock_value_pricing': decimal(value),
    'cost_currency': cost.currency.code,
    'reference': id,
    'note': 'Sales in this batch',
    ...postingFields(stockPosting(StockMove.sold, value)),
  };
}
