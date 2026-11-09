# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Stock: demand per product, purchases from suppliers, restocking, moves
between locations and low-stock alerts.
"""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import date, time, timedelta
from decimal import Decimal as D
from dura_templates.money import q2
from dura_templates.sample.business import PHONES, PROD, SUP, SUPPLIER_FOR, TAXES, active_product, phones_on, price_cost
from dura_templates.sample.period import crng
from dura_templates.sample.rates import rate_for
from dura_templates.sample.records import drawer_out, ledger, log, next_id, purchases_y, visible


stock: dict[tuple[str, str], int] = defaultdict(int)
low_alerted: set[tuple[str, str, date]] = set()

PICKS_PER_SALE = 1.9
AVG_QTY = {"P018": 6.0, "P001": 1.3, "P011": 1.4, "P013": 1.3, "P015": 1.5}


def daily_demand(pid: str, loc: str, day: date) -> float:
    """Expected units of `pid` sold at `loc` on `day`, from each phone's sales
    volume and the product's share of picks.
    """
    sales = sum(PHONES[ph][4] for ph in phones_on(day) if PHONES[ph][1] == loc)
    weights = sum(PROD[p][9] for p in PROD if active_product(p, day))
    return sales * PICKS_PER_SALE * PROD[pid][9] / weights * AVG_QTY.get(pid, 1.1) if weights else 0


unpaid_bakery: list[list] = []  # Purchases rows still owed to the bakery


def purchase(day: date, t: time, phone: str, who: str, loc: str, sup: str, lines: list[tuple[str, int]],
             paid: str, note: str = "") -> str:
    """A delivery from a supplier: one Purchases row, Stock in rows, and what's owed.
    `paid` is "Owner" (the owner's own cash), "Drawer" (from this phone's till) or "On account"."""
    lines = [(pid, qty) for pid, qty in lines if qty > 0]
    if not lines:
        return ""
    bid = next_id(phone, "B", day)
    inv_no = f"{SUP[sup][1].split()[0][:3].upper()}-{crng.randint(10000, 99999)}"
    total = vat = D(0)
    for pid, qty in lines:
        cost = price_cost(pid, day)[1]
        value = q2(cost * qty)
        total += value
        pct = TAXES[PROD[pid][6]]["pct"]
        if pct:
            vat += q2(value * pct / (100 + pct))
        stock[(loc, pid)] += qty
        ledger(day, t, phone, who, loc, "Stock in", pid, qty, ref=bid, note=f"{SUP[sup][1]} invoice {inv_no}", party=sup)
    ledger(day, t, phone, who, loc, "Purchase", cur="USD", ref=bid, note=f"Invoice {inv_no}, {len(lines)} products",
           party=sup, balance=total)
    if paid != "On account":
        ledger(day, t, phone, who, loc, "Supplier paid", cash=-total, cur="USD", drawer="Yes" if paid == "Drawer" else "No",
               ref=bid, note="Paid on delivery from the till" if paid == "Drawer" else "Paid by the owner",
               party=sup, balance=-total)
        if paid == "Drawer":
            drawer_out[(phone, day)].append(("USD", -total))
    row = [bid, day, t, phone, loc, sup, SUP[sup][1], inv_no, len(lines), "USD", total, vat,
           {"Owner": "Owner's cash", "Drawer": "From the till", "On account": "On account"}[paid],
           "Unpaid" if paid == "On account" else "Paid", None if paid == "On account" else day,
           f"{day:%Y}/Supplier invoices/{bid}.jpg" if sup == "P1-C0003" else "", who, note, q2(vat / rate_for("USD", day))]
    if visible(phone, day, t):
        purchases_y[day.year].append(row)
    if paid == "On account":
        unpaid_bakery.append(row)
    return bid


def pay_bakery(day: date):
    """The owner pays the bakery every Saturday and on the last day of the month."""
    owed = [r for r in unpaid_bakery if r[1] <= day]
    if not owed or not (day.weekday() == 5 or (day + timedelta(days=1)).day == 1):
        return
    total = sum(r[10] for r in owed)
    t = time(18, 0)
    ref = f"PAY-{day:%y%m%d}-BAKERY"
    ledger(day, t, "P1", "Chipo Moyo", "Main", "Supplier paid", cash=-total, cur="USD", drawer="No", ref=ref,
           note=f"Cash to Glen View Bakery for {len(owed)} deliveries", party="P1-C0001", balance=-total)
    log(day, t, "P1", "Chipo Moyo", "Supplier paid", f"Glen View Bakery: USD {total:.2f} for {len(owed)} deliveries", ref)
    for r in owed:
        r[13], r[14] = "Paid", day  # the owner's phone updates the payment status cells
        unpaid_bakery.remove(r)


def move(day: date, t: time, pid: str, qty: int, ref: str):
    """Moves stock from the main shop to the Mbare stall: one row out, one row in."""
    if qty <= 0:
        return
    stock[("Main", pid)] -= qty
    stock[("Mbare", pid)] += qty
    ledger(day, t, "P1", "Chipo Moyo", "Main", "Moved out", pid, -qty, ref=ref, note="To Mbare stall")
    ledger(day, t, "P3", "Farai Dube", "Mbare", "Moved in", pid, qty, ref=ref, note="From main shop")


def restock(day: date):
    """The day's deliveries: bread and milk daily, the wholesaler weekly, and moves
    to Mbare when its stock runs low.
    """
    main_open = "P1" in phones_on(day)
    mbare_open = "P3" in phones_on(day)
    # daily bread (on account) and milk (cash on delivery)
    if main_open:
        for pid in ("P001", "P002"):
            target = math.ceil(daily_demand(pid, "Main", day) * 1.3) + PROD[pid][8]
            purchase(day, time(6, 0), "P1", "Chipo Moyo", "Main", SUPPLIER_FOR[pid], [(pid, target - stock[("Main", pid)])],
                     "On account" if pid == "P001" else "Owner")
    if mbare_open and day.weekday() != 6:  # the stall is closed on Sundays
        for pid in ("P001", "P002"):
            target = math.ceil(daily_demand(pid, "Mbare", day) * 1.3) + PROD[pid][8]
            purchase(day, time(6, 40), "P3", "Farai Dube", "Mbare", SUPPLIER_FOR[pid], [(pid, target - stock[("Mbare", pid)])],
                     "On account" if pid == "P001" else "Drawer")
    weekday = day.weekday()
    # Monday wholesale run for the main shop, covering the Mbare stall too; Thursday top-up
    if main_open and weekday in (0, 3):
        buy = []
        for pid in PROD:
            if PROD[pid][10] or not active_product(pid, day):
                continue
            if pid == "P027" and day >= date(2026, 4, 1):
                continue  # winter: stop buying ice lollies
            need = daily_demand(pid, "Main", day) + daily_demand(pid, "Mbare", day)
            target = math.ceil(need * 8) + PROD[pid][8] * 2
            if weekday == 3 and stock[("Main", pid)] > PROD[pid][8] * 2:
                continue
            qty = target - stock[("Main", pid)]
            if qty > 0:
                buy.append((pid, qty))
        ref = purchase(day, time(7, 30), "P1", "Chipo Moyo", "Main", "P1-C0003", buy, "Owner", "Photo of the invoice saved")
        if ref:
            log(day, time(7, 45), "P1", "Chipo Moyo", "Stock received", f"{len(buy)} products from Harare Cash & Carry", ref)
            ledger(day, time(7, 50), "P1", "Chipo Moyo", "Main", "Expense", cash=D("-3.00"), cur="USD",
                   drawer="No", ref=ref, note="Transport for stock")
    # Tuesday and Friday: move stock to the Mbare stall
    if mbare_open and weekday in (1, 4):
        ref = f"MV-{day:%y%m%d}"
        moved = 0
        for pid in PROD:
            if PROD[pid][10] or not active_product(pid, day):
                continue
            target = math.ceil(daily_demand(pid, "Mbare", day) * 4) + PROD[pid][8]
            qty = min(target - stock[("Mbare", pid)], stock[("Main", pid)] - PROD[pid][8])
            if qty > 0:
                move(day, time(6, 50), pid, qty, ref)
                moved += 1
        if moved:
            log(day, time(7, 0), "P1", "Chipo Moyo", "Stock moved", f"{moved} products to Mbare stall", ref)


def check_low(day: date, t: time, phone: str, loc: str, pid: str):
    """Logs one stock alert a day when a product falls to its low-stock level."""
    level = stock[(loc, pid)]
    if level <= PROD[pid][8] and (loc, pid, day) not in low_alerted:
        low_alerted.add((loc, pid, day))
        state = "Out of stock" if level <= 0 else f"Low stock ({level} left)"
        log(day, t, phone, "Dura", "Stock alert", f"{state}: {PROD[pid][1]} at {loc}")
