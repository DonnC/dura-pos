# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Reads the sample's postings back and proves they agree with the shop's own
records: the trial balance nets to zero, and each control account equals what it
controls. Run: python -m dura_templates check
"""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal as D

from dura_templates.workbook.accounts import ACCOUNTS, MONTH_ACCOUNTS, NOT_MOVED

PC = "USD"
AMOUNT = f"Amount ({PC})"
NAMES = {name for name, _ in ACCOUNTS}
TOLERANCE = D(5)  # a wallet holding ZWG drifts a little in USD as the rate moves


def dec(value) -> D:
    return D(str(value)) if value is not None else D(0)


def check_rows(rows: list[dict], where: str, problems: list[str]) -> None:
    """A posted row names two different known accounts and one positive amount; an
    unposted row names none.
    """
    for row in rows:
        amount, debit, credit = row[AMOUNT], row["Debit account"], row["Credit account"]
        if amount is None:
            if debit or credit:
                problems.append(f"{where}: accounts with no amount: {row}")
        elif dec(amount) <= 0 or debit not in NAMES or credit not in NAMES or debit == credit:
            problems.append(f"{where}: bad posting {amount} {debit} / {credit}")


def check_sales_post_their_total(sales: list[dict], pays: list[dict], problems: list[str]) -> None:
    """What a sale's Payments rows post to Sales equals the sale's total."""
    posted = defaultdict(D)
    for p in pays:
        if p["Status"] not in NOT_MOVED and p["Status"] != "Paid later" and p[AMOUNT] is not None:
            posted[p["Sale ID"]] += dec(p[AMOUNT]) * (1 if p["Credit account"] == "Sales" else -1)
    for s in sales:
        if posted[s["Sale ID"]] != dec(s[f"Total ({PC})"]):
            problems.append(f"{s['Sale ID']}: posted {posted[s['Sale ID']]} != total {s[f'Total ({PC})']}")


def year_balances(sales, pays, stock, money, purchases) -> dict[str, D]:
    """Each account's balance for the year, debit positive, including the two
    postings that have no row of their own.
    """
    balance: dict[str, D] = defaultdict(D)
    for row in [*pays, *stock, *money]:
        if row[AMOUNT] is not None:
            balance[row["Debit account"]] += dec(row[AMOUNT])
            balance[row["Credit account"]] -= dec(row[AMOUNT])
    for s in sales:
        balance["Sales"] += dec(s[f"VAT ({PC})"])
        balance["VAT owed"] -= dec(s[f"VAT ({PC})"])
    for p in purchases:
        balance["VAT owed"] += dec(p[f"VAT ({PC})"])
        balance["VAT recovered on stock"] -= dec(p[f"VAT ({PC})"])
    return balance


def till_by_currency(pays: list[dict], money: list[dict], before) -> dict[str, D]:
    """Till cash per currency, in the currency's own amounts, up to a day."""
    till: dict[str, D] = defaultdict(D)

    def move(row, amount) -> None:
        if row["Date"].date() < before:
            if row["Debit account"] == "Till cash":
                till[row["Currency"]] += abs(dec(amount))
            if row["Credit account"] == "Till cash":
                till[row["Currency"]] -= abs(dec(amount))

    for p in pays:
        move(p, p["Amount"])
    for m in money:
        move(m, m["Cash amount"])
    return till


def check_controls(data: dict, problems: list[str]) -> dict[str, D]:
    """The trial balance, and each control account against what it controls."""
    sales, pays, stock, money, purchases = (data[k] for k in ("sales", "pays", "stock", "money", "purchases"))
    balance = year_balances(sales, pays, stock, money, purchases)

    if sum(balance.values()):
        problems.append(f"trial balance is out by {sum(balance.values())}")
    if balance["Stock"] != sum(dec(r[f"Stock value ({PC})"]) for r in stock):
        problems.append(f"Stock account {balance['Stock']} != Stock Ledger value")
    if -balance["Suppliers owed"] != data["suppliers_owed"]:
        problems.append(f"Suppliers owed {-balance['Suppliers owed']} != unpaid purchases {data['suppliers_owed']}")
    if balance["Customers owe"] != data["customers_owe"]:
        problems.append(f"Customers owe {balance['Customers owe']} != unpaid invoices {data['customers_owe']}")
    if -balance["Kept change owed"] != data["kept_change"]:
        problems.append(f"Kept change owed {-balance['Kept change owed']} != customers' balances {data['kept_change']}")
    months = data["months"]
    profit = -balance["Sales"] - balance["Cost of goods sold"]
    if profit != sum(dec(m[f"Gross profit ({PC})"]) for m in months):
        problems.append(f"gross profit {profit} != Months")
    for account in MONTH_ACCOUNTS:
        moved = sum(dec(m[f"{account} ({PC})"]) for m in months)
        opening_and_ledgers = sum(
            dec(r[AMOUNT]) * ((r["Debit account"] == account) - (r["Credit account"] == account))
            for r in money if r[AMOUNT] is not None)
        if moved + opening_and_ledgers != balance[account]:
            problems.append(f"Months {account}: {moved + opening_and_ledgers} != {balance[account]}")

    for account in ("Cash with owner", "Bank", "Mobile money", "Card payments"):
        if balance[account] < -TOLERANCE:
            problems.append(f"{account} is overdrawn: {balance[account]}")

    last = max(c["Date"].date() for c in data["cashups"])
    till = till_by_currency(pays, money, data["today"])
    floats = defaultdict(D)
    for m in data["all_money"]:
        if m["Type"] == "Float added":
            floats[m["Currency"]] += dec(m["Cash amount"])
    for cur, amount in floats.items():
        if till[cur] != amount:
            problems.append(f"Till cash {cur} {till[cur]} != floats {amount}, to {last}")
    return balance
