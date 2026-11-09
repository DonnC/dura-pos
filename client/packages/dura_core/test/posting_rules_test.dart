// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:test/test.dart';

/// Shared with the workbook generator's tests, so the phone and the sample shop
/// post the same way.
final _cases = jsonDecode(
  File('test/fixtures/posting_rules.json').readAsStringSync(),
) as Map<String, Object?>;

List<Map<String, Object?>> _group(String key) =>
    (_cases[key]! as List<Object?>).cast<Map<String, Object?>>();

Money _usd(Object? text) => Money.parse(text! as String, Currency.usd);

Account _account(Object? label) =>
    Account.values.firstWhere((account) => account.label == label);

/// Where a method's money lands. The app reads this from `Payment Methods`.
Account _methodAccount(String method) => switch (method.split(' ').first) {
  'Cash' => Account.tillCash,
  'EcoCash' || 'InnBucks' => Account.mobileMoney,
  'Card' => Account.cardPayments,
  'Bank' => Account.bank,
  'Kept' => Account.keptChangeOwed,
  _ => Account.customersOwe,
};

Posting? _expected(Object? expect) {
  if (expect == null) return null;
  final sides = expect as List<Object?>;
  return Posting(_usd(sides[0]), _account(sides[1]), _account(sides[2]));
}

void main() {
  group('the shared posting cases', () {
    for (final row in _group('payments')) {
      test('payment: ${row['method']}, ${row['status']}, ${row['value']}', () {
        final status = row['status'];
        final posting = paymentPosting(
          _methodAccount(row['method']! as String),
          _usd(row['value']),
          moved: status != 'Failed' && status != 'Cancelled',
          paidLater: status == 'Paid later',
        );
        expect(posting, _expected(row['expect']));
      });
    }

    for (final row in _group('stock')) {
      test('stock: ${row['type']}, ${row['value']}', () {
        final move = StockMove.values.firstWhere(
          (candidate) => candidate.label == row['type'],
        );
        expect(
          stockPosting(move, _usd(row['value'])),
          _expected(row['expect']),
        );
      });
    }

    for (final row in _group('money')) {
      test('money: ${row['type']}, ${row['value']}', () {
        final move = MoneyMove.values.firstWhere(
          (candidate) => candidate.label == row['type'],
        );
        final posting = moneyPosting(
          move,
          _usd(row['value']),
          fromTill: row['fromTill']! as bool,
        );
        expect(posting, _expected(row['expect']));
      });
    }
  });

  test('every stock and money type has a shared case', () {
    final stock = _group('stock').map((row) => row['type']).toSet();
    final money = _group('money').map((row) => row['type']).toSet();
    expect(StockMove.values.map((m) => m.label).toSet(), stock);
    expect(MoneyMove.values.map((m) => m.label).toSet(), money);
  });

  test('a posting is positive, with two different accounts', () {
    final one = _usd('1.00');
    expect(
      () => Posting(Money.zero(Currency.usd), Account.bank, Account.sales),
      throwsArgumentError,
    );
    expect(
      () => Posting(_usd('-1.00'), Account.bank, Account.sales),
      throwsArgumentError,
    );
    expect(() => Posting(one, Account.bank, Account.bank), throwsArgumentError);
  });

  test('a sale and its stock balance on their own accounts', () {
    final sale = paymentPosting(Account.tillCash, _usd('2.00'))!;
    final stock = stockPosting(StockMove.sold, _usd('-1.64'))!;
    expect(sale.debit, Account.tillCash);
    expect(stock.credit, Account.stock);
    expect(sale.amount - stock.amount, _usd('0.36'));
  });
}
