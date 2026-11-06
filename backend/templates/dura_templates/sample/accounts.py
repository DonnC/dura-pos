# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Invoices on account and quotes: settling what the clinic owes, and quotes
that expire or become sales.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, time, timedelta
from decimal import Decimal as D
from dura_templates.sample.business import CUST, PROD, active_product
from dura_templates.sample.period import TODAY, crng
from dura_templates.sample.rates import unit_price
from dura_templates.sample.records import ledger, log, next_id, pays_m, quotes_m
from dura_templates.sample.sales import book_sale, open_invoices
from dura_templates.sample.stock import stock


def settle_invoices(day: date):
    """The clinic pays last month's invoices by bank transfer on the first weekday of the month."""
    first = day.replace(day=1)
    while first.weekday() >= 5:
        first += timedelta(days=1)
    due = [s for s in open_invoices if s["day"] < day.replace(day=1)]
    if day != first or not due:
        return
    t = time(10, 0)
    ref = f"EFT{crng.randint(10**5, 10**6 - 1)}"
    for s in due:
        prow = [f"{s['id']}-2", s["id"], day, t, "P1", "Chipo Moyo", "Account payment", "Bank transfer USD", "USD",
                s["total"], D(1), "USD", s["total"], "Paid later", "", ref, "Manual (bank statement checked)",
                "BankTransfer"]
        pays_m[f"{day:%Y-%m}"].append(prow)
        s["row"][25] = "Paid"  # the owner's phone updates the invoice's payment status cell
        ledger(day, t, "P1", "Chipo Moyo", "Main", "Account paid", cur="USD", ref=s["id"],
               note=f"Bank transfer {ref}", party=s["customer"], balance=s["total"])
        open_invoices.remove(s)
    total = sum(s["total"] for s in due)
    log(day, t, "P1", "Chipo Moyo", "Account payment received",
        f"Glen View Clinic Canteen: USD {total:.2f} by bank transfer for {len(due)} invoices", ref)


QUOTE_LINES = {
    "P1-C0009": [("P015", 60), ("P016", 48), ("P018", 200), ("P013", 24)],  # school tuck shop, monthly
    "P1-C0008": [("P001", 20), ("P002", 12), ("P013", 24)],  # the clinic, before it moved to an account
}
quotes_to_fill: dict[date, list[list]] = defaultdict(list)  # day accepted -> quote rows


def make_quote(day: date, customer: str, t: time, accept: bool, note: str = ""):
    """A quote for a regular customer, valid for 7 days. Accepted quotes are
    filled as a sale on a later day.
    """
    lines = [(pid, qty) for pid, qty in QUOTE_LINES[customer] if active_product(pid, day)]
    total = sum(unit_price(pid, day, "USD") * qty for pid, qty in lines)
    items = "; ".join(f"{PROD[pid][1]} x{qty} @ {unit_price(pid, day, 'USD'):.2f}" for pid, qty in lines)
    valid = day + timedelta(days=7)
    qid = next_id("P1", "Q", day)
    row = [qid, day, t, "P1", "Chipo Moyo", customer, CUST[customer][1], valid, "USD", items, total,
           "Expired" if valid < TODAY else "Open", "", "WhatsApp", note]
    quotes_m[f"{day:%Y-%m}"].append(row)
    log(day, t, "P1", "Chipo Moyo", "Quote shared", f"USD {total:.2f} to {CUST[customer][1]} on WhatsApp", qid)
    accepted_on = day + timedelta(days=crng.randint(1, 4))
    if accept and accepted_on < TODAY:
        quotes_to_fill[accepted_on].append(row)


def fill_quote(day: date, t: time, q: list):
    """Turns an accepted quote into a sale, short of anything out of stock."""
    lines = [(pid, qty) for pid, qty in QUOTE_LINES[q[5]] if active_product(pid, q[1])]
    short = [(pid, min(qty, stock[("Main", pid)])) for pid, qty in lines]
    sale = book_sale("P1", day, t, [(pid, qty) for pid, qty in short if qty > 0], "USD", "Chipo Moyo",
                     customer_id=q[5], note=f"From quote {q[0]}")
    q[11], q[12] = "Accepted", sale["id"]
    if short != lines:
        q[14] = "Part supplied: not enough stock on the day"
    elif sale["total"] != q[10]:
        q[14] = "Prices changed after the quote"
