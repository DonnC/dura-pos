# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The `(TEST)` shop: a separate folder with `T-` IDs, showing that test mode
never touches live files.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, time
from openpyxl import Workbook
from dura_templates.files.month_file import write_month
from dura_templates.files.my_shop_content import product_rows
from dura_templates.money import q2
from dura_templates.profile import PC
from dura_templates.sample.business import BUSINESS, PROD, active_product, price_cost, test_dir
from dura_templates.sample.records import items_m, pays_m, sales_m
from dura_templates.sample.sales import vcode
from dura_templates.sample.stock import stock
from dura_templates.workbook.accounts import stock_posting
from dura_templates.workbook.headers import H_LEDGER, H_PRODUCTS
from dura_templates.workbook.tables import add_table, readme


def to_test(value):
    """Gives an ID the test prefix: `P1-S…` becomes `T-P1-S…`."""
    return f"T-{value}" if isinstance(value, str) and value[:1] == "P" and "-" in value else value


def write_test_shop():
    """A morning of practice on P4 (27 Oct 2026), kept in its own folder with T- IDs."""
    day = date(2026, 10, 27)
    src = [s_ for s_ in sales_m[f"{day:%Y-%m}"] if s_[3] == "P4" and s_[1] == day and s_[7] == "Sale"][:12]
    ids = {s_[0] for s_ in src}
    sales, items, pays = [], [], []
    for n, s_ in enumerate(src, start=1):
        row = list(s_)
        row[0], row[6] = to_test(row[0]), f"T-{row[6]}"
        row[17:20] = ["", "", ""]  # practice sales have no real customers
        row[20:25] = ["Submitted (ZIMRA test environment)", 91404, 1, n, vcode()]
        row[28] = "Test mode"
        sales.append(row)
    for i in items_m[f"{day:%Y-%m}"]:
        if i[0] in ids:
            items.append([to_test(i[0]), *i[1:]])
    for p_ in pays_m[f"{day:%Y-%m}"]:
        if p_[1] in ids:
            row = [to_test(p_[0]), to_test(p_[1]), *p_[2:]]
            if row[14] == "Paynow":
                row[14], row[16] = "ZB SmilePay (sandbox)", "Shop Hub (sandbox poll)"
                row[7] = row[7].replace("EcoCash", "SmilePay")
            pays.append(row)
    activity = [[f"T-P4-A{day:%y%m%d}-{k:04d}", day, t, "P4", who, role, action, details, "", ""]
                for k, (t, who, role, action, details) in enumerate([
                    (time(5, 40), "Chipo Moyo", "Owner", "Test mode on", "Owner PIN"),
                    (time(5, 41), "Dura", "App", "Test shop refreshed", "Products, contacts, staff and settings copied from the live shop"),
                    (time(5, 45), "Dura", "App", "Fiscalisation", "ZIMRA test environment, test device 91404; fiscal day 1 opened"),
                    (time(6, 20), "Tendai Ncube", "Seller", "Practice finished", f"{len(sales)} practice sales"),
                    (time(6, 25), "Chipo Moyo", "Owner", "Test mode off", "Back to live")], start=1)]
    write_month(f"{day:%Y-%m}", {"sales": sales, "items": items, "pays": pays, "cashups": [], "fdays": [],
                                 "quotes": [], "activity": activity}, folder=test_dir(), test=True)
    # the test shop's own My Shop: master data copied from live, its own stock ledger
    wb = Workbook()
    add_table(wb, "Products", H_PRODUCTS, product_rows(), first=True, kind="owner")
    sold = defaultdict(int)
    for i in items:
        sold[i[6]] += i[8]
    ledger_rows = []
    k = 0
    for pid in PROD:
        if active_product(pid, day):
            k += 1
            qty = stock[("Main", pid)] + sold[pid]
            cost = price_cost(pid, day)[1]
            ledger_rows.append([f"T-P4-L{day:%y%m%d}-{k:04d}", day, time(5, 41), "P4", "Dura", "Main", "Opening", pid,
                                PROD[pid][1], qty, cost, q2(cost * qty), PC, "", "", "TEST-START", "Copied from the live stock",
                                *stock_posting("Opening", q2(cost * qty))])
    for pid, qty in sorted(sold.items()):
        k += 1
        cost = price_cost(pid, day)[1]
        ledger_rows.append([f"T-P4-L{day:%y%m%d}-{k:04d}", day, time(6, 20), "P4", "Tendai Ncube", "Main", "Sold", pid,
                            PROD[pid][1], -qty, cost, q2(cost * -qty), PC, "", "", "T-P4-261027", "Practice sales",
                            *stock_posting("Sold", q2(cost * -qty))])
    add_table(wb, "Stock Ledger", H_LEDGER, ledger_rows)
    add_table(wb, "Settings", [("Setting", None, 26), ("Value", None, 52), ("Note", None, 60)], [
        ["Mode", "TEST", "Nothing here touches the live shop, ZIMRA's live system or real money"],
        ["ZIMRA", "Test environment, device 91404 (P4)", "The live device 21404 is not used in test mode"],
        ["Payments", "Sandbox keys in the Shop Hub", "Paynow and ZB SmilePay sandboxes"],
        ["Copied from live on", f"{day:%d %b %Y} 05:41", "Refresh from the app (owner PIN) to copy again"],
        ["Data year", 2026, ""]], kind="owner")
    readme(wb, f"My Shop (TEST): {BUSINESS['Business name']}", [
        "TEST MODE. This folder is a practice copy of the shop. Every ID starts with T-, receipts say 'TEST: NOT A VALID RECEIPT',",
        "ZIMRA is its test environment and payments are sandboxes. The live shop's files are never written from test mode.",
        "Delete this whole folder at any time; nothing in the live shop depends on it.",
    ], tabs=[("Products", "owner", "Copied from the live shop."), ("Stock Ledger", "phones", "Practice stock: opening copy, then practice sales."),
             ("Settings", "owner", "Test mode settings.")])
    wb.save(test_dir() / "My Shop.xlsx")
