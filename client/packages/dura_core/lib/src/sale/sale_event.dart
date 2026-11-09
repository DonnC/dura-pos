// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../accounting/account.dart';
import '../accounting/posting.dart';
import '../accounting/posting_rules.dart';
import '../money/money.dart';
import 'cash_payment.dart';
import 'cash_sale.dart';
import 'sale_details.dart';

const saleCompletedEvent = 'sale.completed';
const itemsSoldTable = 'Items Sold';

/// A date as the sheets take it, e.g. `2026-11-09`.
String isoDate(DateTime at) => at.toIso8601String().substring(0, 10);

/// A time as the sheets take it, e.g. `14:05:31`.
String isoTime(DateTime at) => at.toIso8601String().substring(11, 19);

String decimal(Money value) =>
    value.amount.toStringAsFixed(value.currency.scale);

/// The columns a posted row adds, or none if it moves no value.
Map<String, Object?> postingFields(Posting? posting) => posting == null
    ? const {}
    : {
        'amount_pricing': decimal(posting.amount),
        'debit_account': posting.debit.label,
        'credit_account': posting.credit.label,
      };

/// The event for a completed cash sale, with every row it adds to the month
/// file. The sale's stock rows are added when its batch is sealed, from these
/// `Items Sold` rows, so a sale can't reach the records with only one side.
///
/// The sale must be in the pricing currency: tax and other currencies come
/// with the slices that add them to [CashSale].
Map<String, Object?> saleEvent(
  CashSale sale,
  CashPayment payment,
  SaleDetails details,
) {
  if (payment.applied != sale.total) {
    throw ArgumentError('The payment does not settle this sale.');
  }
  final code = sale.currency.code;
  final date = isoDate(details.at);
  final time = isoTime(details.at);
  final total = decimal(sale.total);
  final zero = decimal(Money.zero(sale.currency));
  final shared = {
    'sale_id': details.id,
    'date': date,
    'phone': details.device,
    'location': details.location,
    'type': 'Sale',
    'currency': code,
  };
  final cash = 'Cash $code';

  Map<String, Object?> paymentRow(
    int line,
    String kind,
    Money amount,
    String status,
  ) => {
    'payment_id': '${details.id}-$line',
    'sale_id': details.id,
    'date': date,
    'time': time,
    'phone': details.device,
    'seller': details.seller,
    'kind': kind,
    'method': cash,
    'currency': code,
    'amount': decimal(amount),
    'rate_used': '1',
    'sale_currency': code,
    'amount_in_sale_currency': decimal(amount),
    'status': status,
    'confirmed_by': 'Cash count',
    'zimra_money_type': 'Cash',
    ...postingFields(paymentPosting(Account.tillCash, amount)),
  };

  var line = 0;
  final items = <Map<String, Object?>>[];
  for (final item in sale.lines) {
    final cost = details.unitCosts[item.productId];
    if (cost == null) {
      throw ArgumentError('No cost for product ${item.productId}.');
    }
    line += 1;
    items.add({
      ...shared,
      'line': line,
      'product_id': item.productId,
      'product': item.nameAtSale,
      'qty': item.quantity.value.toString(),
      'unit_price': decimal(item.unitPrice),
      'discount': zero,
      'line_total': decimal(item.total),
      'vat': zero,
      'unit_cost_pricing': decimal(cost),
      'line_cost_pricing': decimal(cost.times(item.quantity)),
    });
  }

  return {
    'id': details.id,
    'type': saleCompletedEvent,
    'at': details.at.toIso8601String().substring(0, 19),
    'data': {'total': total, 'currency': code},
    'rows': {
      'Sales': [
        {
          ...shared,
          'time': time,
          'seller': details.seller,
          'items': sale.lines.length,
          'subtotal': total,
          'discount': zero,
          'total': total,
          'vat': zero,
          'paid_by': cash,
          'payment_status': 'Paid',
          'total_pricing': total,
          'vat_pricing': zero,
        },
      ],
      itemsSoldTable: items,
      'Payments': [
        paymentRow(1, 'Payment', payment.received, 'Paid'),
        if (payment.change != Money.zero(sale.currency))
          paymentRow(
            2,
            'Change',
            Money.zero(sale.currency) - payment.change,
            'Given',
          ),
      ],
    },
  };
}
