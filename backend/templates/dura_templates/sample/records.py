# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The rows the simulation produces, and the helpers that add them.

Each collection is keyed by month ("2026-10") or year (2026) and holds the
rows of one tab. IDs follow `<phone>-<kind><yymmdd>-<seq>` (note 04). A row
exists only once its phone has synced (`visible`).
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, time
from decimal import Decimal as D
from dura_templates.money import q2
from dura_templates.sample.business import CUST, LAST_SYNC_TODAY, PC, PROD, SUP, price_cost
from dura_templates.sample.period import TODAY
from dura_templates.sample.rates import rate_for


sales_m = defaultdict(list)  # "2026-10" -> rows
items_m = defaultdict(list)
pays_m = defaultdict(list)
cashups_m = defaultdict(list)
fdays_m = defaultdict(list)
stock_ledger_y = defaultdict(list)  # 2026 -> rows
money_ledger_y = defaultdict(list)
activity_y = defaultdict(list)
counts_y = defaultdict(list)
callbacks_y = defaultdict(list)
rates_rows_y = defaultdict(list)
purchases_y = defaultdict(list)
quotes_m = defaultdict(list)
closing_2025 = []
kept = defaultdict(D)  # customer -> USD kept change the shop owes them
drawer_out: dict[tuple[str, date], list[tuple[str, D]]] = defaultdict(list)  # paid from a till before cash-up

seq = defaultdict(int)


def next_id(phone: str, kind: str, day: date) -> str:
    """The next readable ID for this phone, kind and day: `P1-S261028-0031`."""
    key = (phone, kind, day)
    seq[key] += 1
    return f"{phone}-{kind}{day:%y%m%d}-{seq[key]:04d}"


def visible(phone: str, day: date, t: time) -> bool:
    """Rows reach Drive only once their phone has synced."""
    return day < TODAY or t <= LAST_SYNC_TODAY.get(phone, time(23, 59))


def log(day: date, t: time, phone: str, who: str, action: str, details: str = "", ref: str = "", approved: str = ""):
    """Adds an Activity row (who did what, and who approved it), if its phone has
    synced it.
    """
    if not visible(phone, day, t):
        return
    role = "Owner" if who == "Chipo Moyo" else ("Seller" if who in {"Rudo Chari", "Farai Dube", "Tendai Ncube"} else "App")
    activity_y[day.year].append([next_id(phone, "A", day), day, t, phone, who, role, action, details, ref, approved])


def party_name(party: str) -> str:
    """The name of a customer or supplier ID, or empty."""
    return (CUST.get(party) or SUP.get(party) or ("", ""))[1]


def ledger(day: date, t: time, phone: str, who: str, loc: str, typ: str, pid: str = "", qty: int | None = None,
           cash: D | None = None, cur: str = "", drawer: str = "", ref: str = "", note: str = "",
           party: str = "", balance: D | None = None):
    """One row in the Stock Ledger (when there's a product) or the Money Ledger.
    `balance` is the change in what the shop owes `party`: positive when the shop
    owes them more, negative when they owe the shop more."""
    if not visible(phone, day, t):
        return
    if pid:
        cost = price_cost(pid, day)[1]
        stock_ledger_y[day.year].append([
            next_id(phone, "L", day), day, t, phone, who, loc, typ, pid, PROD[pid][1], qty, cost, q2(cost * qty), PC,
            party, party_name(party), ref, note,
        ])
    else:
        money_ledger_y[day.year].append([
            next_id(phone, "M", day), day, t, phone, who, loc, typ, cur, cash,
            q2(cash / rate_for(cur, day)) if cash is not None else None, drawer, party, party_name(party),
            balance, ref, note,
        ])
