// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// The shop's accounts, by the names the sheets show.
///
/// The workbook generator holds the same list in `workbook/accounts.py`, and
/// `test/fixtures/posting_rules.json` keeps the two in step.
enum Account {
  tillCash('Till cash'),
  cashWithOwner('Cash with owner'),
  bank('Bank'),
  mobileMoney('Mobile money'),
  cardPayments('Card payments'),
  customersOwe('Customers owe'),
  stock('Stock'),
  suppliersOwed('Suppliers owed'),
  keptChangeOwed('Kept change owed'),
  vatOwed('VAT owed'),
  ownersCapital("Owner's capital"),
  openingBalances('Opening balances'),
  sales('Sales'),
  costOfGoodsSold('Cost of goods sold'),
  vatRecoveredOnStock('VAT recovered on stock'),
  stockLosses('Stock losses'),
  cashDifferences('Cash differences'),
  expenses('Expenses');

  const Account(this.label);

  final String label;
}
