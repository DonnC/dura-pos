# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""What the sample shop's `My Shop` holds: every row, gathered from the
fictional business and its simulated year. `files.my_shop` lays it out; a
clean template passes its own, mostly empty, content to the same writer.
"""

from __future__ import annotations

import csv
import html
from datetime import date, datetime, time
from decimal import Decimal as D

from dura_templates.paths import HS_CODES_CSV
from dura_templates.sample.business import (
    ADDED_ON, BUSINESS, CUST, CUSTOMERS, DEVICE_ID, KEPT_CHANGE_FROM, KEPT_CHANGE_LIMIT, LAST_SYNC_TODAY,
    LOCATIONS, ON_ACCOUNT_DAYS, ON_ACCOUNT_FROM, PC, PHONES, PROD, PRODUCTS, STAFF, SUPPLIERS, TAXES,
    active_product, phones_on, price_cost, seller_for)
from dura_templates.sample.period import START, TODAY
from dura_templates.sample.records import (
    callbacks_y, counts_y, money_ledger_y, purchases_y, rates_rows_y, stock_ledger_y)
from dura_templates.sample.sales import fiscal_day_open
from dura_templates.workbook.lists import shop_lists


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


def _phone_rows() -> list[list]:
    rows = []
    for ph, (name, loc, frm, to, *_rest) in PHONES.items():
        retired = to is not None
        fd = fiscal_day_open.get(ph)
        last = (datetime.combine(TODAY, LAST_SYNC_TODAY[ph]) if not retired else datetime.combine(to, time(16, 25)))
        rows.append([ph, name, loc, "Retired" if retired else "Active",
                     ", ".join(sorted({seller_for(ph, frm), seller_for(ph, to or TODAY)})), frm, to,
                     DEVICE_ID[ph], f"DURA-{ph}", "Retired" if retired else "On",
                     None if retired else date(2027, 2, 26),
                     fd["no"] if fd and not retired else "", last, "1.4.2" if not retired else "1.2.0",
                     "Screen broken; replaced by P4. ZIMRA device 21402 retired." if retired else ""])
    return rows


def _contacts(account: dict) -> list[list]:
    contacts = [[cid, n, "Customer", ty, pn, em, tin, vat, addr, loc, *account.get(cid, ("No", None, None)), "", "",
                 cid[:2], added, upd, "No" if merged else "Yes", merged, note]
                for cid, n, pn, em, ty, tin, vat, addr, loc, added, upd, merged, note in CUSTOMERS]
    contacts += [[sid, n, "Supplier", "Business", pn, em, tin, vat, "", "", "No", None, None, what, terms,
                  sid[:2], START, None, "Yes", "", note] for sid, n, pn, em, tin, vat, what, terms, note in SUPPLIERS]
    contacts.sort(key=lambda c_: (c_[0][:2], c_[0]))
    return contacts


def _currencies() -> list[list]:
    return [["USD", "US dollar", "Yes", "Prices, most sales, card, InnBucks, EcoCash USD", "Yes", "Yes", "0.01",
             "The pricing currency: every product has one USD price. Cents of USD change are often given in ZWG, or kept."],
            ["ZWG", "Zimbabwe Gold (ZiG)", "Yes", "Sales and change; EcoCash ZWG", "Yes", "Yes", "0.50",
             "ZWG price = USD price x today's rate (Exchange Rates), rounded to 0.50."],
            ["ZAR", "South African rand", "Yes", "Cash sales, mostly at the Mbare stall", "Yes", "No", "0.50",
             "ZAR price = USD price x today's rate, rounded to 0.50. Cash only."]]


def _payment_methods() -> list[list]:
    paynow_note = "Manual (SMS) before 4 May 2026; keys on the phones until the hub, 15 Aug 2026"
    return [["Cash USD", "USD", "Cash", "", "", "Cash count", "", "Yes", ""],
            ["Cash ZWG", "ZWG", "Cash", "", "", "Cash count", "", "Yes", ""],
            ["Cash ZAR", "ZAR", "Cash", "", "", "Cash count", "", "Yes", ""],
            ["EcoCash USD", "USD", "MobileWallet", "Shop Hub: Paynow", "Live", "Shop Hub (poll)", "In the Shop Hub", "Yes", paynow_note],
            ["EcoCash ZWG", "ZWG", "MobileWallet", "Shop Hub: Paynow", "Live", "Shop Hub (poll)", "In the Shop Hub", "Yes", paynow_note],
            ["InnBucks USD", "USD", "MobileWallet", "Shop Hub: Paynow", "Live", "Shop Hub (poll)", "In the Shop Hub", "Yes", ""],
            ["SmilePay USD", "USD", "MobileWallet", "Shop Hub: ZB SmilePay", "Sandbox", "Shop Hub (poll)", "In the Shop Hub", "No",
             "Being tried in test mode; check ZB's merchant API terms before going live"],
            ["Card USD", "USD", "Card", "Bank card machine", "", "Card machine slip", "", "Yes", "Separate card machine at the main shop"],
            ["Bank transfer USD", "USD", "BankTransfer", "", "", "Manual (bank SMS)", "", "Yes", "Business customers, and invoice payments"],
            ["Kept change USD", "USD", "Other (ask ZIMRA)", "", "", "Customer's balance", "", "Yes",
             "Change the shop kept for a customer, used to pay. Money type to confirm with ZIMRA"],
            ["On account USD", "USD", "Credit", "", "", "Customer's account", "", "Yes",
             "Invoices for contacts allowed an account"]]


def _settings() -> list[list]:
    return [list(s_) for s_ in [
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
        ("Shop page", "On", "On: anyone with the hub's address sees your name, address, phone, products and prices. Never costs, stock, staff or customers"),
    ]]


def _balances(account: dict) -> list[tuple]:
    parties = sorted({(r_[11], r_[7]) for r_ in money_ledger_y[2026] if r_[11]}, key=lambda k: (k[0] not in CUST, k[0]))
    rows = []
    for party, cur in parties:
        is_cust = party in CUST
        what = ("Account (invoices)" if party in account else "Kept change") if is_cust else "Supplier invoices"
        limit = account[party][1] if party in account else (KEPT_CHANGE_LIMIT if is_cust else None)
        rows.append((party, cur, what, limit))
    return rows


def sample_my_shop() -> dict:
    """Everything the sample's My Shop shows, keyed as `write_my_shop` reads it."""
    account = {"P1-C0008": ("Yes", D(150), ON_ACCOUNT_DAYS)}
    hs_names = {code: html.unescape(desc) for code, desc in csv.reader(open(HS_CODES_CSV, encoding="utf-8"))
                if code != "hsn_code"}
    return {
        "title": BUSINESS["Business name"],
        "sample": True,
        "lists": shop_lists(),
        "products": product_rows(),
        "stock": [(loc, pid) for loc, *_ in LOCATIONS for pid in PROD if active_product(pid, TODAY)],
        "locations": [[l, n, "Selling", a, ", ".join(p for p in phones_on(TODAY) if PHONES[p][1] == l), o, "Yes"]
                      for l, n, a, o in LOCATIONS],
        "summary_locations": [loc for loc, *_ in LOCATIONS],
        "phones": _phone_rows(),
        "staff": [[s_, n, r_, a, p, dl, cr, "No" if to and to < TODAY else "Yes", f, to, note]
                  for s_, n, r_, a, p, dl, cr, f, to, note in STAFF],
        "contacts": _contacts(account),
        "taxes": [[t["id"], t["name"], t["pct"], t["code"], date(2025, 1, 1),
                   "Copied from ZIMRA's configuration when fiscalisation is on. Sample values: confirm each product's VAT treatment."]
                  for t in TAXES.values()],
        "hs_codes": [(code, hs_names[code]) for code in sorted({p[7] for p in PRODUCTS})],
        "currencies": _currencies(),
        "payment_methods": _payment_methods(),
        "settings": _settings(),
        "rates": rates_rows_y[2026],
        "stock_ledger": stock_ledger_y[2026],
        "money_ledger": money_ledger_y[2026],
        "stock_counts": counts_y[2026],
        "purchases": purchases_y[2026],
        "callbacks": callbacks_y[2026],
        "balances": _balances(account),
        "months": None,  # the reports module works the sample's months out itself
        "files": None,
    }
