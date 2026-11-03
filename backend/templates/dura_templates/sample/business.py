# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Chipo's Corner Shop: the fictional business the sample describes.

Its settings, products and prices (with their changes over time), taxes,
locations, phones, staff, customers, suppliers, and the dates features
were switched on. Everything here is made up.
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal as D
from pathlib import Path
from dura_templates.paths import output_root
from dura_templates.sample.period import START, crng


BUSINESS = {
    "Business name": "Chipo's Corner Shop",
    "Legal name": "Chipo Moyo t/a Chipo's Corner Shop",
    "Owner": "Chipo Moyo",
    "TIN": "2000123456",
    "VAT number": "220012345",
    "Address": "7 Glen View 1, Harare",
    "Phone": "+263 77 000 0000",
    "Shop Google account": "chipos.cornershop@example.com",
    "Pricing currency": "USD",  # the owner's choice at setup; this sample shop prices in USD
}
PC = BUSINESS["Pricing currency"]



def month_name(ym: str) -> str:
    """The month file's name, e.g. '2026-10 October'."""
    return f"{ym} {datetime.strptime(ym, '%Y-%m'):%B}"





TAXES = {
    "STD": {"id": 3, "name": "Standard rated", "pct": D("15.5"), "code": "A"},
    "ZERO": {"id": 2, "name": "Zero rated", "pct": D("0"), "code": "B"},
    "EXEMPT": {"id": 1, "name": "Exempt", "pct": None, "code": "C"},
}

# id, name, category, unit, price USD, cost USD, tax, HS code, low level, weight, daily delivery
PRODUCTS = [
    ("P001", "White bread loaf 700g", "Bakery", "loaf", "1.00", "0.82", "ZERO", "19059010", 4, 18, True),
    ("P002", "Fresh milk 500ml", "Dairy", "pack", "0.90", "0.70", "ZERO", "04012000", 3, 8, True),
    ("P003", "Eggs, tray of 30", "Dairy", "tray", "5.50", "4.60", "ZERO", "04072100", 2, 2, False),
    ("P004", "Roller meal 10kg", "Groceries", "bag", "7.50", "6.40", "ZERO", "11022029", 3, 4, False),
    ("P005", "Rice 2kg", "Groceries", "pack", "2.90", "2.35", "STD", "10063020", 3, 4, False),
    ("P006", "Sugar 2kg", "Groceries", "pack", "2.80", "2.30", "STD", "17019900", 4, 6, False),
    ("P007", "Cooking oil 2L", "Groceries", "bottle", "3.90", "3.25", "STD", "15121910", 3, 5, False),
    ("P008", "Salt 1kg", "Groceries", "pack", "0.80", "0.55", "STD", "25010021", 3, 2, False),
    ("P009", "Tea leaves 250g", "Groceries", "pack", "1.50", "1.10", "STD", "09024000", 3, 2, False),
    ("P010", "Orange crush 2L", "Drinks", "bottle", "4.50", "3.70", "STD", "21069020", 2, 3, False),
    ("P011", "Cola 500ml", "Drinks", "bottle", "0.70", "0.52", "STD", "22021011", 12, 14, False),
    ("P012", "Cola 2L", "Drinks", "bottle", "2.00", "1.55", "STD", "22021011", 4, 4, False),
    ("P013", "Water 500ml", "Drinks", "bottle", "0.50", "0.30", "STD", "22011011", 12, 8, False),
    ("P014", "Maheu 500ml", "Drinks", "bottle", "0.60", "0.42", "STD", "22029910", 6, 6, False),
    ("P015", "Maputi 50g", "Snacks", "pack", "0.30", "0.18", "STD", "19041010", 15, 10, False),
    ("P016", "Biscuits 100g", "Snacks", "pack", "0.50", "0.33", "STD", "19053100", 12, 9, False),
    ("P017", "Crisps 50g", "Snacks", "pack", "0.50", "0.32", "STD", "20052000", 10, 6, False),
    ("P018", "Sweets (each)", "Snacks", "each", "0.05", "0.02", "STD", "17049000", 60, 7, False),
    ("P019", "Bath soap 100g", "Toiletries", "bar", "0.80", "0.55", "STD", "34011100", 5, 4, False),
    ("P020", "Toothpaste 100ml", "Toiletries", "tube", "1.50", "1.05", "STD", "33061000", 3, 2, False),
    ("P021", "Washing powder 500g", "Household", "pack", "1.80", "1.30", "STD", "34025000", 3, 3, False),
    ("P022", "Candles, pack of 6", "Household", "pack", "1.20", "0.85", "STD", "34060000", 3, 3, False),
    ("P023", "Matches, 10 boxes", "Household", "pack", "0.60", "0.40", "STD", "36050000", 4, 2, False),
    ("P024", "Paraffin 1L", "Household", "bottle", "1.40", "1.10", "STD", "27101916", 3, 2, False),
    ("P025", "Sanitary pads, pack", "Toiletries", "pack", "1.20", "0.85", "STD", "96190040", 3, 2, False),
    ("P026", "Peanut butter 375ml", "Groceries", "jar", "2.40", "1.85", "STD", "20081100", 3, 3, False),
    ("P027", "Freezit ice lolly", "Snacks", "each", "0.20", "0.12", "STD", "21050000", 20, 6, False),
]
PROD = {p[0]: p for p in PRODUCTS}
ADDED_ON = {pid: START for pid in PROD}
ADDED_ON["P026"] = date(2026, 7, 6)
SEASONAL_END = {"P027": date(2026, 5, 1)}  # stopped for winter
PRICE_CHANGES = {  # pid: [(effective date, new price, new cost)]
    "P011": [(date(2026, 6, 1), D("0.75"), D("0.56"))],
    "P006": [(date(2026, 8, 10), D("2.95"), D("2.42"))],
}


def price_cost(pid: str, day: date) -> tuple[D, D]:
    """The product's selling price and unit cost on `day`, after any price changes."""
    p = PROD[pid]
    price, cost = D(p[4]), D(p[5])
    for eff, np, nc in PRICE_CHANGES.get(pid, []):
        if day >= eff:
            price, cost = np, nc
    return price, cost


def active_product(pid: str, day: date) -> bool:
    """Whether the product was on sale on `day`: added, and not stopped for the season."""
    return ADDED_ON[pid] <= day and (pid not in SEASONAL_END or day < SEASONAL_END[pid])


LOCATIONS = [
    ("Main", "Main shop", "7 Glen View 1, Harare", date(2025, 12, 1)),
    ("Mbare", "Mbare Musika stall", "Stall 214, Mbare Musika, Harare", date(2026, 4, 1)),
]

# phone: name, location, from, to, mean sales/day, open on Sunday, opens, closes, float
PHONES = {
    "P1": ("Chipo's phone", "Main", date(2025, 12, 1), None, 9, True, time(6, 30), time(20, 0),
           {"USD": D(10), "ZWG": D(100), "ZAR": D(0)}),
    "P2": ("Till - Main (old)", "Main", date(2025, 12, 1), date(2026, 5, 19), 22, False, time(6, 30), time(19, 45),
           {"USD": D(20), "ZWG": D(200), "ZAR": D(50)}),
    "P4": ("Till - Main", "Main", date(2026, 5, 20), None, 22, False, time(6, 30), time(19, 45),
           {"USD": D(20), "ZWG": D(200), "ZAR": D(50)}),
    "P3": ("Mbare stall", "Mbare", date(2026, 4, 1), None, 26, False, time(7, 0), time(18, 0),
           {"USD": D(20), "ZWG": D(200), "ZAR": D(100)}),
}
DEVICE_ID = {"P1": 21401, "P2": 21402, "P3": 21403, "P4": 21404}
FISCAL_FROM = {"P1": date(2026, 3, 1), "P2": date(2026, 3, 1), "P3": date(2026, 4, 1), "P4": date(2026, 5, 20)}
LAST_SYNC_TODAY = {"P1": time(14, 5), "P4": time(14, 2), "P3": time(13, 40)}

STAFF = [
    # id, name, role, access, phones, discount limit, can refund, from, to, note
    ("S1", "Chipo Moyo", "Owner", "Full: app, sheets and settings", "All", "No limit", "Yes", date(2025, 12, 1), None, "Shop owner"),
    ("S2", "Rudo Chari", "Seller", "App only", "P2, P4", "5%", "With owner PIN", date(2025, 12, 1), date(2026, 6, 12), "Left in June 2026"),
    ("S3", "Farai Dube", "Seller", "App only", "P3", "5%", "With owner PIN", date(2026, 4, 1), None, "Runs the Mbare stall"),
    ("S4", "Tendai Ncube", "Seller", "App only", "P4", "5%", "With owner PIN", date(2026, 6, 13), None, ""),
]


# Customers are optional: most sales are walk-ins with no customer. The phone
# that adds a customer makes the ID, so two offline phones never clash.
# id, name, phone no, email, type, TIN, VAT no, address, usual location, added on, updated on, merged into, note
CUSTOMERS = [
    ("P1-C0008", "Glen View Clinic Canteen", "+263 24 200 0101", "canteen@example.com", "Business", "2000876543",
     "220087654", "12 Glen View Rd, Harare", "Main", date(2026, 2, 4), date(2026, 3, 2), "",
     "Weekly order on Wednesdays, paid by bank transfer. Buyer details go on its fiscal invoices"),
    ("P1-C0004", "Tsitsi Mutasa", "+263 77 410 2231", "", "Person", "", "", "", "Main", date(2025, 12, 3), None, "", ""),
    ("P1-C0005", "Baba Tanaka", "+263 71 288 9054", "", "Person", "", "", "", "Main", date(2025, 12, 9), None, "", ""),
    ("P1-C0006", "Mai Tafadzwa Gumbo", "+263 77 312 4567", "", "Person", "", "", "", "Any", date(2026, 1, 10),
     date(2026, 4, 12), "", "Also buys at Mbare"),
    ("P1-C0007", "Kudzai Sibanda", "+263 78 155 0042", "kudzai.s@example.com", "Person", "", "", "", "Main",
     date(2026, 1, 21), None, "", "Wants receipts by WhatsApp"),
    ("P1-C0009", "St Mary's Tuck Shop", "+263 77 900 1188", "", "Business", "", "", "Glen View 3, Harare", "Main",
     date(2026, 2, 17), None, "", "School tuck shop; no TIN given"),
    ("P2-C0001", "Nyasha Banda", "+263 71 640 7720", "", "Person", "", "", "", "Main", date(2025, 12, 15), None, "", ""),
    ("P2-C0002", "Sekuru Moyo", "+263 77 501 3390", "", "Person", "", "", "", "Main", date(2026, 1, 6), None, "", ""),
    ("P2-C0003", "Rumbi Chikore", "+263 78 770 1265", "", "Person", "", "", "", "Main", date(2026, 3, 18), None, "", ""),
    ("P3-C0001", "Mai Tafadzwa", "+263 77 312 4567", "", "Person", "", "", "", "Mbare", date(2026, 4, 11), None,
     "P1-C0006", "Added at Mbare while offline; same phone number as P1-C0006, merged by the owner"),
    ("P3-C0002", "Tapiwa Marufu", "+263 71 902 3418", "", "Person", "", "", "", "Mbare", date(2026, 4, 15), None, "", "Vendor next door"),
    ("P3-C0003", "Gogo Ndlovu", "+263 77 233 8801", "", "Person", "", "", "", "Mbare", date(2026, 5, 6), None, "", ""),
    ("P3-C0004", "Blessing Zhou", "+263 78 344 6120", "", "Person", "", "", "", "Mbare", date(2026, 7, 2), None, "", "Pays in rand"),
    ("P4-C0001", "Precious Mhlanga", "+263 77 819 4402", "", "Person", "", "", "", "Main", date(2026, 6, 2), None, "", ""),
    ("P4-C0002", "Simba Chirwa", "+263 71 377 2059", "", "Person", "", "", "", "Main", date(2026, 8, 19), None, "", ""),
    ("P4-C0003", "Ruvimbo Nyoni", "+263 78 260 9917", "", "Person", "", "", "", "Main", date(2026, 10, 5), None, "", "New this month"),
]
CUST = {c[0]: c for c in CUSTOMERS}
CUSTOMER_MERGED_ON = date(2026, 4, 12)


KEPT_CHANGE_FROM = date(2026, 2, 1)  # the owner turned on "kept change"
KEPT_CHANGE_LIMIT = D("2.00")  # most the shop keeps for one customer, in USD
ON_ACCOUNT_FROM = date(2026, 6, 3)  # the clinic canteen buys on account from June
ON_ACCOUNT_DAYS = 30
QUOTES_FROM = date(2026, 3, 1)

# Suppliers are added by the owner, so their IDs come from the owner's phone.
# id, name, phone no, email, TIN, VAT no, supplies, terms, note
SUPPLIERS = [
    ("P1-C0001", "Glen View Bakery", "+263 24 200 0202", "orders@example.com", "2000555111", "220055511", "Bread",
     "On account; paid every Saturday and on the last day of the month", "Delivers to both locations by 06:40"),
    ("P1-C0002", "Highfield Dairy Co-op", "+263 77 600 3300", "", "2000555222", "", "Fresh milk",
     "Cash on delivery", "Mbare pays the driver from the drawer"),
    ("P1-C0003", "Harare Cash & Carry", "+263 24 277 7000", "sales@example.com", "2000555333", "220055533",
     "Groceries, drinks, snacks, household", "Cash on purchase", "Owner's Monday and Thursday run"),
]
SUP = {s[0]: s for s in SUPPLIERS}
SUPPLIER_FOR = {"P001": "P1-C0001", "P002": "P1-C0002"}  # everything else comes from the wholesaler


def keeps_change(phone: str, customer: str) -> bool:
    """In the sample, kept change is handled on each location's till (not the owner's phone), so a
    balance is only ever used on the phone that holds it. See notes/08 for several tills."""
    return bool(customer) and phone != "P1" and CUST[customer][8] == PHONES[phone][1]


def pick_customer(phone: str, day: date) -> str:
    """About 1 sale in 15 has a known regular customer."""
    if crng.random() >= 0.065:
        return ""
    loc = PHONES[phone][1]
    ids = [c[0] for c in CUSTOMERS if c[4] == "Person" and c[8] in (loc, "Any") and c[9] <= day
           and not (c[11] and day >= CUSTOMER_MERGED_ON)]
    if loc == "Mbare" and day < CUSTOMER_MERGED_ON:
        ids = [i for i in ids if i != "P1-C0006"]  # Mbare knew her as P3-C0001 until the merge
    return crng.choice(ids) if ids else ""


def seller_for(phone: str, day: date) -> str:
    """Who sells on `phone` on `day`: the owner on P1, Farai on P3, Rudo then Tendai on P2/P4."""
    if phone == "P1":
        return "Chipo Moyo"
    if phone == "P3":
        return "Farai Dube"
    return "Rudo Chari" if day <= date(2026, 6, 12) else "Tendai Ncube"


def phones_on(day: date) -> list[str]:
    """The phones in use on `day`, from joining until retired."""
    return [ph for ph, p in PHONES.items() if p[2] <= day and (p[3] is None or day <= p[3])]


PAYNOW_LIVE = date(2026, 5, 4)
CALLBACKS_FROM = date(2026, 8, 15)
MONEY_TYPE = {"Cash": "Cash", "EcoCash": "MobileWallet", "InnBucks": "MobileWallet", "Card": "Card",
              "Bank transfer": "BankTransfer", "On account": "Credit",
              "Kept change": "Other (ask ZIMRA)"}  # see notes/02, question 12


def business_dir() -> Path:
    """The live shop's folder under the current output root."""
    return output_root() / BUSINESS["Business name"]


def test_dir() -> Path:
    """The test shop's folder, beside the live one."""
    return output_root() / f"{BUSINESS['Business name']} (TEST)"
