# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Runs the shop day by day from START to TODAY, filling `records`.
"""

from __future__ import annotations

import math
from datetime import date, datetime, time, timedelta
from decimal import Decimal as D
from dura_templates.money import q2
from dura_templates.sample.accounts import fill_quote, make_quote, quotes_to_fill, settle_invoices
from dura_templates.sample.business import ON_ACCOUNT_FROM, PHONES, PROD, QUOTES_FROM, active_product, phones_on, price_cost, seller_for
from dura_templates.sample.day_end import CLOSE_OVERRIDE, close_day, close_time, fiscal_day_today, last_weekday, stock_count
from dura_templates.sample.period import START, TODAY, crng, rng
from dura_templates.sample.rates import RATES
from dura_templates.sample.records import closing_2025, ledger, log, rates_rows_y, visible, with_providers
from dura_templates.sample.sales import book_return, book_sale, pick_lines, sale_times
from dura_templates.sample.stock import daily_demand, pay_bakery, restock, stock


def simulate() -> None:
    """Opening stock, then every day: rates, restocking, invoices, quotes,
    sales on each phone, cash-ups, banking and stock counts. Call once.
    """
    for pid in PROD:  # opening stock on 1 December 2025 (first count)
        if active_product(pid, START):
            qty = math.ceil(daily_demand(pid, "Main", START) * 6) + PROD[pid][8] * 2
            stock[("Main", pid)] = qty
            ledger(START, time(6, 12), "P1", "Chipo Moyo", "Main", "Opening", pid, qty, ref="OPEN-2025", note="First stock count")

    day = START
    while day <= TODAY:
        if day == date(2026, 1, 1):
            # year end: closing stock 2025 becomes opening stock 2026
            for (loc, pid), qty in sorted(stock.items()):
                if qty:
                    cost = price_cost(pid, date(2025, 12, 31))[1]
                    closing_2025.append([pid, PROD[pid][1], loc, qty, cost, q2(cost * qty)])
                    ledger(day, time(0, 0), "P1", "Dura", loc, "Opening", pid, qty, ref="CLOSE-2025",
                           note="Closing stock of 2025")
        for phone, (_, loc, joined, _, _, _, opens, _, float_) in PHONES.items():
            if joined == day:  # a new till starts with its float, from the owner
                for cur, amount in float_.items():
                    if amount:
                        ledger(day, opens, phone, "Chipo Moyo", loc, "Float added", cash=amount, cur=cur, drawer="No",
                               note="Starting cash for this till")
        zwg, zar = RATES[day]
        rates_rows_y[day.year].append([day, time(6, 2), "All day", zwg, zar, "Chipo Moyo", "Owner (street rate checked)", ""])
        log(day, time(6, 2), "P1", "Chipo Moyo", "Exchange rate set", f"1 USD = {zwg} ZWG = {zar} ZAR")
        if day == date(2026, 5, 1):
            left = stock[("Main", "P027")]
            if left:
                stock[("Main", "P027")] = 0
                ledger(day, time(6, 30), "P1", "Chipo Moyo", "Main", "Written off", "P027", -left, note="Seasonal item stopped")
        restock(day)
        settle_invoices(day)
        if day >= QUOTES_FROM and day.weekday() == 0 and day.day <= 7:
            make_quote(day, "P1-C0009", time(8, 30), accept=crng.random() < 0.75)
        if day == date(2026, 5, 20):
            make_quote(day, "P1-C0008", time(11, 0), accept=False, note="The clinic chose an account from June instead")
        for phone in phones_on(day):
            _, loc, _, _, mean, sunday, opens, _, _ = PHONES[phone]
            if day.weekday() == 6 and not sunday:
                continue
            seller = seller_for(phone, day)
            if visible(phone, day, opens):
                log(day, opens, phone, seller, "Signed in", "PIN" if seller != "Chipo Moyo" else "Owner PIN")
            mult = 1.0
            if day.weekday() == 5:
                mult *= 1.2
            if day.day >= 25:
                mult *= 1.25
            if date(2025, 12, 20) <= day <= date(2025, 12, 24):
                mult *= 1.4
            if day in (date(2025, 12, 25), date(2026, 1, 1)):
                mult *= 0.3
            n = max(0, round(rng.gauss(mean * mult, mean * 0.2)))
            times = sale_times(phone, day, n)
            if day == TODAY:
                times = [t for t in times if t <= time(14, 30)]
            if (phone, day) in CLOSE_OVERRIDE:
                times = [t for t in times if t < time(16, 25)]
            # Every receipt is issued in time order, so a phone's fiscal numbers and
            # receipt times rise together. The weekly business customer is one more
            # event at 09:15; a return goes between a sale and the next one.
            events = [(t, "sale") for t in times]
            if phone == "P1" and day.weekday() == 2 and day >= date(2026, 2, 1) and time(9, 15) not in times:
                events.append((time(9, 15), "clinic"))
            if phone == "P1" and day in quotes_to_fill:
                tq = time(10, 5)
                while tq in times or tq == time(9, 15):
                    tq = (datetime.combine(day, tq) + timedelta(seconds=1)).time()
                events.append((tq, "quote"))
            events.sort()
            for i, (t, kind) in enumerate(events):
                if kind == "clinic":
                    lines = [(pid, q) for pid, q in (("P001", 10), ("P002", 6)) if stock[("Main", pid)] >= q]
                    if lines:
                        on_account = day >= ON_ACCOUNT_FROM
                        book_sale("P1", day, t, lines, "USD", "Chipo Moyo", customer_id="P1-C0008",
                                  bank=not on_account, on_account=on_account)
                    continue
                if kind == "quote":
                    for q in quotes_to_fill.pop(day):
                        fill_quote(day, t, q)
                    continue
                lines = pick_lines(phone, day, loc)
                if not lines:
                    continue
                if loc == "Mbare":
                    cur = rng.choices(["USD", "ZWG", "ZAR"], [62, 30, 8])[0]
                else:
                    cur = rng.choices(["USD", "ZWG", "ZAR"], [72, 26, 2])[0]
                book_sale(phone, day, t, lines, cur, seller)
                if rng.random() < 0.004:
                    t_next = events[i + 1][0] if i + 1 < len(events) else close_time(phone, day)
                    gap = (datetime.combine(day, t_next) - datetime.combine(day, t)).seconds
                    if gap >= 2:
                        t_ret = (datetime.combine(day, t) + timedelta(seconds=gap // 2)).time()
                        book_return(phone, day, t_ret, seller)
                if seller != "Chipo Moyo" and rng.random() < 0.01:
                    log(day, t, phone, seller, "Line removed", "A line was removed before payment")
        for phone in phones_on(day):
            if day.weekday() == 6 and not PHONES[phone][5]:
                continue
            close_day(phone, day)
        if day == TODAY:
            for phone in phones_on(day):
                fiscal_day_today(phone)
        pay_bakery(day)
        # weekly banking on Monday
        if day.weekday() == 0 and day != START:
            for (kind, cur), amount in sorted(with_providers.items()):
                if amount > 0:
                    ledger(day, time(10, 30), "P1", "Chipo Moyo", "Main", kind, cash=-amount, cur=cur, drawer="No",
                           ref=f"MV-{day:%y%m%d}", note="The week's payments, moved by the owner")
                    with_providers[(kind, cur)] = D(0)
            banked = D(rng.randint(15, 30) * 2)
            ledger(day, time(11, 0), "P1", "Chipo Moyo", "Main", "Banked", cash=-banked, cur="USD", drawer="No",
                   ref=f"BNK-{day:%y%m%d}", note="Cash deposited at the bank")
        # monthly stock counts
        if day < TODAY:
            if day == last_weekday(day.year, day.month, 6):
                stock_count(day, "Main", "P1", "Chipo Moyo")
            if "P3" in phones_on(day) and day == last_weekday(day.year, day.month, 5):
                stock_count(day, "Mbare", "P3", "Farai Dube")
        day += timedelta(days=1)

    for (loc, pid), qty in stock.items():
        assert qty >= 0, (loc, pid, qty)
