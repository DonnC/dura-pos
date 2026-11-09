// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// A Money Ledger row's type, by the word the sheet shows.
enum MoneyMove {
  floatAdded('Float added'),
  expense('Expense'),
  supplierPaid('Supplier paid'),
  takingsCollected('Takings collected'),
  banked('Banked'),
  changePaidOut('Change paid out'),
  tillToppedUp('Till topped up'),
  mobileMoneyWithdrawn('Mobile money withdrawn'),
  cardPaidIntoBank('Card paid into bank'),
  cashDifference('Cash difference'),

  // These track a contact's balance. Another row did the posting.
  purchase('Purchase'),
  invoicedOnAccount('Invoiced on account'),
  accountPaid('Account paid'),
  changeKept('Change kept'),
  changeUsed('Change used');

  const MoneyMove(this.label);

  final String label;
}
