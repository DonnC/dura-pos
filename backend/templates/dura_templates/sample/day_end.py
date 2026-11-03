# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The end of each day: cash-ups per phone and currency, fiscal days, and the
monthly stock counts.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal as D
from dura_templates.money import q2
from dura_templates.sample.business import DEVICE_ID, LAST_SYNC_TODAY, PHONES, PROD, active_product, price_cost, seller_for
from dura_templates.sample.period import TODAY, rng
from dura_templates.sample.records import cashups_m, counts_y, drawer_out, fdays_m, ledger, log, visible
from dura_templates.sample.sales import fiscal_day_open, sales_by_phone_day
from dura_templates.sample.stock import stock


CLOSE_OVERRIDE = {("P2", date(2026, 5, 19)): time(16, 30)}  # screen broke; cashed up early


def close_time(phone: str, day: date) -> time:
    """When `phone` closes on `day`: its usual time, or an override."""
    return CLOSE_OVERRIDE.get((phone, day), PHONES[phone][7])


def close_day(phone: str, day: date):
    """Cash-up for a phone's day: expected cash per currency against counted, with
    the drawer's expenses and kept change; and its fiscal day's Z totals.
    """
    sales = sales_by_phone_day.get((phone, day), [])
    loc = PHONES[phone][1]
    seller = seller_for(phone, day)
    closes = close_time(phone, day)
    # drawer expenses
    expenses = []
    if phone == "P3":
        expenses.append(("USD", D("-1.00"), "Market levy"))
    for cur, amount, note in expenses:
        ledger(day, time(12, 0), phone, seller, loc, "Expense", cash=amount, cur=cur, drawer="Yes", note=note)
    # Sold rows: one per product per phone per sync batch. The sample uses one
    # batch per day; today's batch is the phone's last sync.
    batch_time = LAST_SYNC_TODAY[phone] if day == TODAY else closes
    sold = defaultdict(int)
    for s in sales:
        if s["row"][7] != "Return" and (day < TODAY or s["time"] <= batch_time):
            for pid, qty, _, _ in s["lines"]:
                sold[pid] += qty
    for pid in sorted(sold):
        ledger(day, batch_time, phone, seller, loc, "Sold", pid, -sold[pid], ref=f"{phone}-{day:%y%m%d}",
               note="Sales synced in this batch")
    if day == TODAY:
        return  # still trading
    # cash-up
    flt = PHONES[phone][8]
    expected = {c: flt[c] for c in ("USD", "ZWG", "ZAR")}
    mobile = defaultdict(D)
    for s in sales:
        for p in s["payments"]:
            if p[13] in ("Failed", "Cancelled", "Kept"):
                continue
            method = p[7].rsplit(" ", 1)[0]
            if method == "Cash":
                expected[p[8]] += p[9]
            else:
                mobile[p[7]] += p[9]
    for cur, amount, _ in expenses:
        expected[cur] += amount
    for cur, amount in drawer_out.get((phone, day), []):  # supplier on delivery, kept change paid out
        expected[cur] += amount
    kept_today = sum((p[12] for s in sales for p in s["payments"] if p[13] == "Kept"), D(0))
    counted = dict(expected)
    if rng.random() < 0.08:
        counted["USD"] += rng.choice([D("-1"), D("-0.5"), D("0.5"), D("-2")])
    if rng.random() < 0.10:
        counted["ZWG"] += rng.choice([D(-10), D(-5), D(5), D(-20)])
    diffs = {c: counted[c] - expected[c] for c in counted}
    n_sales = sum(1 for s in sales if s["row"][7] != "Return")
    n_ret = sum(1 for s in sales if s["row"][7] == "Return")
    note = "" if not any(diffs.values()) else "Difference noted by owner"
    cashups_m[f"{day:%Y-%m}"].append([
        day, phone, loc, seller, flt["USD"], flt["ZWG"], flt["ZAR"],
        expected["USD"], counted["USD"], diffs["USD"], expected["ZWG"], counted["ZWG"], diffs["ZWG"],
        expected["ZAR"], counted["ZAR"], diffs["ZAR"],
        mobile["EcoCash USD"], mobile["EcoCash ZWG"], mobile["InnBucks USD"], mobile["Card USD"],
        mobile["Bank transfer USD"], -kept_today, mobile["Kept change USD"], n_sales, n_ret, closes, note,
    ])
    log(day, closes, phone, seller, "Cash-up",
        f"USD {counted['USD']:.2f}, ZWG {counted['ZWG']:.2f}, ZAR {counted['ZAR']:.2f}" +
        (f"; difference USD {diffs['USD']:+.2f} ZWG {diffs['ZWG']:+.2f}" if any(diffs.values()) else ""))
    t_take = (datetime.combine(day, closes) + timedelta(minutes=5)).time()
    for cur in ("USD", "ZWG", "ZAR"):
        take = counted[cur] - flt[cur]
        if take > 0:
            ledger(day, t_take, phone, seller, loc, "Takings collected", cash=-take, cur=cur, drawer="Yes",
                   note="Handed to owner after cash-up")
    # fiscal day
    fd = fiscal_day_open.get(phone)
    if fd and fd["date"] == day:
        tot = defaultdict(D)
        vat = defaultdict(D)
        cn = 0
        for s in sales:
            if s["row"][20] == "Not fiscalised":
                continue
            tot[s["currency"]] += s["total"]
            vat[s["currency"]] += s["row"][14]
            cn += s["row"][7] == "Return"
        fdays_m[f"{day:%Y-%m}"].append([
            phone, DEVICE_ID[phone], fd["no"], day, fd["opened"], closes, fd["receipts"], cn,
            tot["USD"], tot["ZWG"], tot["ZAR"], vat["USD"], vat["ZWG"], vat["ZAR"], "Closed", "Z report accepted by ZIMRA",
        ])
        log(day, closes, phone, "Dura", "Fiscal day closed", f"Day {fd['no']}, {fd['receipts']} receipts", f"FD-{DEVICE_ID[phone]}-{fd['no']}")
    log(day, (datetime.combine(day, closes) + timedelta(minutes=10)).time(), phone, "Dura", "Backup",
        "Daily backup saved to Google Drive (hidden app data)")


def fiscal_day_today(phone: str):
    """Shows today's still-open fiscal day for `phone`, with what has synced so far."""
    fd = fiscal_day_open.get(phone)
    if not fd or fd["date"] != TODAY:
        return
    sales = sales_by_phone_day.get((phone, TODAY), [])
    shown = [s for s in sales if visible(phone, TODAY, s["time"])]
    tot = defaultdict(D)
    vat = defaultdict(D)
    for s in shown:
        tot[s["currency"]] += s["total"]
        vat[s["currency"]] += s["row"][14]
    fdays_m[f"{TODAY:%Y-%m}"].append([
        phone, DEVICE_ID[phone], fd["no"], TODAY, fd["opened"], None, len(shown),
        sum(1 for s in shown if s["row"][7] == "Return"), tot["USD"], tot["ZWG"], tot["ZAR"],
        vat["USD"], vat["ZWG"], vat["ZAR"], "Open", f"Up to last sync at {LAST_SYNC_TODAY[phone]:%H:%M}",
    ])





def last_weekday(year: int, month: int, weekday: int) -> date:
    """The last given weekday (0 is Monday) of a month: when stock is counted."""
    d2 = date(year, month, 28) + timedelta(days=4)
    d2 = d2.replace(day=1) - timedelta(days=1)
    while d2.weekday() != weekday:
        d2 -= timedelta(days=1)
    return d2


def stock_count(day: date, loc: str, phone: str, who: str):
    """A monthly stock count at `loc`: counted against the ledger, with any
    difference posted as an adjustment.
    """
    cid = f"CNT-{day:%y%m%d}-{loc.upper()}"
    t = time(20, 30) if loc == "Main" else time(18, 20)
    changed = 0
    for pid in PROD:
        if not active_product(pid, day):
            continue
        expected = stock[(loc, pid)]
        diff = 0
        if expected > 0 and rng.random() < 0.15:
            diff = -rng.randint(5, 12) if pid == "P018" else -1
        counted = expected + diff
        cost = price_cost(pid, day)[1]
        counts_y[day.year].append([cid, day, loc, who, pid, PROD[pid][1], expected, counted, diff, cost,
                                   q2(cost * diff), "Posted", "Chipo Moyo"])
        if diff:
            stock[(loc, pid)] = counted
            ledger(day, t, phone, who, loc, "Counted", pid, diff, ref=cid, note=f"Expected {expected}, counted {counted}")
            changed += 1
    log(day, t, phone, who, "Stock count posted", f"{loc}: {changed} differences", cid,
        "" if who == "Chipo Moyo" else "Chipo Moyo")
