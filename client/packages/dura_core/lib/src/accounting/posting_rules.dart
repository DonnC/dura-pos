// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/money.dart';
import 'account.dart';
import 'money_move.dart';
import 'posting.dart';
import 'stock_move.dart';

// Which two accounts a row moves (decision 0010). All three functions return
// null for a row that moves no value, so the row names no accounts. These must
// give the same answers as the generator's `workbook/accounts.py`.

bool _isNothing(Money value) => value == Money.zero(value.currency);

/// A Payments row. [value] is signed in the pricing currency: money in, or
/// change and refunds going back out. [account] is where the method's money
/// lands, from the `Payment Methods` tab.
Posting? paymentPosting(
  Account account,
  Money value, {
  bool moved = true,
  bool paidLater = false,
}) {
  if (!moved || _isNothing(value)) return null;
  return Posting.signed(
    value,
    account,
    paidLater ? Account.customersOwe : Account.sales,
  );
}

/// A Stock Ledger row. [value] is signed: stock in is positive. A move between
/// locations doesn't change what the shop's stock is worth, so it isn't posted.
Posting? stockPosting(StockMove move, Money value) {
  if (_isNothing(value)) return null;
  final other = switch (move) {
    StockMove.opening => Account.openingBalances,
    StockMove.stockIn => Account.suppliersOwed,
    StockMove.sold || StockMove.returned => Account.costOfGoodsSold,
    StockMove.writtenOff || StockMove.counted => Account.stockLosses,
    StockMove.movedIn || StockMove.movedOut => null,
  };
  return other == null ? null : Posting.signed(value, Account.stock, other);
}

/// A Money Ledger row. [value] is its amount in the pricing currency, signed
/// only for a [MoneyMove.cashDifference]: over is positive. [fromTill] says
/// whether the money left a till or the owner's cash.
Posting? moneyPosting(MoneyMove move, Money value, {bool fromTill = false}) {
  if (_isNothing(value)) return null;
  if (move == MoneyMove.cashDifference) {
    return Posting.signed(value, Account.tillCash, Account.cashDifferences);
  }
  final paidFrom = fromTill ? Account.tillCash : Account.cashWithOwner;
  final sides = switch (move) {
    MoneyMove.floatAdded => (Account.tillCash, Account.ownersCapital),
    MoneyMove.expense => (Account.expenses, paidFrom),
    MoneyMove.supplierPaid => (Account.suppliersOwed, paidFrom),
    MoneyMove.takingsCollected => (Account.cashWithOwner, Account.tillCash),
    MoneyMove.banked => (Account.bank, Account.cashWithOwner),
    MoneyMove.changePaidOut => (Account.keptChangeOwed, Account.tillCash),
    MoneyMove.tillToppedUp => (Account.tillCash, Account.cashWithOwner),
    MoneyMove.mobileMoneyWithdrawn => (
      Account.cashWithOwner,
      Account.mobileMoney,
    ),
    MoneyMove.cardPaidIntoBank => (Account.bank, Account.cardPayments),
    _ => null,
  };
  if (sides == null) return null;
  final size = value.isNegative ? Money.zero(value.currency) - value : value;
  return Posting(size, sides.$1, sides.$2);
}
