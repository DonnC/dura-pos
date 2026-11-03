# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""`My Shop`: the permanent workbook with products, contacts, staff, settings,
rates, ledgers, stock, balances and the owner's reports.
"""

from __future__ import annotations

import csv
import html
from datetime import date, datetime, time
from decimal import Decimal as D
from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter
from dura_templates.paths import HS_CODES_CSV
from dura_templates.files.reports import write_files_tab, write_months_and_reports
from dura_templates.sample.business import ADDED_ON, BUSINESS, CUST, CUSTOMERS, DEVICE_ID, KEPT_CHANGE_FROM, KEPT_CHANGE_LIMIT, LAST_SYNC_TODAY, LOCATIONS, ON_ACCOUNT_DAYS, ON_ACCOUNT_FROM, PC, PHONES, PROD, PRODUCTS, STAFF, SUPPLIERS, TAXES, active_product, business_dir, phones_on, price_cost, seller_for
from dura_templates.sample.period import START, TODAY
from dura_templates.sample.records import callbacks_y, counts_y, money_ledger_y, purchases_y, rates_rows_y, stock_ledger_y
from dura_templates.sample.sales import fiscal_day_open
from dura_templates.workbook.headers import H_CALLBACKS, H_COUNTS, H_LEDGER, H_MONEY, H_PRODUCTS, H_PURCHASES, H_RATES
from dura_templates.workbook.lists import colour_status, date_picker, dropdown, write_lists
from dura_templates.workbook.styles import BAD, BOLD, FMT, GOOD, INFO, OFF, WARN, fill, highlight
from dura_templates.workbook.tables import add_table, col, mark_formula_tab, readme


def ean13(pid: str) -> str:
    """A made-up EAN-13 barcode with a valid check digit, Zimbabwe-style 600 prefix."""
    base = f"600{7310000 + int(pid[1:]) * 37:09d}"  # made up, Zimbabwe-style 600 prefix
    total = sum(int(c) * (3 if i % 2 else 1) for i, c in enumerate(base))
    return base + str((10 - total % 10) % 10)





def product_rows() -> list[list]:
    """The Products tab's rows, with today's prices and active status."""
    rows = []
    for pid, name, cat, unit, price, cost, tax, hs, low, w, daily in PRODUCTS:
        p, c = price_cost(pid, TODAY)
        tx = TAXES[tax]
        active = "Yes" if active_product(pid, TODAY) else "No"
        note = {"P027": "Seasonal; stopped for winter", "P011": "Price changed 1 Jun 2026",
                "P006": "Price changed 10 Aug 2026"}.get(pid, "")
        rows.append([pid, name, cat, unit, ean13(pid), f"Product photos/{pid}.jpg", p, c,
                             f"{tx['name']} ({tx['code']})", hs, low, active, ADDED_ON[pid], note])
    return rows


def write_my_shop():
    """Writes My Shop: inputs the owner edits (products, contacts, staff,
    settings, rates), the ledgers phones add to, and the formula reports.
    """
    wb = Workbook()
    product_rows_ = product_rows()
    ws_products = add_table(wb, "Products", H_PRODUCTS, product_rows_, first=True, kind="owner")
    highlight(ws_products, f"A2:{get_column_letter(len(H_PRODUCTS))}{len(product_rows_) + 1}", f'${col(H_PRODUCTS, "Active")}2="No"', OFF)
    PH = col(H_PRODUCTS, "Photo")
    for r_ in range(2, len(product_rows_) + 2):
        cell = ws_products[f"{PH}{r_}"]
        cell.hyperlink = cell.value  # in Google Drive this is the photo's Drive link
        cell.font = Font(color="0563C1", underline="single")
    lists = write_lists(wb)

    # Stock (formulas over this year's Stock Ledger)
    H_STOCK = [("Product ID", None, 9), ("Product", None, 24), ("Location", None, 9), ("In stock", "int", 9),
               ("Low-stock level", "int", 9), ("Status", None, 10), (f"Stock value ({PC})", "money", 11),
               ("Last received", "date", 12)]
    ws = add_table(wb, "Stock", H_STOCK, [], kind="dura")
    L = {h: col(H_LEDGER, h) for h in ("Date", "Location", "Type", "Product ID", "Qty")}
    PR = {h: col(H_PRODUCTS, h) for h in ("Low-stock level", f"Cost ({PC})")}
    sled, mled = "'Stock Ledger'", "'Money Ledger'"
    r = 1
    for loc, *_ in LOCATIONS:
        for pid in PROD:
            if not active_product(pid, TODAY):
                continue
            r += 1
            ws.cell(row=r, column=1, value=pid)
            ws.cell(row=r, column=2, value=f"=IFERROR(INDEX(Products!$B:$B,MATCH($A{r},Products!$A:$A,0)),\"\")")
            ws.cell(row=r, column=3, value=loc)
            ws.cell(row=r, column=4, value=f"=SUMIFS({sled}!${L['Qty']}:${L['Qty']},{sled}!${L['Product ID']}:${L['Product ID']},$A{r},{sled}!${L['Location']}:${L['Location']},$C{r})").number_format = FMT["int"]
            ws.cell(row=r, column=5, value=f"=IFERROR(INDEX(Products!${PR['Low-stock level']}:${PR['Low-stock level']},MATCH($A{r},Products!$A:$A,0)),0)")
            ws.cell(row=r, column=6, value=f'=IF($D{r}<=0,"🔴 Out",IF($D{r}<=$E{r},"🟡 Low","🟢 OK"))')
            ws.cell(row=r, column=7, value=f"=IFERROR($D{r}*INDEX(Products!${PR[f'Cost ({PC})']}:${PR[f'Cost ({PC})']},MATCH($A{r},Products!$A:$A,0)),0)").number_format = FMT["money"]
            mx = (f"MAX(_xlfn.MAXIFS({sled}!${L['Date']}:${L['Date']},{sled}!${L['Product ID']}:${L['Product ID']},$A{r},"
                  f"{sled}!${L['Location']}:${L['Location']},$C{r},{sled}!${L['Type']}:${L['Type']},\"Stock in\"),"
                  f"_xlfn.MAXIFS({sled}!${L['Date']}:${L['Date']},{sled}!${L['Product ID']}:${L['Product ID']},$A{r},"
                  f"{sled}!${L['Location']}:${L['Location']},$C{r},{sled}!${L['Type']}:${L['Type']},\"Moved in\"))")
            ws.cell(row=r, column=8, value=f'=IF({mx}=0,"",{mx})').number_format = FMT["date"]
    ws.auto_filter.ref = f"A1:H{r}"
    highlight(ws, f"A2:H{r}", 'ISNUMBER(SEARCH("Out",$F2))', BAD)
    highlight(ws, f"A2:H{r}", 'ISNUMBER(SEARCH("Low",$F2))', WARN)
    mark_formula_tab(ws)

    H_LOC = [("Location", None, 9), ("Name", None, 22), ("Type", None, 12), ("Address", None, 34), ("Phones", None, 10),
             ("Opened on", "date", 12), ("Active", None, 7)]
    ws = add_table(wb, "Locations", H_LOC,
                   [[l, n, "Selling", a, ", ".join(p for p in phones_on(TODAY) if PHONES[p][1] == l), o, "Yes"]
                    for l, n, a, o in LOCATIONS], kind="owner")
    dropdown(ws, H_LOC, "Type", lists["Location type"], rows=50)
    dropdown(ws, H_LOC, "Active", lists["Yes/No"], rows=50)
    date_picker(ws, H_LOC, "Opened on", rows=50)
    locations = "Locations!$A$2:$A$50"

    phone_rows = []
    for ph, (name, loc, frm, to, *_rest) in PHONES.items():
        retired = to is not None
        fd = fiscal_day_open.get(ph)
        last = (datetime.combine(TODAY, LAST_SYNC_TODAY[ph]) if not retired else datetime.combine(to, time(16, 25)))
        phone_rows.append([ph, name, loc, "Retired" if retired else "Active",
                           ", ".join(sorted({seller_for(ph, frm), seller_for(ph, to or TODAY)})), frm, to,
                           DEVICE_ID[ph], f"DURA-{ph}", "Retired" if retired else "On",
                           None if retired else date(2027, 2, 26),
                           fd["no"] if fd and not retired else "", last, "1.4.2" if not retired else "1.2.0",
                           "Screen broken; replaced by P4. ZIMRA device 21402 retired." if retired else ""])
    H_PH = [("Phone", None, 7), ("Name", None, 18), ("Location", None, 9), ("Status", None, 8),
            ("Seller(s)", None, 24), ("Joined on", "date", 12), ("Retired on", "date", 12),
            ("ZIMRA device ID", None, 9), ("Serial no", None, 10), ("Fiscalisation", None, 9),
            ("Certificate valid till", "date", 12), ("Current fiscal day", None, 9),
            ("Last synced", "datetime", 16), ("App version", None, 8), ("Note", None, 40)]
    ws = add_table(wb, "Phones", H_PH, phone_rows)
    highlight(ws, f"A2:O{len(phone_rows) + 1}", '$D2="Retired"', OFF)

    H_STAFF = [("Staff ID", None, 7), ("Name", None, 14), ("Role", None, 9), ("App access", None, 28),
               ("Phones", None, 9), ("Discount limit", None, 9), ("Can refund", None, 14), ("Active", None, 7),
               ("From", "date", 12), ("To", "date", 12), ("Note", None, 24)]
    ws = add_table(wb, "Staff", H_STAFF,
                   [[s_, n, r_, a, p, dl, cr, "No" if to and to < TODAY else "Yes", f, to, note]
                    for s_, n, r_, a, p, dl, cr, f, to, note in STAFF], kind="owner")
    for column, source in (("Role", "Role"), ("App access", "App access"), ("Discount limit", "Discount limit"),
                           ("Can refund", "Refunds"), ("Active", "Yes/No")):
        dropdown(ws, H_STAFF, column, lists[source], rows=100)
    date_picker(ws, H_STAFF, "From", rows=100)
    date_picker(ws, H_STAFF, "To", rows=100)
    highlight(ws, f"A2:K{len(STAFF) + 1}", '$H2="No"', OFF)

    # Contacts: customers and suppliers in one list
    H_CON = [("Contact ID", None, 10), ("Name", None, 24), ("Type", None, 11), ("Person or business", None, 9),
             ("Phone no", None, 16), ("Email", None, 20), ("TIN", None, 11), ("VAT number", None, 11),
             ("Address", None, 22), ("Usual location", None, 9), ("On account", None, 9),
             (f"Credit limit ({PC})", "money", 9), ("Payment days", "int", 8), ("Supplies", None, 22),
             ("Supplier terms", None, 34), ("Added by", None, 7), ("Added on", "date", 12), ("Updated on", "date", 12),
             ("Active", None, 7), ("Merged into", None, 10), ("Note", None, 44)]
    account = {"P1-C0008": ("Yes", D(150), ON_ACCOUNT_DAYS)}
    contacts = [[cid, n, "Customer", ty, pn, em, tin, vat, addr, loc, *account.get(cid, ("No", None, None)), "", "",
                 cid[:2], added, upd, "No" if merged else "Yes", merged, note]
                for cid, n, pn, em, ty, tin, vat, addr, loc, added, upd, merged, note in CUSTOMERS]
    contacts += [[sid, n, "Supplier", "Business", pn, em, tin, vat, "", "", "No", None, None, what, terms,
                  sid[:2], START, None, "Yes", "", note] for sid, n, pn, em, tin, vat, what, terms, note in SUPPLIERS]
    contacts.sort(key=lambda c_: (c_[0][:2], c_[0]))
    ws = add_table(wb, "Contacts", H_CON, contacts, kind="owner")
    for column, source in (("Type", "Contact type"), ("Person or business", "Person or business"),
                           ("Usual location", "Usual location"), ("On account", "Yes/No"),
                           ("Supplier terms", "Supplier terms"), ("Active", "Yes/No")):
        dropdown(ws, H_CON, column, lists[source], strict=column != "Supplier terms")
    dropdown(ws, H_CON, "Merged into", "Contacts!$A$2:$A$500")
    date_picker(ws, H_CON, "Added on")
    date_picker(ws, H_CON, "Updated on")
    last = get_column_letter(len(H_CON))
    TY = col(H_CON, "Type")
    highlight(ws, f"A2:{last}{len(contacts) + 1}", f'${col(H_CON, "Active")}2="No"', OFF)
    highlight(ws, f"{TY}2:{TY}{len(contacts) + 1}", f'${TY}2="Supplier"', "FCE4D6")
    highlight(ws, f"{TY}2:{TY}{len(contacts) + 1}", f'${TY}2="Customer"', INFO)

    # Products dropdowns, now that the Lists and HS Codes exist
    for column, source in (("Category", "Category"), ("Unit", "Unit"), ("Tax", "Tax"), ("Active", "Yes/No")):
        dropdown(ws_products, H_PRODUCTS, column, lists[source], strict=column in ("Tax", "Active"))
    dropdown(ws_products, H_PRODUCTS, "HS code", "'HS Codes'!$A$2:$A$500", strict=False)
    date_picker(ws_products, H_PRODUCTS, "Added on")

    add_table(wb, "Taxes", [("ZIMRA tax ID", None, 9), ("Name", None, 16), ("Percent", "pct", 8), ("Code", None, 6),
                            ("Valid from", "date", 12), ("Note", None, 60)],
              [[t["id"], t["name"], t["pct"], t["code"], date(2025, 1, 1),
                "Copied from ZIMRA's configuration when fiscalisation is on. Sample values: confirm each product's VAT treatment."]
               for t in TAXES.values()])

    # HS codes: Dura carries ZIMRA's whole list and writes only the codes this shop uses, with their official wording
    hs_names = {code: html.unescape(desc) for code, desc in csv.reader(open(HS_CODES_CSV, encoding="utf-8")) if code != "hsn_code"}
    used = sorted({p[7] for p in PRODUCTS})
    H_HS = [("HS code", None, 10), ("Official description (ZIMRA list)", None, 90), ("Products using it", "int", 9)]
    ws = add_table(wb, "HS Codes", H_HS, [[code, hs_names[code], None] for code in used], kind="dura")
    HSC = col(H_PRODUCTS, "HS code")
    for r in range(2, len(used) + 2):
        ws.cell(row=r, column=3, value=f"=COUNTIF(Products!${HSC}:${HSC},$A{r})")
        ws.cell(row=r, column=2).alignment = Alignment(wrap_text=True, vertical="top")
    mark_formula_tab(ws)

    H_CUR = [("Currency", None, 9), ("Name", None, 20), ("Accepted", None, 9), ("Used for", None, 30),
             ("Cash", None, 6), ("Mobile money", None, 9), ("Price rounding", None, 10), ("Note", None, 50)]
    ws = add_table(wb, "Currencies", H_CUR,
                   [["USD", "US dollar", "Yes", "Prices, most sales, card, InnBucks, EcoCash USD", "Yes", "Yes", "0.01",
                     "The pricing currency: every product has one USD price. Cents of USD change are often given in ZWG, or kept."],
                    ["ZWG", "Zimbabwe Gold (ZiG)", "Yes", "Sales and change; EcoCash ZWG", "Yes", "Yes", "0.50",
                     "ZWG price = USD price x today's rate (Exchange Rates), rounded to 0.50."],
                    ["ZAR", "South African rand", "Yes", "Cash sales, mostly at the Mbare stall", "Yes", "No", "0.50",
                     "ZAR price = USD price x today's rate, rounded to 0.50. Cash only."]], kind="owner")
    for column in ("Accepted", "Cash", "Mobile money"):
        dropdown(ws, H_CUR, column, lists["Yes/No"], rows=20)
    currencies = "Currencies!$A$2:$A$20"

    H_PM = [("Method", None, 18), ("Currency", None, 8), ("ZIMRA money type", None, 16),
            ("Provider", None, 16), ("Mode", None, 8), ("Confirmed by", None, 24),
            ("Keys kept", None, 26), ("Active", None, 7), ("Note", None, 44)]
    pm_rows = [["Cash USD", "USD", "Cash", "", "", "Cash count", "", "Yes", ""],
               ["Cash ZWG", "ZWG", "Cash", "", "", "Cash count", "", "Yes", ""],
               ["Cash ZAR", "ZAR", "Cash", "", "", "Cash count", "", "Yes", ""],
               ["EcoCash USD", "USD", "MobileWallet", "Shop Hub: Paynow", "Live", "Shop Hub (poll)", "In the Shop Hub", "Yes", "Manual (SMS) before 4 May 2026; keys on the phones until the hub, 15 Aug 2026"],
               ["EcoCash ZWG", "ZWG", "MobileWallet", "Shop Hub: Paynow", "Live", "Shop Hub (poll)", "In the Shop Hub", "Yes", "Manual (SMS) before 4 May 2026; keys on the phones until the hub, 15 Aug 2026"],
               ["InnBucks USD", "USD", "MobileWallet", "Shop Hub: Paynow", "Live", "Shop Hub (poll)", "In the Shop Hub", "Yes", ""],
               ["SmilePay USD", "USD", "MobileWallet", "Shop Hub: ZB SmilePay", "Sandbox", "Shop Hub (poll)", "In the Shop Hub", "No",
                "Being tried in test mode; check ZB's merchant API terms before going live"],
               ["Card USD", "USD", "Card", "Bank card machine", "", "Card machine slip", "", "Yes", "Separate card machine at the main shop"],
               ["Bank transfer USD", "USD", "BankTransfer", "", "", "Manual (bank SMS)", "", "Yes", "Business customers, and invoice payments"],
               ["Kept change USD", "USD", "Other (ask ZIMRA)", "", "", "Customer's balance", "", "Yes",
                "Change the shop kept for a customer, used to pay. Money type to confirm with ZIMRA"],
               ["On account USD", "USD", "Credit", "", "", "Customer's account", "", "Yes",
                "Invoices for contacts allowed an account"]]
    ws = add_table(wb, "Payment Methods", H_PM, pm_rows, kind="owner")
    dropdown(ws, H_PM, "Currency", currencies, rows=50)
    dropdown(ws, H_PM, "ZIMRA money type", lists["ZIMRA money type"], rows=50)
    dropdown(ws, H_PM, "Mode", lists["Mode"], rows=50)
    dropdown(ws, H_PM, "Active", lists["Yes/No"], rows=50)

    settings = [
        ("Business name", BUSINESS["Business name"], ""), ("Legal name", BUSINESS["Legal name"], "Printed on receipts"),
        ("Owner", BUSINESS["Owner"], ""), ("TIN", BUSINESS["TIN"], "Sample"), ("VAT number", BUSINESS["VAT number"], "Sample"),
        ("Address", BUSINESS["Address"], ""), ("Phone", BUSINESS["Phone"], ""),
        ("Shop Google account", BUSINESS["Shop Google account"], "A Google account used only for the shop; every phone signs in to Dura with it"),
        ("Word for a location", "Shop", "Shop, branch, store, stall or outlet: the app uses this word"),
        ("Mode", "Live", f"Test mode uses its own folder, '{BUSINESS['Business name']} (TEST)', and never touches this one"),
        ("Pricing currency", PC, "Chosen at setup. Every product has one price, in this currency"),
        ("Accepted currencies", "USD, ZWG, ZAR", "Other currencies use the day's rate"),
        ("Rate policy", "Daily rate", "One rate per currency for the whole day. The other choice is 'Latest rate'"),
        ("If today's rate is missing", "Ask", "Ask, Use the last rate with a warning, or Block (only blocks other currencies)"),
        ("Who may set rates", "Owner", "Owner, or Owner and managers"),
        ("Fiscalisation", "On (since 1 Mar 2026)", "Per phone; see Phones"),
        ("Low-stock alerts", "On", ""), ("Seller discount limit", "5%", "Above it needs the owner's PIN"),
        ("Refunds", "Owner's PIN", ""), ("Day close time", "Main 19:45, Mbare 18:00", "Cash-up and fiscal day close"),
        ("Kept change", f"On (since {KEPT_CHANGE_FROM:%d %b %Y}), up to USD {KEPT_CHANGE_LIMIT} per customer",
         "Paying it out in cash needs the owner's PIN"),
        ("Kept change reminder", "After 60 days", "Old balances are listed for the owner"),
        ("Invoices on account", f"On (since {ON_ACCOUNT_FROM:%d %b %Y})", "Only for contacts marked 'On account'"),
        ("Quotes", "On, valid 7 days", "Shared as a PDF; not fiscal"),
        ("Suppliers and purchases", "On", "Supplier invoice photos go to <year>/Supplier invoices"),
        ("Phone keeps synced sales for", "7 days", "Older sales are read from the sheets when needed"),
        ("Sync", "Background, after each sale, Sync now, end of day", ""), ("Backups", "Daily, to hidden app data", ""),
        ("Shop Hub", "Installed 15 Aug 2026, layout 3", "Apps Script in this account: payment keys and gateways, callbacks, month and year files, daily summary"),
        ("Receipt footer", "Thank you! Tatenda! Siyabonga!", ""),
        ("Data year", 2026, "The year the ledger tabs and Summary show. Dura moves it on at the year-end archive"),
    ]
    add_table(wb, "Settings", [("Setting", None, 26), ("Value", None, 52), ("Note", None, 60)], [list(s_) for s_ in settings],
              kind="owner")

    ws = add_table(wb, "Exchange Rates", H_RATES, rates_rows_y[2026], kind="owner")
    date_picker(ws, H_RATES, "Date", rows=400)
    dropdown(ws, H_RATES, "Set by", "Staff!$B$2:$B$100", rows=400)

    # The two ledgers
    ws = add_table(wb, "Stock Ledger", H_LEDGER, stock_ledger_y[2026])
    n = len(stock_ledger_y[2026]) + 1
    LT = col(H_LEDGER, "Type")
    for types, colour in ((("Stock in", "Opening", "Moved in", "Returned"), GOOD), (("Written off", "Counted"), BAD),
                          (("Moved out",), WARN)):
        highlight(ws, f"{LT}2:{LT}{n}", "OR(" + ",".join(f'${LT}2="{t}"' for t in types) + ")", colour)
    ws = add_table(wb, "Money Ledger", H_MONEY, money_ledger_y[2026])
    n = len(money_ledger_y[2026]) + 1
    MT = col(H_MONEY, "Type")
    for types, colour in ((("Account paid", "Change used"), GOOD), (("Expense", "Change paid out", "Supplier paid"), BAD),
                          (("Purchase", "Invoiced on account", "Change kept"), WARN), (("Takings collected", "Banked"), INFO)):
        highlight(ws, f"{MT}2:{MT}{n}", "OR(" + ",".join(f'${MT}2="{t}"' for t in types) + ")", colour)

    ws = add_table(wb, "Stock Counts", H_COUNTS, counts_y[2026])
    n = len(counts_y[2026]) + 1
    for column in ("Difference", f"Value difference ({PC})"):
        L2 = col(H_COUNTS, column)
        highlight(ws, f"{L2}2:{L2}{n}", f"{L2}2<0", BAD)
        highlight(ws, f"{L2}2:{L2}{n}", f"{L2}2>0", WARN)
    ws = add_table(wb, "Purchases", H_PURCHASES, purchases_y[2026])
    colour_status(ws, H_PURCHASES, "Payment status", len(purchases_y[2026]) + 1, {"Unpaid": "F4B183", "Paid": GOOD})
    ws = add_table(wb, "Payment Callbacks", H_CALLBACKS, callbacks_y[2026])
    colour_status(ws, H_CALLBACKS, "Result", len(callbacks_y[2026]) + 1, {"Rejected": BAD, "Duplicate": OFF})

    # Balances: kept change owed to customers, accounts owed by customers, amounts owed to suppliers
    H_BAL = [("Contact ID", None, 10), ("Name", None, 24), ("Type", None, 10), ("What", None, 18),
             ("Currency", None, 8), ("The shop owes them", "money", 11), ("They owe the shop", "money", 11),
             ("Limit", "money", 9), ("Status", None, 18), ("Last movement", "date", 12)]
    ws = add_table(wb, "Balances", H_BAL, [], kind="dura")
    B = {h: col(H_MONEY, h) for h in ("Date", "Contact ID", "Balance change", "Currency")}
    parties = sorted({(r_[11], r_[7]) for r_ in money_ledger_y[2026] if r_[11]}, key=lambda k: (k[0] not in CUST, k[0]))
    r = 1
    for party, cur in parties:
        r += 1
        is_cust = party in CUST
        what = ("Account (invoices)" if party in account else "Kept change") if is_cust else "Supplier invoices"
        limit = account[party][1] if party in account else (KEPT_CHANGE_LIMIT if is_cust else None)
        total = (f"SUMIFS({mled}!${B['Balance change']}:${B['Balance change']},{mled}!${B['Contact ID']}:"
                 f"${B['Contact ID']},$A{r},{mled}!${B['Currency']}:${B['Currency']},$E{r})")
        for c, v in enumerate([party, f'=IFERROR(INDEX(Contacts!$B:$B,MATCH($A{r},Contacts!$A:$A,0)),"")',
                               f'=IFERROR(INDEX(Contacts!${TY}:${TY},MATCH($A{r},Contacts!$A:$A,0)),"")', what, cur,
                               f"=MAX(0,{total})", f"=MAX(0,-{total})", limit,
                               f'=IF(AND($H{r}<>"",MAX($F{r},$G{r})>$H{r}),"🔴 Over limit",IF($G{r}>0,"🟠 Owes the shop",'
                               f'IF($F{r}>0,"🔵 Shop owes them","⚪ Settled")))',
                               f"=_xlfn.MAXIFS({mled}!${B['Date']}:${B['Date']},{mled}!${B['Contact ID']}:"
                               f"${B['Contact ID']},$A{r})"], start=1):
            cell = ws.cell(row=r, column=c, value=v)
            if c in (6, 7, 8):
                cell.number_format = FMT["money"]
            if c == 10:
                cell.number_format = FMT["date"]
    colour_status(ws, H_BAL, "Status", r, {"Over limit": BAD, "Owes the shop": "F4B183", "Shop owes": INFO, "Settled": OFF})
    ws.auto_filter.ref = f"A1:J{r}"
    mark_formula_tab(ws)

    write_months_and_reports(wb, sled, mled)
    write_files_tab(wb)

    # Summary
    ws = wb.create_sheet("Summary")
    mark_formula_tab(ws)
    ws["A1"] = f"{BUSINESS['Business name']}: stock, money owed, and the year so far"
    ws["A1"].font = Font(bold=True, size=15, color="1F3864")
    ws["A2"] = "Formulas only, from the tabs in this file. Values at cost are in USD; cash is shown per currency, never added up. Red numbers are negative."
    ws["D1"] = "Year (from Settings)"
    ws["E1"] = '=INDEX(Settings!$B:$B,MATCH("Data year",Settings!$A:$A,0))'
    ws["D1"].font = ws["E1"].font = BOLD
    year_from = f'">="&DATE($E$1,1,1)'  # year-to-date rows only, even while last year's rows wait for the archive
    r = 4
    for c, h in enumerate(["Stock by location", "🟢 OK", "🟡 Low", "🔴 Out", f"Stock value ({PC})"], start=1):
        ws.cell(row=r, column=c, value=h).font = BOLD
    r_stock = r
    for loc, *_ in LOCATIONS:
        r += 1
        ws.cell(row=r, column=1, value=loc)
        for c, st in enumerate(("OK", "Low", "Out"), start=2):
            ws.cell(row=r, column=c, value=f'=COUNTIFS(Stock!$C:$C,$A{r},Stock!$F:$F,"*{st}")')
        ws.cell(row=r, column=5, value=f"=SUMIFS(Stock!$G:$G,Stock!$C:$C,$A{r})").number_format = FMT["money"]
    for c, colour in ((2, GOOD), (3, WARN), (4, BAD)):
        for rr in range(r_stock + 1, r + 1):
            ws.cell(row=rr, column=c).fill = fill(colour)
    ch = BarChart()
    ch.type, ch.grouping, ch.overlap = "bar", "stacked", 100
    ch.title = "Products in stock: OK, low, out"
    ch.height, ch.width = 6, 16
    ch.add_data(Reference(ws, min_col=2, max_col=4, min_row=r_stock, max_row=r), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=1, min_row=r_stock + 1, max_row=r))
    for series, colour in zip(ch.series, ("70AD47", "FFC000", "C00000")):
        series.graphicalProperties.solidFill = colour
    ws.add_chart(ch, "H4")

    G, V = col(H_LEDGER, "Type"), col(H_LEDGER, f"Stock value ({PC})")
    MG, M, N, BC = col(H_MONEY, "Type"), col(H_MONEY, "Cash amount"), col(H_MONEY, "Currency"), col(H_MONEY, "Balance change")
    r += 2
    ws.cell(row=r, column=1, value=f"Money owed ({PC})").font = BOLD
    owed = [("Kept change the shop owes customers", ("Change kept", "Change used", "Change paid out"), 1, INFO),
            ("Customers owe the shop (invoices)", ("Invoiced on account", "Account paid"), -1, "F4B183"),
            ("The shop owes suppliers", ("Purchase", "Supplier paid"), 1, "FCE4D6")]
    for label, types, sign, colour in owed:
        r += 1
        ws.cell(row=r, column=1, value=label).fill = fill(colour)
        f = "+".join(f'SUMIFS({mled}!${BC}:${BC},{mled}!${MG}:${MG},"{t}")' for t in types)
        ws.cell(row=r, column=2, value=f"={'-' if sign < 0 else ''}({f})").number_format = FMT["money"]
    ws.cell(row=r + 1, column=1, value="Each customer and supplier: see Balances.").font = Font(italic=True)
    r += 3
    ws.cell(row=r, column=1, value=f"Year to date ({PC} at cost)").font = BOLD
    SD, MD = col(H_LEDGER, "Date"), col(H_MONEY, "Date")
    ytd_s, ytd_m = f"{sled}!${SD}:${SD},{year_from}", f"{mled}!${MD}:${MD},{year_from}"
    lines = [("Stock received", f"=SUMIFS({sled}!${V}:${V},{sled}!${G}:${G},\"Stock in\",{ytd_s})"),
             ("Cost of goods sold", f"=-SUMIFS({sled}!${V}:${V},{sled}!${G}:${G},\"Sold\",{ytd_s})-SUMIFS({sled}!${V}:${V},{sled}!${G}:${G},\"Returned\",{ytd_s})"),
             ("Written off", f"=SUMIFS({sled}!${V}:${V},{sled}!${G}:${G},\"Written off\",{ytd_s})"),
             ("Stock count differences", f"=SUMIFS({sled}!${V}:${V},{sled}!${G}:${G},\"Counted\",{ytd_s})")]
    for label, f in lines:
        r += 1
        ws.cell(row=r, column=1, value=label)
        ws.cell(row=r, column=2, value=f).number_format = FMT["money"]
    r += 2
    for c, h in enumerate(["Cash this year (out is red)", "USD", "ZWG", "ZAR"], start=1):
        ws.cell(row=r, column=c, value=h).font = BOLD
    for label, typ in (("Expenses", "Expense"), ("Paid to suppliers", "Supplier paid"),
                       ("Kept change paid out", "Change paid out"), ("Takings collected", "Takings collected"),
                       ("Banked", "Banked")):
        r += 1
        ws.cell(row=r, column=1, value=label)
        for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=2):
            ws.cell(row=r, column=c, value=f"=SUMIFS({mled}!${M}:${M},{mled}!${MG}:${MG},\"{typ}\",{mled}!${N}:${N},\"{cur}\",{ytd_m})").number_format = FMT["money"]
    # month by month, with a chart
    r += 2
    for c, h in enumerate(["Month", "Stock received", "Cost of goods sold", f"Paid to suppliers ({PC})"], start=1):
        ws.cell(row=r, column=c, value=h).font = BOLD
    r_month = r
    for m in range(1, 13):  # all twelve months of the Settings year; months to come show zero
        r += 1
        ws.cell(row=r, column=1, value=f"{date(2026, m, 1):%b}")
        within = lambda led, D_: (f'{led}!${D_}:${D_},">="&DATE($E$1,{m},1),'
                                  f'{led}!${D_}:${D_},"<"&DATE($E$1,{m}+1,1)')
        ws.cell(row=r, column=2, value=f'=SUMIFS({sled}!${V}:${V},{sled}!${G}:${G},"Stock in",{within(sled, SD)})').number_format = FMT["money"]
        ws.cell(row=r, column=3, value=f'=-SUMIFS({sled}!${V}:${V},{sled}!${G}:${G},"Sold",{within(sled, SD)})').number_format = FMT["money"]
        ws.cell(row=r, column=4, value=f'=-SUMIFS({mled}!${M}:${M},{mled}!${MG}:${MG},"Supplier paid",{mled}!${N}:${N},"USD",{within(mled, MD)})').number_format = FMT["money"]
    ch = BarChart()
    ch.title = f"Stock bought and sold each month ({PC} at cost)"
    ch.height, ch.width = 8, 16
    ch.add_data(Reference(ws, min_col=2, max_col=3, min_row=r_month, max_row=r), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=1, min_row=r_month + 1, max_row=r))
    ch.series[0].graphicalProperties.solidFill = "4472C4"
    ch.series[1].graphicalProperties.solidFill = "ED7D31"
    ws.add_chart(ch, "H18")
    ws.column_dimensions["A"].width = 38
    for c in "BCDE":
        ws.column_dimensions[c].width = 16

    readme(wb, f"My Shop: {BUSINESS['Business name']}", [
        "The shop's main file. It stays in the Dura POS folder for good; each month's sales are in that year's folder.",
        "Green tabs are yours: most cells are dropdowns, and dates have a calendar (in Google Sheets). Add your own",
        "   categories, units and supplier terms in the Lists tab and they appear in the dropdowns.",
        "Dura checks your changes on its next sync and lists anything it skipped in Activity.",
        "Stock is never typed: it is the Stock Ledger added up per product and location.",
        "Red numbers are negative: stock going out, money going out, short, or owed by someone.",
        "Status dots: 🟢 good, 🟡 needs a look soon, 🟠 someone owes the shop, 🔵 the shop owes someone, 🔴 act now, ⚪ settled.",
        "The ledger tabs hold this year only (the year is in Settings, 'Data year'). On 1 January Dura copies them to",
        "   that year's archive file (e.g. 2025/Ledger 2025) and empties them; tab names and formulas never change.",
        "Seller PINs, payment keys and ZIMRA keys are never in any sheet: they stay on the phones.",
        "SAMPLE DATA: the shop, people, tax IDs, rates and references are fictional.",
    ], tabs=[
        ("Products", "owner", "Your price list: one USD price per product, cost, tax, HS code, low-stock level."),
        ("Lists", "owner", "The choices behind every dropdown. Add to the green columns; the grey ones are fixed."),
        ("Stock", "dura", "What's in stock at each location now: 🟢 OK, 🟡 low, 🔴 out."),
        ("Locations", "owner", "Your shops, branches, stalls or storerooms."),
        ("Phones", "phones", "Each phone: where it is, its ZIMRA device, last sync."),
        ("Staff", "owner", "You and your sellers: role and what each may do. PINs are not here."),
        ("Contacts", "owner", "Everyone the shop deals with: customers (blue) and suppliers (pink), in one list."),
        ("Taxes", "phones", "VAT rates, copied from ZIMRA."),
        ("HS Codes", "dura", "The ZIMRA HS codes your products use, with ZIMRA's wording. The app has the full list."),
        ("Currencies", "owner", "USD, ZWG, ZAR: which you accept, and rounding."),
        ("Payment Methods", "owner", "Cash, mobile money, card, bank, kept change, account. Keys are not here."),
        ("Settings", "owner", "Business details and how Dura behaves."),
        ("Exchange Rates", "owner", f"ZWG and ZAR per 1 {PC}, with the time and whether it's for the day. Other currencies' prices come from these."),
        ("Stock Ledger", "phones", "Every stock movement this year: in (green), sold, moved, written off or counted short (pink)."),
        ("Money Ledger", "phones", "Every money movement that isn't a sale: expenses, banking, suppliers, kept change, invoices."),
        ("Stock Counts", "phones", "Each stock take: missing is red, extra found is yellow."),
        ("Purchases", "phones", "Each supplier invoice: total, VAT, paid (green) or unpaid (orange)."),
        ("Payment Callbacks", "phones", "Messages from Paynow (optional). Rejected ones are red."),
        ("Balances", "dura", "Who owes what: kept change, invoices and suppliers, with a status dot."),
        ("Months", "dura", "One row per month, written by the Shop Hub when the month closes (to date for this month)."),
        ("Reports", "dura", "Income statement, VAT per currency, cash flow, and what the business owns and owes."),
        ("Files", "dura", "Every Dura file and folder for this shop, with its ID: Dura finds files here, never by name."),
        ("Summary", "dura", "Stock, money owed and the year so far, with charts."),
    ], questions=[
        ("What's running out?", "Stock (🟡 and 🔴 rows), or the chart in Summary"),
        ("What happened to one product?", "Stock Ledger: filter Product ID (and Location)"),
        ("How much is my stock worth?", "Summary, 'Stock by location'"),
        ("Who owes me, and whom do I owe?", "Balances"),
        ("How much kept change do I owe customers?", "Summary, 'Money owed'"),
        ("What did I pay a supplier, and the VAT on it?", "Purchases"),
        ("Where did cash go, apart from sales?", "Money Ledger"),
        ("Did I make a profit this year?", "Reports, 'Income statement'"),
        ("How much VAT do I owe?", "Reports, 'VAT' (per currency)"),
        ("What did I sell in a month?", "That month's file, in the year's folder"),
        ("Who changed what, and when?", "The Activity tab in that month's file"),
    ])
    business_dir().mkdir(parents=True, exist_ok=True)
    wb.save(business_dir() / "My Shop.xlsx")
