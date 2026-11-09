# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Adds the debit account, credit account and amount to the simulated rows, and
carries 2025's closing balances into the 2026 Money Ledger.

A phone posts each row as it records it. The sample posts once at the end,
because a sale's rows must add up to its total in the pricing currency, and that
is only known when the sale is complete.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, time
from decimal import Decimal as D
from dura_templates.money import q2
from dura_templates.sample.rates import rate_for
from dura_templates.sample.records import money_ledger_y, next_id, pays_m, purchases_y, sales_m, stock_ledger_y
from dura_templates.workbook.accounts import ACCOUNTS, NOT_MOVED, PAID_LATER, money_posting, payment_posting, stock_posting

# Sales rows
SALE_ID, SALE_VAT_PC, SALE_TOTAL_PC = 0, 30, 29
# Payments rows
PAY_SALE, PAY_DAY, PAY_METHOD, PAY_CUR, PAY_AMOUNT, PAY_SALE_CUR, PAY_IN_SALE, PAY_STATUS = 1, 2, 7, 8, 9, 11, 12, 13
CARRIED = [name for name, kind in ACCOUNTS if kind in ("Asset", "Liability") and name != "Stock"]


def _at_least_a_cent(value: D, amount: D) -> D:
    """A real movement never posts as nothing, however small it is once converted."""
    return value or D("0.01").copy_sign(amount)


def _pricing_values(rows: list[list], total: D) -> dict[int, D]:
    """Each posted row's value, by position, summing exactly to the sale's total:
    any rounding goes on the largest row.
    """
    posted = {i: r for i, r in enumerate(rows) if r[PAY_STATUS] not in NOT_MOVED + (PAID_LATER,) and r[PAY_IN_SALE]}
    values = {i: _at_least_a_cent(q2(r[PAY_IN_SALE] / rate_for(r[PAY_SALE_CUR], r[PAY_DAY])), r[PAY_IN_SALE])
              for i, r in posted.items()}
    if values:
        largest = max(values, key=lambda i: abs(values[i]))
        values[largest] += total - sum(values.values())
    return values


def post_payments() -> None:
    """Posts every Payments row, a whole sale at a time."""
    totals = {row[SALE_ID]: row[SALE_TOTAL_PC] for rows in sales_m.values() for row in rows}
    for rows in pays_m.values():
        by_sale = defaultdict(list)
        for row in rows:
            by_sale[row[PAY_SALE]].append(row)
        for sale, sale_rows in by_sale.items():
            values = _pricing_values(sale_rows, totals[sale])
            for i, row in enumerate(sale_rows):
                value = values.get(i)
                if row[PAY_STATUS] == PAID_LATER:
                    value = q2(row[PAY_IN_SALE] / rate_for(row[PAY_SALE_CUR], row[PAY_DAY]))
                row.extend(payment_posting(row[PAY_METHOD], row[PAY_STATUS], value or D(0)))


def post_ledgers() -> None:
    """Posts the Stock Ledger and Money Ledger rows."""
    for rows in stock_ledger_y.values():
        for row in rows:
            row.extend(stock_posting(row[6], row[11]))
    for rows in money_ledger_y.values():
        for row in rows:
            row.extend(money_posting(row[6], row[10] == "Yes", row[9]))


def _closing_balances(year: int) -> dict[tuple[str, str], list[D]]:
    """Each carried account's closing balance as {(account, currency): [pricing
    value, amount in that currency]}, debit positive.
    """
    balances: dict[tuple[str, str], list[D]] = defaultdict(lambda: [D(0), D(0)])

    def move(account: str, cur: str, value: D, amount: D) -> None:
        if account in CARRIED:
            balances[(account, cur)][0] += value
            balances[(account, cur)][1] += amount

    for ym, rows in pays_m.items():
        if ym.startswith(str(year)):
            for r in rows:
                value, debit, credit = r[18:21]
                if value:
                    move(debit, r[PAY_CUR], value, abs(r[PAY_AMOUNT]))
                    move(credit, r[PAY_CUR], -value, -abs(r[PAY_AMOUNT]))
    for r in money_ledger_y[year]:
        value, debit, credit = r[16:19]
        if value:
            move(debit, r[7], value, abs(r[8]))
            move(credit, r[7], -value, -abs(r[8]))
    for r in stock_ledger_y[year]:
        if r[19] == "Suppliers owed":  # stock in, on the supplier's account
            move("Suppliers owed", r[12], -r[17], -r[17])
    for ym, rows in sales_m.items():
        if ym.startswith(str(year)):
            for r in rows:
                move("VAT owed", r[9], -r[SALE_VAT_PC], -r[14])
    for r in purchases_y[year]:
        move("VAT owed", r[9], r[18], r[11])
    return balances


def carry_opening_balances(year: int) -> None:
    """Writes `year`'s opening rows, one per account and currency, into its Money
    Ledger, with last year's profit landing in Opening balances. Stock carries
    itself through its own Opening rows.
    """
    day = date(year, 1, 1)
    rows = []
    for (account, cur), (value, amount) in sorted(_closing_balances(year - 1).items()):
        if not value and not amount:
            continue
        sides = (account, "Opening balances") if value >= 0 else ("Opening balances", account)
        rows.append([next_id("P1", "M", day), day, time(0, 0), "P1", "Dura", "Main", "Opening", cur, amount, value,
                     "No", "", "", None, f"CLOSE-{year - 1}", f"Closing balance of {year - 1}: {account}",
                     abs(value), *sides])
    money_ledger_y[year][:0] = rows


def post_all() -> None:
    """Posts everything the simulation recorded. Call once, after it has run."""
    post_payments()
    post_ledgers()
    carry_opening_balances(2026)
