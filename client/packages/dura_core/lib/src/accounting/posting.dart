// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/money.dart';
import 'account.dart';

/// One movement of value between two accounts, in the pricing currency.
///
/// One positive amount against two accounts balances by construction, so a row
/// in the shop's records is a complete double entry.
final class Posting {
  Posting(this.amount, this.debit, this.credit) {
    if (amount.isNegative || amount == Money.zero(amount.currency)) {
      throw ArgumentError.value(amount, 'amount', 'must be positive');
    }
    if (debit == credit) {
      throw ArgumentError.value(credit, 'credit', 'must differ from the debit');
    }
  }

  /// A signed [value]: positive debits [ifPositive], negative reverses the sides.
  factory Posting.signed(Money value, Account ifPositive, Account other) =>
      value.isNegative
      ? Posting(Money.zero(value.currency) - value, other, ifPositive)
      : Posting(value, ifPositive, other);

  final Money amount;
  final Account debit;
  final Account credit;

  @override
  bool operator ==(Object other) =>
      other is Posting &&
      other.amount == amount &&
      other.debit == debit &&
      other.credit == credit;

  @override
  int get hashCode => Object.hash(amount, debit, credit);

  @override
  String toString() => '$amount: ${debit.label} / ${credit.label}';
}
