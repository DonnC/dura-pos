# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Sales: when they happen, what's in the basket, how it's paid (cash with
change, mobile money, card, kept change, on account), returns, and the
fiscal fields each receipt gets once its phone is fiscalised.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal as D
from dura_templates.money import ceil_to, q2, round_to, split_proportionally
from dura_templates.sample.business import CALLBACKS_FROM, CUST, DEVICE_ID, FISCAL_FROM, KEPT_CHANGE_FROM, KEPT_CHANGE_LIMIT, MONEY_TYPE, ON_ACCOUNT_DAYS, PAYNOW_LIVE, PHONES, PROD, TAXES, active_product, keeps_change, pick_customer, price_cost
from dura_templates.sample.period import TODAY, crng, rng
from dura_templates.sample.rates import RATES, rate_for, unit_price
from dura_templates.sample.records import callbacks_y, drawer_out, items_m, kept, ledger, log, next_id, pays_m, sales_m, visible
from dura_templates.sample.stock import AVG_QTY, check_low, stock


counters = {ph: {"receipt": 0, "global": 0, "fday": 0} for ph in PHONES}
open_invoices: list[dict] = []  # invoices on account not yet paid
sales_by_phone_day: dict[tuple[str, date], list[dict]] = defaultdict(list)


def vcode() -> str:
    """A ZIMRA-style verification code, e.g. `4F2A-09BC-11D3-7E60`."""
    h = "".join(rng.choice("0123456789ABCDEF") for _ in range(16))
    return "-".join(h[i:i + 4] for i in range(0, 16, 4))


def sale_times(phone: str, day: date, n: int) -> list[time]:
    """When the day's `n` sales happen on `phone`: busier mid-morning and
    afternoon, never two in the same second (ZIMRA needs rising receipt times).
    """
    opens, closes = PHONES[phone][6], PHONES[phone][7]
    start = datetime.combine(day, opens)
    span = (datetime.combine(day, closes) - start).seconds - 600
    ts = sorted(start + timedelta(seconds=int(span * min(0.999, max(0, rng.betavariate(1.6, 1.4))))) for _ in range(n))
    # receipt times must strictly increase (ZIMRA RCPT030): never two in the same second
    for i in range(1, len(ts)):
        if ts[i] <= ts[i - 1]:
            ts[i] = ts[i - 1] + timedelta(seconds=1)
    return [x.time().replace(microsecond=0) for x in ts]


def pick_lines(phone: str, day: date, loc: str) -> list[tuple[str, int]]:
    """A random basket: 1 to 4 products in stock at `loc`, with quantities."""
    n = rng.choices([1, 2, 3, 4], [45, 30, 15, 10])[0]
    chosen: dict[str, int] = {}
    pool = [p for p in PROD if active_product(p, day) and stock[(loc, p)] > 0]
    if not pool:
        return []
    for _ in range(n):
        pid = rng.choices(pool, [PROD[p][9] for p in pool])[0]
        if pid == "P018":
            qty = rng.randint(2, 10)
        elif pid in AVG_QTY:
            qty = rng.choices([1, 2, 3], [70, 25, 5])[0]
        else:
            qty = rng.choices([1, 2], [90, 10])[0]
        qty = min(qty, stock[(loc, pid)] - chosen.get(pid, 0))
        if qty > 0:
            chosen[pid] = chosen.get(pid, 0) + qty
    return list(chosen.items())


def tender_cash(total: D, cur: str) -> D:
    """What a customer hands over: exact, the next whole note, or a larger note."""
    if cur == "USD":
        if total == total.to_integral_value() and rng.random() < 0.5:
            return total
        if rng.random() < 0.4:
            return ceil_to(total, D(1))
        return next(n for n in (D(1), D(2), D(5), D(10), D(20), D(50), D(100), D(200), D(500)) if n >= total)
    if rng.random() < 0.35:
        return ceil_to(total, D(5))
    notes = (D(10), D(20), D(50), D(100), D(200), D(500), D(1000), D(2000), D(5000))
    return next(n for n in notes if n >= total)


def add_payments(sale: dict, day: date, t: time, phone: str, seller: str, refund_of: dict | None = None) -> list[list]:
    """Payment rows for a sale (or a refund). Returns the rows; amounts in the
    sale currency sum exactly to the sale total."""
    cur, total = sale["currency"], sale["total"]
    zwg, zar = RATES[day]
    rows = []
    n = 0

    def row(kind, method, pcur, amount, rate, in_sale, status, provider="", ref="", confirmed=""):
        nonlocal n
        n += 1
        rows.append([f"{sale['id']}-{n}", sale["id"], day, t, phone, seller, kind, f"{method} {pcur}",
                     pcur, amount, rate, cur, in_sale, status, provider, ref, confirmed,
                     MONEY_TYPE[method]])

    def mobile(method, pcur, amount, rate, in_sale, kind="Payment"):
        live = day >= PAYNOW_LIVE
        provider = "Paynow" if live else ""
        confirmed = "Paynow (poll)" if live else "Manual (SMS checked)"
        if kind == "Payment" and rng.random() < 0.04:
            row(kind, method, pcur, amount, rate, D(0), rng.choice(["Failed", "Cancelled"]), provider,
                f"PN{rng.randint(10**7, 10**8 - 1)}" if live else "", confirmed)
        ref = f"PN{rng.randint(10**7, 10**8 - 1)}" if live else f"MP{rng.randint(10**5, 10**6 - 1)}"
        status = "Paid" if kind == "Payment" else "Refunded"
        row(kind, method, pcur, amount, rate, in_sale, status, provider, ref, confirmed)
        if live and kind == "Payment" and day >= CALLBACKS_FROM and visible(phone, day, t):
            received = datetime.combine(day, t) + timedelta(seconds=rng.randint(4, 40))
            callbacks_y[day.year].append([received, "Paynow", ref, amount, pcur, "Paid", "Yes", sale["id"],
                                          "Logged; till confirmed by poll", ""])
            if rng.random() < 0.05:
                callbacks_y[day.year].append([received + timedelta(seconds=rng.randint(30, 120)), "Paynow", ref,
                                              amount, pcur, "Paid", "Yes", sale["id"],
                                              "Duplicate (provider retry), ignored", ""])

    if refund_of is not None:
        # refund the same way the original was paid (first paid method)
        orig = next(p for p in refund_of["payments"] if p[13] == "Paid")
        method = orig[7].rsplit(" ", 1)[0]
        if method == "Cash":
            row("Refund", method, cur, total, D(1), total, "Refunded", confirmed="Cash from drawer")
        elif method in ("EcoCash", "InnBucks"):
            mobile(method, cur, total, D(1), total, kind="Refund")
        else:
            row("Refund", method, cur, total, D(1), total, "Refunded", orig[14],
                f"RF{rng.randint(10**5, 10**6 - 1)}", "Manual")
        return rows

    if sale.get("bank"):
        row("Payment", "Bank transfer", "USD", total, D(1), total, "Paid", "", f"EFT{rng.randint(10**5, 10**6 - 1)}",
            "Manual (bank SMS checked)")
        return rows
    if sale.get("due"):
        row("Payment", "On account", "USD", total, D(1), total, "On account", confirmed=f"Due {sale['due']:%Y-%m-%d}")
        return rows

    cust = sale.get("customer") if keeps_change(phone, sale.get("customer")) else ""
    if cust and cur == "USD" and kept[cust] > 0 and crng.random() < 0.6:
        use = min(kept[cust], total)
        row("Payment", "Kept change", "USD", use, D(1), use, "Paid", confirmed="Customer's kept change")
        kept[cust] -= use
        sale["kept_used"] = use
        total -= use
        if not total:
            return rows

    r = rng.random()
    if cur == "USD":
        if r < 0.03 and total >= 2:  # split: whole dollars cash, rest EcoCash ZWG
            cash = D(int(total))
            rest = total - cash
            row("Payment", "Cash", "USD", cash, D(1), cash, "Paid", confirmed="Cash count")
            mobile("EcoCash", "ZWG", q2(rest * zwg), zwg, rest)
            return rows
        methods = ["Cash", "EcoCash", "InnBucks"] + (["Card"] if PHONES[phone][1] == "Main" else [])
        weights = [70, 10, 12] + ([6] if PHONES[phone][1] == "Main" else [])
        method = rng.choices(methods, weights)[0]
    elif cur == "ZWG":
        method = rng.choices(["EcoCash", "Cash"], [75, 25])[0]
    else:
        method = "Cash"

    if method == "Cash":
        tendered = tender_cash(total, cur)
        row("Payment", "Cash", cur, tendered, D(1), tendered, "Paid", confirmed="Cash count")
        change = tendered - total
        if change:
            if cur == "USD" and change != change.to_integral_value():
                whole = D(int(change))
                if whole:
                    row("Change", "Cash", "USD", -whole, D(1), -whole, "Given", confirmed="Cash count")
                coins = change - whole
                if (cust and day >= KEPT_CHANGE_FROM and kept[cust] + coins <= KEPT_CHANGE_LIMIT
                        and crng.random() < 0.6):
                    row("Change kept", "Kept change", "USD", -coins, D(1), -coins, "Kept",
                        confirmed="Customer's kept change")
                    kept[cust] += coins
                    sale["kept"] = coins
                else:
                    row("Change", "Cash", "ZWG", -round_to(coins * zwg, D("0.5")), zwg, -coins, "Given",
                        confirmed="Cash count")
            else:
                row("Change", "Cash", cur, -change, D(1), -change, "Given", confirmed="Cash count")
    elif method == "Card":
        row("Payment", "Card", cur, total, D(1), total, "Paid", "Bank card machine", f"AUTH{rng.randint(10**5, 10**6 - 1)}",
            "Card machine slip")
    else:
        mobile(method, cur, total, D(1), total)
    return rows


def book_sale(phone: str, day: date, t: time, lines: list[tuple[str, int]], cur: str, seller: str,
              customer_id: str = "", bank: bool = False, on_account: bool = False, note: str = "") -> dict | None:
    """Records one sale: lines, totals and VAT, discounts, payments and change,
    stock movements, fiscal fields and Activity. Returns the sale, or None if
    nothing could be sold.
    """
    loc = PHONES[phone][1]
    gross = [unit_price(pid, day, cur) * qty for pid, qty in lines]
    subtotal = sum(gross)
    discount = D(0)
    if not customer_id and rng.random() < 0.02 and subtotal >= 1:
        pct = D("0.10") if rng.random() < 0.3 else D("0.05")
        discount = q2(subtotal * pct)
    alloc = split_proportionally(discount, gross) if discount else [D(0)] * len(lines)
    total = subtotal - discount
    customer_id = customer_id or pick_customer(phone, day)
    cust = CUST.get(customer_id)
    c = counters[phone]
    c["receipt"] += 1
    sale = {"id": next_id(phone, "S", day), "currency": cur, "total": total, "lines": [], "payments": [],
            "day": day, "time": t, "phone": phone, "bank": bank, "customer": customer_id,
            "due": day + timedelta(days=ON_ACCOUNT_DAYS) if on_account else None}
    vat_total = D(0)
    for i, ((pid, qty), g, a) in enumerate(zip(lines, gross, alloc), start=1):
        net = g - a
        tax = TAXES[PROD[pid][6]]
        vat = q2(net * tax["pct"] / (100 + tax["pct"])) if tax["pct"] else D(0)
        vat_total += vat
        sale["lines"].append((pid, qty, unit_price(pid, day, cur), net))
        cost = price_cost(pid, day)[1]
        items_row = [sale["id"], i, day, phone, loc, "Sale", pid, PROD[pid][1], qty, unit_price(pid, day, cur), cur,
                     a, net, f"{tax['name']} ({tax['code']})", vat, cost, q2(cost * qty)]
        if visible(phone, day, t):
            items_m[f"{day:%Y-%m}"].append(items_row)
        stock[(loc, pid)] -= qty
        check_low(day, t, phone, loc, pid)
    if discount and seller != "Chipo Moyo" and discount / subtotal > D("0.05"):
        log(day, t, phone, seller, "Discount over limit", f"{discount} {cur} on {sale['id']}", sale["id"], "Chipo Moyo")
    if keeps_change(phone, customer_id) and kept[customer_id] >= 1 and crng.random() < 0.15:
        # the customer takes their kept change as cash, out of this till
        out = kept[customer_id]
        kept[customer_id] = D(0)
        ledger(day, t, phone, seller, loc, "Change paid out", cash=-out, cur="USD", drawer="Yes",
               note="Kept change paid out in cash", party=customer_id, balance=-out)
        drawer_out[(phone, day)].append(("USD", -out))
        log(day, t, phone, seller, "Kept change paid out", f"USD {out:.2f} to {cust[1]}", customer_id,
            "" if seller == "Chipo Moyo" else "Chipo Moyo")
    pays = add_payments(sale, day, t, phone, seller)
    sale["payments"] = pays
    assert sum(p[12] for p in pays if p[13] in ("Paid", "Given", "Kept", "On account")) == total, sale["id"]
    if sale.get("kept_used"):
        ledger(day, t, phone, seller, loc, "Change used", cur="USD", ref=sale["id"],
               note="Kept change used to pay", party=customer_id, balance=-sale["kept_used"])
    if sale.get("kept"):
        ledger(day, t, phone, seller, loc, "Change kept", cur="USD", ref=sale["id"],
               note="Change kept for the customer; the cash stays in the till", party=customer_id, balance=sale["kept"])
    if on_account:
        ledger(day, t, phone, seller, loc, "Invoiced on account", cur=cur, ref=sale["id"],
               note=f"Due {sale['due']:%Y-%m-%d}", party=customer_id, balance=-total)
        open_invoices.append(sale)
    fiscal = fiscal_fields(phone, day, t)
    paid_by = " + ".join(dict.fromkeys(p[7] for p in pays if p[6] == "Payment" and p[13] in ("Paid", "On account")))
    change = " + ".join([f"{p[8]} {-p[9]:.2f}" for p in pays if p[6] == "Change"] +
                        [f"USD {sale['kept']:.2f} kept" for _ in [0] if sale.get("kept")])
    row = [sale["id"], day, t, phone, loc, seller, f"{phone}-{c['receipt']:07d}", "Invoice" if on_account else "Sale", "",
           cur, sum(q for _, q in lines), subtotal, discount, total, vat_total, paid_by, change,
           customer_id, cust[1] if cust else "", cust[5] if cust else "",
           *fiscal, "Unpaid" if on_account else "Paid", sale["due"], sync_time(phone, day, t), note,
           q2(total / rate_for(cur, day)), q2(vat_total / rate_for(cur, day))]
    if visible(phone, day, t):
        sales_m[f"{day:%Y-%m}"].append(row)
        pays_m[f"{day:%Y-%m}"].extend(pays)
    sale["row"] = row
    sales_by_phone_day[(phone, day)].append(sale)
    return sale


def sync_time(phone: str, day: date, t: time) -> datetime:
    """When the sale reached Drive: a few minutes after it was made."""
    return datetime.combine(day, t) + timedelta(minutes=rng.randint(1, 14))


fiscal_day_open: dict[str, dict] = {}


def fiscal_fields(phone: str, day: date, t: time) -> list:
    """The ZIMRA columns for a receipt: status, device, global and daily numbers,
    verification code. Opens the phone's fiscal day on its first receipt.
    """
    if day < FISCAL_FROM[phone]:
        return ["Not fiscalised", "", "", "", ""]
    fd = fiscal_day_open.get(phone)
    if fd is None or fd["date"] != day:
        c = counters[phone]
        c["fday"] += 1
        fd = {"date": day, "no": c["fday"], "opened": t, "receipts": 0}
        fiscal_day_open[phone] = fd
    fd["receipts"] += 1
    counters[phone]["global"] += 1
    status = "Submitted"
    if day == TODAY and t >= time(13, 50):
        status = "Queued"
    if phone == "P4" and day == date(2026, 7, 19) and fd["receipts"] == 3:
        status = "Submitted (Yellow: RCPT031)"
        log(day, t, phone, "Dura", "Receipt flagged by ZIMRA",
            "Yellow RCPT031: receipt date ahead of ZIMRA's clock. Accepted; phone clock corrected.")
    return [status, DEVICE_ID[phone], fd["no"], counters[phone]["global"], vcode()]


def book_return(phone: str, day: date, t: time, seller: str):
    # a recent fiscal sale from this phone, in USD or ZWG (the drawer always holds those)
    """Refunds a recent fiscal sale from this phone: a credit note, a refund
    payment and the stock back in.
    """
    recent = [s for (ph, d2), ss in sales_by_phone_day.items() if ph == phone and 0 <= (day - d2).days <= 3
              for s in ss if s["row"][7] == "Sale" and s["day"] >= FISCAL_FROM[phone]
              and s["currency"] in ("USD", "ZWG") and not s["bank"] and not s.get("kept_used")]
    if not recent:
        return
    orig = rng.choice(recent)
    pid, qty, price, net = orig["lines"][0]
    cur = orig["currency"]
    loc = PHONES[phone][1]
    unit_net = q2(net / qty)
    total = -unit_net
    reason = rng.choice(["Damaged item", "Expired", "Wrong item bought"])
    counters[phone]["receipt"] += 1
    sale = {"id": next_id(phone, "S", day), "currency": cur, "total": total, "lines": [], "payments": [],
            "day": day, "time": t, "phone": phone}
    tax = TAXES[PROD[pid][6]]
    vat = -q2(unit_net * tax["pct"] / (100 + tax["pct"])) if tax["pct"] else D(0)
    pays = add_payments(sale, day, t, phone, seller, refund_of=orig)
    assert sum(p[12] for p in pays) == total
    fiscal = fiscal_fields(phone, day, t)
    row = [sale["id"], day, t, phone, loc, seller, f"{phone}-{counters[phone]['receipt']:07d}", "Return",
           orig["id"], cur, -1, total, D(0), total, vat, pays[0][7], "", *orig["row"][17:20], *fiscal,
           "Refunded", None, sync_time(phone, day, t), reason, q2(total / rate_for(cur, day)), q2(vat / rate_for(cur, day))]
    if visible(phone, day, t):
        sales_m[f"{day:%Y-%m}"].append(row)
        items_m[f"{day:%Y-%m}"].append([sale["id"], 1, day, phone, loc, "Return", pid, PROD[pid][1], -1, price, cur,
                                        D(0), total, f"{tax['name']} ({tax['code']})", vat,
                                        price_cost(pid, day)[1], -price_cost(pid, day)[1]])
        pays_m[f"{day:%Y-%m}"].extend(pays)
    sale["row"] = row
    sale["payments"] = pays
    sale["bank"] = False
    sales_by_phone_day[(phone, day)].append(sale)
    stock[(loc, pid)] += 1
    ledger(day, t, phone, seller, loc, "Returned", pid, 1, ref=sale["id"], note=reason)
    if reason != "Wrong item bought":
        stock[(loc, pid)] -= 1
        ledger(day, t, phone, seller, loc, "Written off", pid, -1, ref=sale["id"], note=reason)
    log(day, t, phone, seller, "Refund", f"{-total} {cur}: {PROD[pid][1]} ({reason})", sale["id"],
        "" if seller == "Chipo Moyo" else "Chipo Moyo")
