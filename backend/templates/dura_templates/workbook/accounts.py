# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The accounts and the posting rules: which two accounts a row moves.

Double entry here is one row, two sides. A Payments, Stock Ledger or Money
Ledger row names a debit account, a credit account and one positive amount in
the pricing currency, so every row balances by construction. A row that only
repeats something posted elsewhere names neither: an `Invoiced on account` row
in the Money Ledger, say, tracks the customer's balance, and the Payments row
did the posting.

Two postings have no row of their own, and the reports add them:

- each sale's VAT moves from Sales to VAT owed, from the Sales tab's VAT;
- each purchase's VAT moves from VAT recovered on stock to VAT owed, from the
  Purchases tab's VAT, because stock is held at cost including VAT.

The app's posting rules must give the same answers as these.
"""

from __future__ import annotations

from decimal import Decimal as D

ACCOUNTS = [
    ("Till cash", "Asset"), ("Cash with owner", "Asset"), ("Bank", "Asset"), ("Mobile money", "Asset"),
    ("Card payments", "Asset"), ("Customers owe", "Asset"), ("Stock", "Asset"),
    ("Suppliers owed", "Liability"), ("Kept change owed", "Liability"), ("VAT owed", "Liability"),
    ("Owner's capital", "Equity"), ("Opening balances", "Equity"),
    ("Sales", "Income"),
    ("Cost of goods sold", "Expense"), ("VAT recovered on stock", "Expense"), ("Stock losses", "Expense"),
    ("Cash differences", "Expense"), ("Expenses", "Expense"),
]

# The accounts a payment can land in, by the first word of its method.
METHOD_ACCOUNTS = {"Cash": "Till cash", "EcoCash": "Mobile money", "InnBucks": "Mobile money", "SmilePay": "Mobile money",
                   "Card": "Card payments", "Bank": "Bank", "Kept": "Kept change owed", "On": "Customers owe"}

# What the month files move, which My Shop can only see through the Months tab.
MONTH_ACCOUNTS = ("Till cash", "Mobile money", "Card payments", "Bank", "Customers owe", "Kept change owed")

NO_POSTING = (None, "", "")
NOT_MOVED = ("Failed", "Cancelled")
PAID_LATER = "Paid later"


def method_account(method: str) -> str:
    """The account a payment method's money lands in."""
    return METHOD_ACCOUNTS[method.split(" ", 1)[0]]


def payment_posting(method: str, status: str, value: D) -> tuple[D | None, str, str]:
    """A Payments row as (amount, debit, credit). `value` is signed in the pricing
    currency: money in, or change and refunds going back out.
    """
    if status in NOT_MOVED or not value:
        return NO_POSTING
    account = method_account(method)
    if status == PAID_LATER:
        return value, account, "Customers owe"
    return (value, account, "Sales") if value > 0 else (-value, "Sales", account)


def stock_posting(row_type: str, value: D | None) -> tuple[D | None, str, str]:
    """A Stock Ledger row as (amount, debit, credit). A move between locations
    doesn't change what the shop's stock is worth, so it isn't posted.
    """
    if not value or row_type in ("Moved in", "Moved out"):
        return NO_POSTING
    other = {"Opening": "Opening balances", "Stock in": "Suppliers owed", "Sold": "Cost of goods sold",
             "Returned": "Cost of goods sold", "Written off": "Stock losses", "Counted": "Stock losses"}[row_type]
    return (value, "Stock", other) if value > 0 else (-value, other, "Stock")


def money_posting(row_type: str, from_till: bool, value: D | None) -> tuple[D | None, str, str]:
    """A Money Ledger row as (amount, debit, credit). Opening rows are posted when
    the year's closing balances are carried, because they name their own account.
    """
    paid_from = "Till cash" if from_till else "Cash with owner"
    sides = {"Float added": ("Till cash", "Owner's capital"), "Expense": ("Expenses", paid_from),
             "Supplier paid": ("Suppliers owed", paid_from), "Takings collected": ("Cash with owner", "Till cash"),
             "Banked": ("Bank", "Cash with owner"), "Change paid out": ("Kept change owed", "Till cash"),
             "Till topped up": ("Till cash", "Cash with owner"), "Mobile money withdrawn": ("Cash with owner", "Mobile money"),
             "Card paid into bank": ("Bank", "Card payments")}
    if not value:
        return NO_POSTING
    if row_type == "Cash difference":
        return (value, "Till cash", "Cash differences") if value > 0 else (-value, "Cash differences", "Till cash")
    if row_type not in sides:
        return NO_POSTING
    return abs(value), *sides[row_type]
