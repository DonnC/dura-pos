#!/usr/bin/env python3
"""Build the Dura POS sample workbooks.

The sample is a fictional Harare shop, "Chipo's Corner Shop", trading from
1 December 2025 to 28 October 2026 (today, part of the day only). It shows
every file and tab Dura writes to the owner's Google Drive, including the
2025 year-end archive. Run it with Python 3 and openpyxl:

    python3 generate_samples.py

It writes the "Dura POS" folder next to this script. All names, numbers,
tax IDs, rates and references are made up.
"""

from __future__ import annotations

import math
import random
import shutil
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import ROUND_HALF_EVEN, Decimal as D
from pathlib import Path

import csv
import html

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.formatting.rule import ColorScaleRule, FormulaRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).resolve().parent / "Dura POS"
HS_CODES_CSV = Path(__file__).resolve().parent.parent / "reference" / "zimra_hs_codes.csv"
START = date(2025, 12, 1)
TODAY = date(2026, 10, 28)
rng = random.Random(2026)

CENT = D("0.01")


def q2(x: D) -> D:
	return x.quantize(CENT, ROUND_HALF_EVEN)


def round_to(x: D, step: D) -> D:
	return ((x / step).quantize(D(1), ROUND_HALF_EVEN) * step).quantize(CENT)


def ceil_to(x: D, step: D) -> D:
	return (D(math.ceil(x / step)) * step).quantize(CENT)


def split_proportionally(total: D, weights: list[D]) -> list[D]:
	"""Split a cent amount by weights; parts sum exactly (largest remainder)."""
	cents = int(total * 100)
	wsum = sum(weights)
	if not wsum:
		return [D(0)] * len(weights)
	raw = [D(cents) * w / wsum for w in weights]
	parts = [int(r) for r in raw]
	rest = cents - sum(parts)
	for i in sorted(range(len(raw)), key=lambda i: raw[i] - parts[i], reverse=True)[:rest]:
		parts[i] += 1
	return [D(p) / 100 for p in parts]


# --------------------------------------------------------------------------
# The business
# --------------------------------------------------------------------------

BUSINESS = {
	"Business name": "Chipo's Corner Shop",
	"Legal name": "Chipo Moyo t/a Chipo's Corner Shop",
	"Owner": "Chipo Moyo",
	"TIN": "2000123456",
	"VAT number": "220012345",
	"Address": "7 Glen View 1, Harare",
	"Phone": "+263 77 000 0000",
	"Shop Google account": "chipos.cornershop@example.com",
}

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
	p = PROD[pid]
	price, cost = D(p[4]), D(p[5])
	for eff, np, nc in PRICE_CHANGES.get(pid, []):
		if day >= eff:
			price, cost = np, nc
	return price, cost


def active_product(pid: str, day: date) -> bool:
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
crng = random.Random(77)  # its own stream for customers, kept change and quotes

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
	if phone == "P1":
		return "Chipo Moyo"
	if phone == "P3":
		return "Farai Dube"
	return "Rudo Chari" if day <= date(2026, 6, 12) else "Tendai Ncube"


def phones_on(day: date) -> list[str]:
	return [ph for ph, p in PHONES.items() if p[2] <= day and (p[3] is None or day <= p[3])]


PAYNOW_LIVE = date(2026, 5, 4)
CALLBACKS_FROM = date(2026, 8, 15)
MONEY_TYPE = {"Cash": "Cash", "EcoCash": "MobileWallet", "InnBucks": "MobileWallet", "Card": "Card",
              "Bank transfer": "BankTransfer", "On account": "Credit",
              "Kept change": "Other (ask ZIMRA)"}  # see notes/02, question 12

# --------------------------------------------------------------------------
# Exchange rates (made up): ZWG and ZAR per 1 USD, set daily by the owner
# --------------------------------------------------------------------------

RATES: dict[date, tuple[D, D]] = {}
_zwg, _zar = 26.70, 17.80
d = START
while d <= TODAY:
	_zwg *= 1 + rng.gauss(0.00012, 0.0012)
	_zar *= 1 + rng.gauss(0, 0.004)
	RATES[d] = (D(str(round(_zwg, 2))), D(str(round(_zar, 2))))
	d += timedelta(days=1)


def unit_price(pid: str, day: date, cur: str) -> D:
	usd, _ = price_cost(pid, day)
	if cur == "USD":
		return usd
	zwg, zar = RATES[day]
	return round_to(usd * (zwg if cur == "ZWG" else zar), D("0.5"))


# --------------------------------------------------------------------------
# Output collections
# --------------------------------------------------------------------------

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
	key = (phone, kind, day)
	seq[key] += 1
	return f"{phone}-{kind}{day:%y%m%d}-{seq[key]:04d}"


def visible(phone: str, day: date, t: time) -> bool:
	"""Rows reach Drive only once their phone has synced."""
	return day < TODAY or t <= LAST_SYNC_TODAY.get(phone, time(23, 59))


def log(day: date, t: time, phone: str, who: str, action: str, details: str = "", ref: str = "", approved: str = ""):
	if not visible(phone, day, t):
		return
	role = "Owner" if who == "Chipo Moyo" else ("Seller" if who in {"Rudo Chari", "Farai Dube", "Tendai Ncube"} else "App")
	activity_y[day.year].append([next_id(phone, "A", day), day, t, phone, who, role, action, details, ref, approved])


def party_name(party: str) -> str:
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
			next_id(phone, "L", day), day, t, phone, who, loc, typ, pid, PROD[pid][1], qty, cost, q2(cost * qty),
			party, party_name(party), ref, note,
		])
	else:
		money_ledger_y[day.year].append([
			next_id(phone, "M", day), day, t, phone, who, loc, typ, cur, cash, drawer, party, party_name(party),
			balance, ref, note,
		])


# --------------------------------------------------------------------------
# Stock
# --------------------------------------------------------------------------

stock: dict[tuple[str, str], int] = defaultdict(int)
low_alerted: set[tuple[str, str, date]] = set()

PICKS_PER_SALE = 1.9
AVG_QTY = {"P018": 6.0, "P001": 1.3, "P011": 1.4, "P013": 1.3, "P015": 1.5}


def daily_demand(pid: str, loc: str, day: date) -> float:
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
	       f"{day:%Y}/Supplier invoices/{bid}.jpg" if sup == "P1-C0003" else "", who, note]
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
	       note=f"EcoCash to Glen View Bakery for {len(owed)} deliveries", party="P1-C0001", balance=-total)
	log(day, t, "P1", "Chipo Moyo", "Supplier paid", f"Glen View Bakery: USD {total:.2f} for {len(owed)} deliveries", ref)
	for r in owed:
		r[13], r[14] = "Paid", day  # the owner's phone updates the payment status cells
		unpaid_bakery.remove(r)


def move(day: date, t: time, pid: str, qty: int, ref: str):
	if qty <= 0:
		return
	stock[("Main", pid)] -= qty
	stock[("Mbare", pid)] += qty
	ledger(day, t, "P1", "Chipo Moyo", "Main", "Moved out", pid, -qty, ref=ref, note="To Mbare stall")
	ledger(day, t, "P3", "Farai Dube", "Mbare", "Moved in", pid, qty, ref=ref, note="From main shop")


def restock(day: date):
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
	level = stock[(loc, pid)]
	if level <= PROD[pid][8] and (loc, pid, day) not in low_alerted:
		low_alerted.add((loc, pid, day))
		state = "Out of stock" if level <= 0 else f"Low stock ({level} left)"
		log(day, t, phone, "Dura", "Stock alert", f"{state}: {PROD[pid][1]} at {loc}")


# --------------------------------------------------------------------------
# Sales
# --------------------------------------------------------------------------

counters = {ph: {"receipt": 0, "global": 0, "fday": 0} for ph in PHONES}
open_invoices: list[dict] = []  # invoices on account not yet paid
sales_by_phone_day: dict[tuple[str, date], list[dict]] = defaultdict(list)


def vcode() -> str:
	h = "".join(rng.choice("0123456789ABCDEF") for _ in range(16))
	return "-".join(h[i:i + 4] for i in range(0, 16, 4))


def sale_times(phone: str, day: date, n: int) -> list[time]:
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
		items_row = [sale["id"], i, day, phone, loc, "Sale", pid, PROD[pid][1], qty, unit_price(pid, day, cur), cur,
		             a, net, f"{tax['name']} ({tax['code']})", vat]
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
	       *fiscal, "Unpaid" if on_account else "Paid", sale["due"], sync_time(phone, day, t), note]
	if visible(phone, day, t):
		sales_m[f"{day:%Y-%m}"].append(row)
		pays_m[f"{day:%Y-%m}"].extend(pays)
	sale["row"] = row
	sales_by_phone_day[(phone, day)].append(sale)
	return sale


def sync_time(phone: str, day: date, t: time) -> datetime:
	return datetime.combine(day, t) + timedelta(minutes=rng.randint(1, 14))


fiscal_day_open: dict[str, dict] = {}


def fiscal_fields(phone: str, day: date, t: time) -> list:
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
	       "Refunded", None, sync_time(phone, day, t), reason]
	if visible(phone, day, t):
		sales_m[f"{day:%Y-%m}"].append(row)
		items_m[f"{day:%Y-%m}"].append([sale["id"], 1, day, phone, loc, "Return", pid, PROD[pid][1], -1, price, cur,
		                                D(0), total, f"{tax['name']} ({tax['code']})", vat])
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


# --------------------------------------------------------------------------
# Invoices on account and quotes
# --------------------------------------------------------------------------


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
	lines = [(pid, qty) for pid, qty in QUOTE_LINES[q[5]] if active_product(pid, q[1])]
	short = [(pid, min(qty, stock[("Main", pid)])) for pid, qty in lines]
	sale = book_sale("P1", day, t, [(pid, qty) for pid, qty in short if qty > 0], "USD", "Chipo Moyo",
	                 customer_id=q[5], note=f"From quote {q[0]}")
	q[11], q[12] = "Accepted", sale["id"]
	if short != lines:
		q[14] = "Part supplied: not enough stock on the day"
	elif sale["total"] != q[10]:
		q[14] = "Prices changed after the quote"


# --------------------------------------------------------------------------
# End of day
# --------------------------------------------------------------------------


CLOSE_OVERRIDE = {("P2", date(2026, 5, 19)): time(16, 30)}  # screen broke; cashed up early


def close_time(phone: str, day: date) -> time:
	return CLOSE_OVERRIDE.get((phone, day), PHONES[phone][7])


def close_day(phone: str, day: date):
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


# --------------------------------------------------------------------------
# Stock counts
# --------------------------------------------------------------------------


def last_weekday(year: int, month: int, weekday: int) -> date:
	d2 = date(year, month, 28) + timedelta(days=4)
	d2 = d2.replace(day=1) - timedelta(days=1)
	while d2.weekday() != weekday:
		d2 -= timedelta(days=1)
	return d2


def stock_count(day: date, loc: str, phone: str, who: str):
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


# --------------------------------------------------------------------------
# One-off events (Activity)
# --------------------------------------------------------------------------

EVENTS = {
	date(2025, 12, 1): [
		(time(6, 5), "P1", "Chipo Moyo", "Shop set up", "Dura installed; shop Google account linked; My Shop created"),
		(time(6, 10), "P1", "Chipo Moyo", "Products imported", "25 products from the My Shop sheet"),
		(time(6, 12), "P1", "Chipo Moyo", "Opening stock", "First stock count entered as opening stock"),
		(time(6, 15), "P2", "Chipo Moyo", "Phone joined", "P2 'Till - Main' signed in with the shop Google account"),
		(time(6, 16), "P1", "Chipo Moyo", "Seller added", "Rudo Chari, app only, PIN set on P2"),
	],
	date(2026, 1, 2): [
		(time(8, 0), "P1", "Dura", "Year-end archive", "2025 ledgers copied to 2025/Ledger 2025; Stock Ledger started 2026 with closing stock"),
	],
	date(2026, 2, 16): [(time(9, 0), "P1", "Chipo Moyo", "Fiscalisation", "ZIMRA test device registered on P1 and P2")],
	date(2026, 2, 20): [(time(18, 0), "P1", "Chipo Moyo", "Fiscalisation", "Test fiscal day closed without errors")],
	date(2026, 2, 23): [(time(10, 0), "P1", "Chipo Moyo", "Fiscalisation", "Sample invoice and credit note sent to ZIMRA")],
	date(2026, 2, 27): [(time(11, 0), "P1", "Chipo Moyo", "Fiscalisation", "ZIMRA approved; live devices 21401 and 21402 registered")],
	date(2026, 3, 1): [(time(6, 20), "P1", "Chipo Moyo", "Setting changed", "Fiscalisation turned on for P1 and P2")],
	date(2026, 3, 30): [
		(time(15, 0), "P3", "Chipo Moyo", "Phone joined", "P3 'Mbare stall' signed in with the shop Google account"),
		(time(15, 5), "P1", "Chipo Moyo", "Location added", "Mbare Musika stall"),
		(time(15, 10), "P1", "Chipo Moyo", "Fiscalisation", "Live device 21403 registered for P3"),
	],
	date(2026, 4, 1): [
		(time(6, 0), "P1", "Chipo Moyo", "Seller added", "Farai Dube, app only, PIN set on P3"),
	],
	date(2026, 5, 2): [(time(14, 0), "P1", "Chipo Moyo", "Payments", "Paynow keys added in sandbox mode; test payment OK")],
	date(2026, 5, 4): [(time(6, 15), "P1", "Chipo Moyo", "Payments", "Paynow switched to live (EcoCash, InnBucks)")],
	date(2026, 5, 19): [(time(16, 30), "P2", "Chipo Moyo", "Phone retired", "P2 screen broken; last synced 16:25; no unsent receipts")],
	date(2026, 5, 20): [
		(time(6, 0), "P4", "Chipo Moyo", "Phone joined", "P4 'Till - Main' restored from P2's backup"),
		(time(6, 5), "P4", "Chipo Moyo", "Fiscalisation", "New live device 21404 registered for P4; 21402 retired"),
	],
	date(2026, 6, 1): [(time(6, 10), "P1", "Chipo Moyo", "Price changed", "Cola 500ml: 0.70 to 0.75 USD (sheet edit applied)")],
	date(2026, 6, 12): [(time(19, 50), "P1", "Chipo Moyo", "Seller removed", "Rudo Chari; PIN removed from P4")],
	date(2026, 6, 13): [(time(6, 15), "P1", "Chipo Moyo", "Seller added", "Tendai Ncube, app only, PIN set on P4")],
	date(2026, 7, 4): [(time(21, 0), "P1", "Dura", "Sync: row skipped", "Products row 28 'Peanut butter 375ml' skipped: no price")],
	date(2026, 7, 6): [(time(7, 0), "P1", "Chipo Moyo", "Product added", "Peanut butter 375ml at 2.40 USD (sheet edit applied)")],
	date(2026, 8, 10): [(time(6, 10), "P1", "Chipo Moyo", "Price changed", "Sugar 2kg: 2.80 to 2.95 USD (app)")],
	date(2026, 8, 15): [(time(20, 0), "P1", "Chipo Moyo", "Payments", "Payment callback receiver (Apps Script) set up")],
	date(2026, 9, 14): [(time(13, 12), "P1", "Dura", "Payment callback rejected", "Signature did not match; no sale changed")],
	date(2026, 10, 1): [(time(6, 5), "P1", "Chipo Moyo", "Setting changed", "Seller discount limit kept at 5%")],
}
for day, evs in EVENTS.items():
	for t, ph, who, action, details in evs:
		log(day, t, ph, who, action, details)
for cid, name, *_rest in CUSTOMERS:
	ph, added = cid[:2], CUST[cid][9]
	log(added, time(10, 30), ph, seller_for(ph, added), "Customer added", name, cid)
log(date(2026, 3, 2), time(9, 40), "P1", "Chipo Moyo", "Customer changed", "Glen View Clinic Canteen: VAT number added", "P1-C0008")
log(CUSTOMER_MERGED_ON, time(7, 5), "P1", "Chipo Moyo", "Customers merged",
    "P3-C0001 'Mai Tafadzwa' merged into P1-C0006 (same phone number); old sales keep P3-C0001", "P1-C0006")
callbacks_y[2026].append([datetime(2026, 9, 14, 13, 12, 5), "Paynow", "PN00000000", D("50.00"), "USD", "Paid", "No",
                          "", "Rejected: bad signature", "Unknown reference; nothing recorded"])

# --------------------------------------------------------------------------
# Simulate
# --------------------------------------------------------------------------

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
	zwg, zar = RATES[day]
	rates_rows_y[day.year].append([day, zwg, zar, "Chipo Moyo", "Owner (street rate checked)", ""])
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
		banked = D(rng.randint(15, 30) * 10)
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

# --------------------------------------------------------------------------
# Workbook writing
# --------------------------------------------------------------------------

TITLE_FONT = Font(bold=True, size=13)
BOLD = Font(bold=True)
# Negative numbers are red everywhere: money out, stock out, short, owed.
FMT = {"money": "#,##0.00;[Red]-#,##0.00", "date": "d mmm yyyy", "time": "hh:mm", "datetime": "d mmm yyyy hh:mm",
       "rate": "0.00", "int": "0;[Red]-0", "pct": "0.0"}


def cell_value(v):
	return float(v) if isinstance(v, D) else v


# Every tab is coloured by who writes it, and each file's Read Me has the key.
KINDS = {  # kind: (tab colour, header fill, who writes it)
	"owner": ("70AD47", "E2EFDA", "You (the owner) edit it"),
	"phones": ("4472C4", "DDEBF7", "The phones add rows; don't edit"),
	"dura": ("A6A6A6", "EDEDED", "Dura works it out (formulas or lists); don't type in it"),
}


def fill(colour: str) -> PatternFill:
	return PatternFill("solid", fgColor=colour)


def highlight(ws, rng_: str, formula: str, colour: str):
	ws.conditional_formatting.add(rng_, FormulaRule(formula=[formula], fill=fill(colour)))


def add_table(wb: Workbook, title: str, headers: list[tuple[str, str | None, int]], rows: list[list],
              first: bool = False, kind: str = "phones"):
	ws = wb.active if first else wb.create_sheet()
	ws.title = title
	ws.sheet_properties.tabColor = KINDS[kind][0]
	ws.append([h for h, _, _ in headers])
	for c, (_, _, w) in enumerate(headers, start=1):
		cell = ws.cell(row=1, column=c)
		cell.font = BOLD
		cell.fill = fill(KINDS[kind][1])
		cell.alignment = Alignment(wrap_text=True, vertical="top")
		ws.column_dimensions[get_column_letter(c)].width = w
	for r in rows:
		ws.append([cell_value(v) for v in r])
	for c, (_, fmt, _) in enumerate(headers, start=1):
		if fmt:
			for (cell,) in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=c, max_col=c):
				cell.number_format = FMT[fmt]
	ws.freeze_panes = "A2"
	if rows:
		ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{ws.max_row}"
	return ws


def col(headers: list[tuple[str, str | None, int]], name: str) -> str:
	return get_column_letter([h for h, _, _ in headers].index(name) + 1)


def readme(wb: Workbook, title: str, lines: list[str], tabs: list[tuple[str, str, str]] = (),
           questions: list[tuple[str, str]] = ()):
	"""The first tab of every file: what it is, a colour key, each tab, and where to look."""
	ws = wb.create_sheet("Read Me", 0)
	ws.sheet_properties.tabColor = "1F3864"
	ws["A1"] = title
	ws["A1"].font = Font(bold=True, size=15, color="1F3864")
	r = 3
	for line in lines:
		ws.cell(row=r, column=1, value=line)
		r += 1
	r += 1
	ws.cell(row=r, column=1, value="Colour key").font = TITLE_FONT
	for kind, (tab, head, who) in KINDS.items():
		r += 1
		ws.cell(row=r, column=1, value=who).fill = fill(head)
		ws.cell(row=r, column=2).fill = fill(tab)
	if tabs:
		r += 2
		for c, h in enumerate(["Tab", "Who writes it", "What it is for"], start=1):
			ws.cell(row=r, column=c, value=h).font = BOLD
		for name, kind, what in tabs:
			r += 1
			ws.cell(row=r, column=1, value=name).fill = fill(KINDS[kind][1])
			ws.cell(row=r, column=2, value={"owner": "You", "phones": "The phones", "dura": "Dura"}[kind])
			ws.cell(row=r, column=3, value=what)
	if questions:
		r += 2
		ws.cell(row=r, column=1, value="Where to look").font = TITLE_FONT
		for q, a in questions:
			r += 1
			ws.cell(row=r, column=1, value=q)
			ws.cell(row=r, column=3, value=a)
	ws.column_dimensions["A"].width = 44
	ws.column_dimensions["B"].width = 14
	ws.column_dimensions["C"].width = 90


def mark_formula_tab(ws, protect: bool = True):
	ws.sheet_properties.tabColor = KINDS["dura"][0]
	if protect:
		ws.protection.sheet = True  # Dura sets a warning-only lock through the Sheets API


H_SALES = [("Sale ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7), ("Location", None, 9),
           ("Seller", None, 13), ("Receipt no", None, 13), ("Type", None, 7), ("Original sale", None, 18),
           ("Currency", None, 8), ("Items", "int", 6), ("Subtotal", "money", 10), ("Discount", "money", 9),
           ("Total", "money", 10), ("VAT", "money", 9), ("Paid by", None, 26), ("Change given", None, 22),
           ("Customer ID", None, 10), ("Customer", None, 22), ("Customer TIN", None, 12), ("Fiscal status", None, 16),
           ("ZIMRA device ID", None, 9), ("Fiscal day no", None, 8), ("ZIMRA receipt no", None, 10),
           ("Verification code", None, 20), ("Payment status", None, 10), ("Due date", "date", 11),
           ("Synced at", "datetime", 16), ("Note", None, 18)]
H_ITEMS = [("Sale ID", None, 18), ("Line", "int", 5), ("Date", "date", 11), ("Phone", None, 7), ("Location", None, 9),
           ("Type", None, 7), ("Product ID", None, 9), ("Product", None, 22), ("Qty", "int", 6),
           ("Unit price", "money", 10), ("Currency", None, 8), ("Discount", "money", 9), ("Line total", "money", 10),
           ("Tax", None, 18), ("VAT", "money", 9)]
H_PAYS = [("Payment ID", None, 20), ("Sale ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7),
          ("Seller", None, 13), ("Kind", None, 8), ("Method", None, 18), ("Currency", None, 8), ("Amount", "money", 10),
          ("Rate used", "rate", 8), ("Sale currency", None, 8), ("Amount in sale currency", "money", 11),
          ("Status", None, 10), ("Provider", None, 16), ("Provider reference", None, 14), ("Confirmed by", None, 20),
          ("ZIMRA money type", None, 13)]
H_CASHUPS = [("Date", "date", 11), ("Phone", None, 7), ("Location", None, 9), ("Seller", None, 13),
             ("Float USD", "money", 8), ("Float ZWG", "money", 8), ("Float ZAR", "money", 8),
             ("Cash USD expected", "money", 10), ("Cash USD counted", "money", 10), ("Cash USD difference", "money", 10),
             ("Cash ZWG expected", "money", 10), ("Cash ZWG counted", "money", 10), ("Cash ZWG difference", "money", 10),
             ("Cash ZAR expected", "money", 10), ("Cash ZAR counted", "money", 10), ("Cash ZAR difference", "money", 10),
             ("EcoCash USD", "money", 10), ("EcoCash ZWG", "money", 10), ("InnBucks USD", "money", 10),
             ("Card USD", "money", 10), ("Bank transfer USD", "money", 10), ("Kept change USD (kept today)", "money", 10),
             ("Kept change USD (used today)", "money", 10), ("Sales", "int", 6), ("Returns", "int", 7),
             ("Closed at", "time", 7), ("Note", None, 22)]
H_FDAYS = [("Phone", None, 7), ("ZIMRA device ID", None, 9), ("Fiscal day no", None, 8), ("Date", "date", 11),
           ("Opened at", "time", 8), ("Closed at", "time", 8), ("Receipts", "int", 8), ("Credit notes", "int", 8),
           ("Total USD", "money", 10), ("Total ZWG", "money", 11), ("Total ZAR", "money", 10),
           ("VAT USD", "money", 9), ("VAT ZWG", "money", 10), ("VAT ZAR", "money", 9), ("Status", None, 8),
           ("Note", None, 28)]
H_LEDGER = [("Row ID", None, 18), ("Date", "date", 12), ("Time", "time", 7), ("Phone", None, 7), ("Who", None, 13),
            ("Location", None, 9), ("Type", None, 14), ("Product ID", None, 9), ("Product", None, 22),
            ("Qty", "int", 6), ("Unit cost (USD)", "money", 9), ("Stock value (USD)", "money", 10),
            ("Supplier ID", None, 10), ("Supplier", None, 20), ("Reference", None, 18), ("Note", None, 30)]
H_MONEY = [("Row ID", None, 18), ("Date", "date", 12), ("Time", "time", 7), ("Phone", None, 7), ("Who", None, 13),
           ("Location", None, 9), ("Type", None, 18), ("Currency", None, 8), ("Cash amount", "money", 10),
           ("From till", None, 8), ("Contact ID", None, 10), ("Contact", None, 22), ("Balance change", "money", 10),
           ("Reference", None, 20), ("Note", None, 34)]
H_ACTIVITY = [("Row ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7), ("Who", None, 13),
              ("Role", None, 8), ("Action", None, 22), ("Details", None, 60), ("Reference", None, 18),
              ("Approved by", None, 13)]
H_COUNTS = [("Count ID", None, 20), ("Date", "date", 11), ("Location", None, 9), ("Counted by", None, 13),
            ("Product ID", None, 9), ("Product", None, 22), ("Expected", "int", 9), ("Counted", "int", 9),
            ("Difference", "int", 9), ("Unit cost (USD)", "money", 9), ("Value difference (USD)", "money", 11),
            ("Status", None, 8), ("Approved by", None, 13)]
H_CALLBACKS = [("Received at", "datetime", 16), ("Provider", None, 9), ("Reference", None, 12), ("Amount", "money", 10),
               ("Currency", None, 8), ("Provider status", None, 9), ("Signature valid", None, 9),
               ("Matched sale", None, 18), ("Result", None, 30), ("Note", None, 30)]
H_RATES = [("Date", "date", 11), ("ZWG per USD", "rate", 10), ("ZAR per USD", "rate", 10), ("Set by", None, 13),
           ("Source", None, 26), ("Note", None, 20)]
H_PRODUCTS = [("Product ID", None, 9), ("Name", None, 24), ("Category", None, 11), ("Unit", None, 7),
              ("Barcode", None, 14), ("Price USD", "money", 9), ("Cost USD", "money", 9), ("Tax", None, 18), ("HS code", None, 10),
              ("Low-stock level", "int", 9), ("Active", None, 7), ("Added on", "date", 11), ("Note", None, 30)]

H_PURCHASES = [("Purchase ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7),
               ("Location", None, 9), ("Supplier ID", None, 10), ("Supplier", None, 22), ("Supplier invoice no", None, 12),
               ("Products", "int", 8), ("Currency", None, 8), ("Total", "money", 10), ("VAT", "money", 9),
               ("Paid how", None, 13), ("Payment status", None, 10), ("Paid on", "date", 11),
               ("Invoice photo", None, 34), ("Received by", None, 13), ("Note", None, 26)]
H_QUOTES = [("Quote ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7), ("Seller", None, 13),
            ("Customer ID", None, 10), ("Customer", None, 22), ("Valid until", "date", 11), ("Currency", None, 8),
            ("Items", None, 60), ("Total", "money", 10), ("Status", None, 10), ("Sale ID", None, 18),
            ("Shared by", None, 10), ("Note", None, 30)]

# ---- monthly Sales files -------------------------------------------------


def month_summary(wb: Workbook, ym: str):
	ws = wb.create_sheet("Summary")
	mark_formula_tab(ws)
	ws["A1"] = f"Summary of {datetime.strptime(ym, '%Y-%m'):%B %Y}"
	ws["A1"].font = TITLE_FONT
	ws["A2"] = "Worked out by formulas from the other tabs in this file. Totals are net of returns."
	S = {h: col(H_SALES, h) for h in ("Date", "Type", "Currency", "Total", "VAT", "Phone", "Location", "Seller")}
	r = 4
	heads = ["Date", "Sales", "Returns", "USD", "ZWG", "ZAR", "VAT USD", "VAT ZWG", "VAT ZAR"]
	for c, h in enumerate(heads, start=1):
		ws.cell(row=r, column=c, value=h).font = BOLD
	y, m = map(int, ym.split("-"))
	first = date(y, m, 1)
	last = (first + timedelta(days=32)).replace(day=1) - timedelta(days=1)
	if last > TODAY:
		last = TODAY
	r0 = r + 1
	d2 = first
	while d2 <= last:
		r += 1
		ws.cell(row=r, column=1, value=d2).number_format = FMT["date"]
		ws.cell(row=r, column=2, value=f'=COUNTIFS(Sales!${S["Date"]}:${S["Date"]},$A{r},Sales!${S["Type"]}:${S["Type"]},"<>Return")')
		ws.cell(row=r, column=3, value=f'=COUNTIFS(Sales!${S["Date"]}:${S["Date"]},$A{r},Sales!${S["Type"]}:${S["Type"]},"Return")')
		for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=4):
			ws.cell(row=r, column=c, value=f'=SUMIFS(Sales!${S["Total"]}:${S["Total"]},Sales!${S["Date"]}:${S["Date"]},$A{r},Sales!${S["Currency"]}:${S["Currency"]},"{cur}")').number_format = FMT["money"]
			ws.cell(row=r, column=c + 3, value=f'=SUMIFS(Sales!${S["VAT"]}:${S["VAT"]},Sales!${S["Date"]}:${S["Date"]},$A{r},Sales!${S["Currency"]}:${S["Currency"]},"{cur}")').number_format = FMT["money"]
		d2 += timedelta(days=1)
	r_last = r
	r += 1
	ws.cell(row=r, column=1, value="Month").font = BOLD
	for c in range(2, 10):
		L = get_column_letter(c)
		cell = ws.cell(row=r, column=c, value=f"=SUM({L}{r0}:{L}{r - 1})")
		cell.font = BOLD
		if c >= 4:
			cell.number_format = FMT["money"]
	# by location, by phone, by seller
	for field, idx in (("Location", 4), ("Phone", 3), ("Seller", 5)):
		r += 2
		for c, h in enumerate([field, "Sales", "USD", "ZWG", "ZAR"], start=1):
			ws.cell(row=r, column=c, value=h).font = BOLD
		for v in sorted({row[idx] for row in sales_m[ym]}):
			r += 1
			ws.cell(row=r, column=1, value=v)
			ws.cell(row=r, column=2, value=f'=COUNTIFS(Sales!${S[field]}:${S[field]},$A{r},Sales!${S["Type"]}:${S["Type"]},"<>Return")')
			for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=3):
				ws.cell(row=r, column=c, value=f'=SUMIFS(Sales!${S["Total"]}:${S["Total"]},Sales!${S[field]}:${S[field]},$A{r},Sales!${S["Currency"]}:${S["Currency"]},"{cur}")').number_format = FMT["money"]
	# by payment method
	r += 2
	P = {h: col(H_PAYS, h) for h in ("Method", "Amount", "Status")}
	for c, h in enumerate(["Payment method", "Net received (in its own currency)"], start=1):
		ws.cell(row=r, column=c, value=h).font = BOLD
	for method in sorted({row[7] for row in pays_m[ym]}):
		r += 1
		ws.cell(row=r, column=1, value=method)
		ws.cell(row=r, column=2, value=f'=SUMIFS(Payments!${P["Amount"]}:${P["Amount"]},Payments!${P["Method"]}:${P["Method"]},$A{r},Payments!${P["Status"]}:${P["Status"]},"<>Failed",Payments!${P["Status"]}:${P["Status"]},"<>Cancelled")').number_format = FMT["money"]
	# products
	r += 2
	I = {h: col(H_ITEMS, h) for h in ("Product ID", "Qty", "Line total", "Currency")}
	for c, h in enumerate(["Product ID", "Product", "Qty sold", "USD", "ZWG", "ZAR"], start=1):
		ws.cell(row=r, column=c, value=h).font = BOLD
	r_prod = r
	for pid in sorted({row[6] for row in items_m[ym]}):
		r += 1
		ws.cell(row=r, column=1, value=pid)
		ws.cell(row=r, column=2, value=PROD[pid][1])
		ws.cell(row=r, column=3, value=f"=SUMIFS('Items Sold'!${I['Qty']}:${I['Qty']},'Items Sold'!${I['Product ID']}:${I['Product ID']},$A{r})")
		for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=4):
			ws.cell(row=r, column=c, value=f"=SUMIFS('Items Sold'!${I['Line total']}:${I['Line total']},'Items Sold'!${I['Product ID']}:${I['Product ID']},$A{r},'Items Sold'!${I['Currency']}:${I['Currency']},\"{cur}\")").number_format = FMT["money"]
	# cash-up differences
	r += 2
	for c, h in enumerate(["Cash-up differences", "USD", "ZWG", "ZAR"], start=1):
		ws.cell(row=r, column=c, value=h).font = BOLD
	r += 1
	ws.cell(row=r, column=1, value="All phones, this month")
	for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=2):
		L2 = col(H_CASHUPS, f"Cash {cur} difference")
		ws.cell(row=r, column=c, value=f"=SUM('Cash-ups'!{L2}:{L2})").number_format = FMT["money"]
	r_prod_end = r - 3  # the cash-up block sits three rows below the products
	# visuals: busy days stand out, and three charts beside the tables
	for c in "DEF":
		ws.conditional_formatting.add(f"{c}{r0}:{c}{r_last}", ColorScaleRule(start_type="min", start_color="FFFFFF",
		                                                                    end_type="max", end_color="63BE7B"))
	ws.conditional_formatting.add(f"B{r + 0}:D{r + 0}", ColorScaleRule(start_type="num", start_value=-5, start_color="F8696B",
	                                                                 mid_type="num", mid_value=0, mid_color="FFFFFF",
	                                                                 end_type="num", end_value=5, end_color="FFEB84"))
	cats = Reference(ws, min_col=1, min_row=r0, max_row=r_last)
	for i, (cur, colour) in enumerate((("USD", "2E75B6"), ("ZWG", "C55A11"))):
		ch = LineChart()
		ch.title = f"Sales per day ({cur}, net of returns)"
		ch.height, ch.width = 7, 18
		ch.add_data(Reference(ws, min_col=4 + i, min_row=4, max_row=r_last), titles_from_data=True)
		ch.set_categories(cats)
		ch.series[0].graphicalProperties.line.solidFill = colour
		ch.legend = None
		ch.x_axis.number_format = "d"
		ws.add_chart(ch, f"K{4 + i * 15}")
	ch = BarChart()
	ch.type = "bar"
	ch.title = "Items sold this month"
	ch.height, ch.width = 12, 18
	ch.add_data(Reference(ws, min_col=3, min_row=r_prod, max_row=r_prod_end), titles_from_data=True)
	ch.set_categories(Reference(ws, min_col=2, min_row=r_prod + 1, max_row=r_prod_end))
	ch.legend = None
	ws.add_chart(ch, "K34")
	ws.column_dimensions["A"].width = 30
	ws.column_dimensions["B"].width = 22
	for c in "CDEFGHI":
		ws.column_dimensions[c].width = 12
	ws.freeze_panes = "A5"


def write_month(ym: str):
	y = ym[:4]
	wb = Workbook()
	n = len(sales_m[ym]) + 1
	ws = add_table(wb, "Sales", H_SALES, sales_m[ym], first=True)
	S = {h: col(H_SALES, h) for h in ("Type", "Fiscal status", "Payment status")}
	last = get_column_letter(len(H_SALES))
	highlight(ws, f"A2:{last}{n}", f'${S["Type"]}2="Return"', "FCE4D6")
	highlight(ws, f"A2:{last}{n}", f'${S["Type"]}2="Invoice"', "DDEBF7")
	PSL, DUE = S["Payment status"], col(H_SALES, "Due date")
	highlight(ws, f"{PSL}2:{PSL}{n}", f'AND(${PSL}2="Unpaid",${DUE}2<TODAY())', BAD)  # overdue
	colour_status(ws, H_SALES, "Payment status", n, {"Unpaid": "F4B183", "Refunded": OFF, "Paid": GOOD})
	colour_status(ws, H_SALES, "Fiscal status", n, {"Yellow": WARN, "Queued": INFO, "Not fiscalised": OFF, "Submitted": GOOD})
	add_table(wb, "Items Sold", H_ITEMS, items_m[ym])
	ws = add_table(wb, "Payments", H_PAYS, pays_m[ym])
	P = col(H_PAYS, "Status")
	n = len(pays_m[ym]) + 1
	highlight(ws, f"A2:{get_column_letter(len(H_PAYS))}{n}", f'OR(${P}2="Failed",${P}2="Cancelled")', "EDEDED")
	highlight(ws, f"A2:{get_column_letter(len(H_PAYS))}{n}", f'OR(${P}2="Kept",${P}2="On account",${P}2="Paid later")', "FFF2CC")
	ws = add_table(wb, "Cash-ups", H_CASHUPS, cashups_m[ym])
	n = len(cashups_m[ym]) + 1
	for cur in ("USD", "ZWG", "ZAR"):
		L = col(H_CASHUPS, f"Cash {cur} difference")
		highlight(ws, f"{L}2:{L}{n}", f"{L}2<0", "F8CBAD")
		highlight(ws, f"{L}2:{L}{n}", f"{L}2>0", "FFE699")
	add_table(wb, "Fiscal Days", H_FDAYS, fdays_m[ym])
	ws = add_table(wb, "Quotes", H_QUOTES, quotes_m[ym])
	Q = col(H_QUOTES, "Status")
	n = max(len(quotes_m[ym]), 1) + 1
	for status, colour in (("Open", "DDEBF7"), ("Accepted", "C6EFCE"), ("Expired", "EDEDED")):
		highlight(ws, f"A2:{get_column_letter(len(H_QUOTES))}{n}", f'${Q}2="{status}"', colour)
	month_summary(wb, ym)
	month = f"{datetime.strptime(ym, '%Y-%m'):%B %Y}"
	readme(wb, f"{month} Sales: {BUSINESS['Business name']}", [
		f"Everything sold in {month}, from every phone. Phones add rows here; nobody needs to type in this file.",
		"Rows appear once their phone has synced. A sale is filed in the month it happened, even if it synced later.",
		"Money is never added across currencies: USD, ZWG and ZAR always have their own columns.",
		"SAMPLE DATA: the shop, people, tax IDs, rates and references are fictional.",
	], tabs=[
		("Sales", "phones", "One row per sale, invoice or return. Returns are pink and have negative totals; invoices on account are blue."),
		("Items Sold", "phones", "One row per item line, at the price on the day."),
		("Payments", "phones", "What was actually handed over: each payment, change given, change kept, refund, and later payment of an invoice."),
		("Cash-ups", "phones", "One row per phone per day: cash expected against counted, per currency. Short is red, over is yellow."),
		("Fiscal Days", "phones", "One row per ZIMRA fiscal day per phone, with its totals per currency."),
		("Quotes", "phones", "Quotes shared with customers: open (blue), accepted (green, with its sale) or expired (grey). Not fiscal."),
		("Summary", "dura", "The month at a glance: by day, phone, payment method and product, with charts."),
	], questions=[
		("How much did we sell on a day?", "Summary, the table by day (busy days are greener)"),
		("Which seller's cash was short?", "Cash-ups: red cells, or the bottom of Summary"),
		("What did a customer buy?", "Sales: filter Customer, then Items Sold by Sale ID"),
		("Who still owes us for an invoice?", "Sales: orange 'Unpaid' cells (also My Shop, Balances)"),
		("Was a receipt accepted by ZIMRA?", "Sales: Fiscal status and Verification code"),
	])
	path = OUT / y / f"{ym} Sales.xlsx"
	path.parent.mkdir(parents=True, exist_ok=True)
	wb.save(path)


# ---- My Shop ---------------------------------------------------------------


def ean13(pid: str) -> str:
	base = f"600{7310000 + int(pid[1:]) * 37:09d}"  # made up, Zimbabwe-style 600 prefix
	total = sum(int(c) * (3 if i % 2 else 1) for i, c in enumerate(base))
	return base + str((10 - total % 10) % 10)


# ---- Lists, dropdowns and date pickers ---------------------------------------

LIST_ROWS = 40  # room for the owner to add categories, units and terms


def shop_lists() -> list[tuple[str, list[str], bool]]:
	"""Every repeated choice in the sheets, as (name, values, owner can add to it)."""
	return [
		("Yes/No", ["Yes", "No"], False),
		("Category", sorted({p[2] for p in PRODUCTS}), True),
		("Unit", sorted({p[3] for p in PRODUCTS}), True),
		("Tax", [f"{t['name']} ({t['code']})" for t in TAXES.values()], False),
		("Contact type", ["Customer", "Supplier", "Customer and supplier"], False),
		("Person or business", ["Person", "Business"], False),
		("Usual location", [loc for loc, *_ in LOCATIONS] + ["Any"], False),
		("Location type", ["Selling", "Storage only"], False),
		("Role", ["Owner", "Manager", "Seller"], False),
		("App access", ["App only", "App and sheets (view)", "Full: app, sheets and settings"], False),
		("Refunds", ["Yes", "With owner PIN", "No"], False),
		("Discount limit", ["0%", "5%", "10%", "15%", "No limit"], True),
		("Supplier terms", sorted({s_[7] for s_ in SUPPLIERS} | {"7 days", "14 days", "30 days"}), True),
		("ZIMRA money type", ["Cash", "Card", "MobileWallet", "Coupon", "Credit", "BankTransfer", "Other",
		                      "Other (ask ZIMRA)"], False),
		("Mode", ["Sandbox", "Live"], False),
		("Phone status", ["Active", "Retired"], False),
	]


def write_lists(wb: Workbook) -> dict[str, str]:
	ws = wb.create_sheet("Lists")
	ws.sheet_properties.tabColor = KINDS["owner"][0]
	ranges = {}
	for c, (name, values, editable) in enumerate(shop_lists(), start=1):
		L = get_column_letter(c)
		cell = ws.cell(row=1, column=c, value=name)
		cell.font = BOLD
		cell.fill = fill(KINDS["owner" if editable else "dura"][1])
		for r, v in enumerate(values, start=2):
			ws.cell(row=r, column=c, value=v)
		ws.column_dimensions[L].width = max(14, max(len(v) for v in values + [name]) + 2)
		ranges[name] = f"Lists!${L}$2:${L}${LIST_ROWS + 1}"
	ws.freeze_panes = "A2"
	return ranges


def dropdown(ws, headers, column: str, source: str, strict: bool = True, rows: int = 500):
	"""A dropdown on a column. Not strict: suggests, but takes other values with a warning."""
	dv = DataValidation(type="list", formula1=source, allow_blank=True)
	dv.errorStyle = "stop" if strict else "warning"
	dv.error = "Pick one from the list (the Lists tab holds the choices)."
	ws.add_data_validation(dv)
	L = col(headers, column)
	dv.add(f"{L}2:{L}{rows}")


def date_picker(ws, headers, column: str, rows: int = 500):
	"""Date validation: Google Sheets shows a calendar for these cells."""
	dv = DataValidation(type="date", operator="greaterThan", formula1="36526", allow_blank=True)  # after 1 Jan 2000
	dv.errorStyle = "stop"
	dv.error = "Enter a date, or pick one from the calendar."
	ws.add_data_validation(dv)
	L = col(headers, column)
	dv.add(f"{L}2:{L}{rows}")


def colour_status(ws, headers, column: str, n: int, colours: dict[str, str]):
	L = col(headers, column)
	for word, colour in colours.items():
		highlight(ws, f"{L}2:{L}{n}", f'ISNUMBER(SEARCH("{word}",${L}2))', colour)


GOOD, WARN, BAD, INFO, OFF = "C6EFCE", "FFE699", "F8CBAD", "DDEBF7", "EDEDED"


def write_my_shop():
	wb = Workbook()
	product_rows = []
	for pid, name, cat, unit, price, cost, tax, hs, low, w, daily in PRODUCTS:
		p, c = price_cost(pid, TODAY)
		tx = TAXES[tax]
		active = "Yes" if active_product(pid, TODAY) else "No"
		note = {"P027": "Seasonal; stopped for winter", "P011": "Price changed 1 Jun 2026",
		        "P006": "Price changed 10 Aug 2026"}.get(pid, "")
		product_rows.append([pid, name, cat, unit, ean13(pid), p, c,
		                     f"{tx['name']} ({tx['code']})", hs, low, active, ADDED_ON[pid], note])
	ws_products = add_table(wb, "Products", H_PRODUCTS, product_rows, first=True, kind="owner")
	highlight(ws_products, f"A2:M{len(product_rows) + 1}", f'${col(H_PRODUCTS, "Active")}2="No"', OFF)
	lists = write_lists(wb)

	# Stock (formulas over this year's Stock Ledger)
	H_STOCK = [("Product ID", None, 9), ("Product", None, 24), ("Location", None, 9), ("In stock", "int", 9),
	           ("Low-stock level", "int", 9), ("Status", None, 10), ("Stock value (USD)", "money", 11),
	           ("Last received", "date", 12)]
	ws = add_table(wb, "Stock", H_STOCK, [], kind="dura")
	L = {h: col(H_LEDGER, h) for h in ("Date", "Location", "Type", "Product ID", "Qty")}
	PR = {h: col(H_PRODUCTS, h) for h in ("Low-stock level", "Cost USD")}
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
			ws.cell(row=r, column=7, value=f"=IFERROR($D{r}*INDEX(Products!${PR['Cost USD']}:${PR['Cost USD']},MATCH($A{r},Products!$A:$A,0)),0)").number_format = FMT["money"]
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
	         ("Credit limit USD", "money", 9), ("Payment days", "int", 8), ("Supplies", None, 22),
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
	           ["EcoCash USD", "USD", "MobileWallet", "Paynow", "Live", "Paynow (poll)", "On each phone, encrypted", "Yes", "Manual (SMS) before 4 May 2026"],
	           ["EcoCash ZWG", "ZWG", "MobileWallet", "Paynow", "Live", "Paynow (poll)", "On each phone, encrypted", "Yes", "Manual (SMS) before 4 May 2026"],
	           ["InnBucks USD", "USD", "MobileWallet", "Paynow", "Live", "Paynow (poll)", "On each phone, encrypted", "Yes", ""],
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
		("Pricing currency", "USD", "Every product has one price, in this currency"),
		("Accepted currencies", "USD, ZWG, ZAR", "Other currencies use the day's rate"),
		("Exchange rate", "Set daily by the owner", "See the Exchange Rates tab"),
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
		("Payment callbacks", "Apps Script receiver (since 15 Aug 2026)", "Optional; the till always confirms by polling"),
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
	for column in ("Difference", "Value difference (USD)"):
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
	parties = sorted({(r_[10], r_[7]) for r_ in money_ledger_y[2026] if r_[10]}, key=lambda k: (k[0] not in CUST, k[0]))
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
	for c, h in enumerate(["Stock by location", "🟢 OK", "🟡 Low", "🔴 Out", "Stock value (USD)"], start=1):
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

	G, V = col(H_LEDGER, "Type"), col(H_LEDGER, "Stock value (USD)")
	MG, M, N, BC = col(H_MONEY, "Type"), col(H_MONEY, "Cash amount"), col(H_MONEY, "Currency"), col(H_MONEY, "Balance change")
	r += 2
	ws.cell(row=r, column=1, value="Money owed (USD)").font = BOLD
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
	ws.cell(row=r, column=1, value="Year to date (USD at cost)").font = BOLD
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
	for c, h in enumerate(["Month", "Stock received", "Cost of goods sold", "Paid to suppliers (USD)"], start=1):
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
	ch.title = "Stock bought and sold each month (USD at cost)"
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
		("Exchange Rates", "owner", "Today's ZWG and ZAR rate per 1 USD. Prices in other currencies come from these."),
		("Stock Ledger", "phones", "Every stock movement this year: in (green), sold, moved, written off or counted short (pink)."),
		("Money Ledger", "phones", "Every money movement that isn't a sale: expenses, banking, suppliers, kept change, invoices."),
		("Stock Counts", "phones", "Each stock take: missing is red, extra found is yellow."),
		("Purchases", "phones", "Each supplier invoice: total, VAT, paid (green) or unpaid (orange)."),
		("Payment Callbacks", "phones", "Messages from Paynow (optional). Rejected ones are red."),
		("Balances", "dura", "Who owes what: kept change, invoices and suppliers, with a status dot."),
		("Summary", "dura", "Stock, money owed and the year so far, with charts."),
	], questions=[
		("What's running out?", "Stock (🟡 and 🔴 rows), or the chart in Summary"),
		("What happened to one product?", "Stock Ledger: filter Product ID (and Location)"),
		("How much is my stock worth?", "Summary, 'Stock by location'"),
		("Who owes me, and whom do I owe?", "Balances"),
		("How much kept change do I owe customers?", "Summary, 'Money owed'"),
		("What did I pay a supplier, and the VAT on it?", "Purchases"),
		("Where did cash go, apart from sales?", "Money Ledger"),
		("What did I sell in a month?", "That month's Sales file, in the year's folder"),
		("Who changed what, and when?", "Activity file in the year's folder"),
	])
	wb.save(OUT / "My Shop.xlsx")


def write_year_files():
	for year in (2025, 2026):
		wb = Workbook()
		ws = add_table(wb, f"Activity {year}", H_ACTIVITY, activity_y[year], first=True)
		AC = col(H_ACTIVITY, "Action")
		n = len(activity_y[year]) + 1
		last = get_column_letter(len(H_ACTIVITY))
		for words, colour in ((("Refund", "paid out", "Discount over limit", "rejected", "flagged", "skipped"), "FCE4D6"),
		                      (("Stock alert",), "FFF2CC"), (("Cash-up",), "E2EFDA")):
			highlight(ws, f"A2:{last}{n}", "OR(" + ",".join(f'ISNUMBER(SEARCH("{w}",${AC}2))' for w in words) + ")", colour)
		readme(wb, f"Activity {year}: {BUSINESS['Business name']}", [
			"The audit trail for the year: who did what, on which phone, and when. Phones only add rows here.",
			"Who: the person signed in on the phone (by PIN), or 'Dura' for things the app did by itself.",
			"Approved by: the owner, where an action needed the owner's PIN.",
			"Manual edits to any sheet are also recorded by Google's own version history (File > Version history).",
			"One file per year: a busy shop adds about 5,000 rows a year, far below what a sheet holds.",
			"SAMPLE DATA: fictional.",
		], tabs=[(f"Activity {year}", "phones", "One row per action. Pink: refunds, pay-outs, rejections and anything "
		                                        "that needed attention. Yellow: stock alerts. Green: cash-ups.")],
		   questions=[("Who gave a refund, and who approved it?", "Filter Action = Refund"),
		              ("When did a seller sign in?", "Filter Action = Signed in, and Who"),
		              ("What did the owner change?", "Filter Who = the owner")])
		(OUT / str(year)).mkdir(parents=True, exist_ok=True)
		wb.save(OUT / str(year) / f"Activity {year}.xlsx")
	# 2025 archive
	wb = Workbook()
	add_table(wb, "Stock Ledger 2025", H_LEDGER, stock_ledger_y[2025], first=True)
	add_table(wb, "Money Ledger 2025", H_MONEY, money_ledger_y[2025])
	add_table(wb, "Stock Counts 2025", H_COUNTS, counts_y[2025])
	add_table(wb, "Purchases 2025", H_PURCHASES, purchases_y[2025])
	add_table(wb, "Exchange Rates 2025", H_RATES, rates_rows_y[2025])
	add_table(wb, "Closing Stock 2025", [("Product ID", None, 9), ("Product", None, 24), ("Location", None, 9),
	                                     ("Closing qty", "int", 9), ("Unit cost (USD)", "money", 9),
	                                     ("Value (USD)", "money", 10)], closing_2025, kind="dura")
	readme(wb, f"Ledger 2025 (archive): {BUSINESS['Business name']}", [
		"Moved here from My Shop on 2 January 2026 by the owner's phone, after every phone had synced December.",
		"A closed year: nothing writes here any more, except late 2025 rows from a phone that synced after the archive",
		"(each such row also adds a correcting 'Opening' row in the new year's Ledger).",
		"The shop started using Dura on 1 December 2025, so this year has one month.",
		"SAMPLE DATA: fictional.",
	], tabs=[
		("Stock Ledger 2025", "phones", "Every stock movement in 2025."),
		("Money Ledger 2025", "phones", "Every money movement in 2025 that wasn't a sale."),
		("Stock Counts 2025", "phones", "The year's stock takes."),
		("Purchases 2025", "phones", "The year's supplier invoices, with VAT."),
		("Exchange Rates 2025", "owner", "The rates used each day."),
		("Closing Stock 2025", "dura", "The Ledger added up on 31 December: it equals the 'Opening' rows of the 2026 Stock Ledger."),
	])
	wb.save(OUT / "2025" / "Ledger 2025.xlsx")


def main():
	if OUT.exists():
		shutil.rmtree(OUT)
	OUT.mkdir(parents=True)
	for ym in sorted(sales_m):
		write_month(ym)
	write_my_shop()
	write_year_files()
	n_sales = sum(len(v) for v in sales_m.values())
	print(f"Wrote {OUT}: {n_sales} sales, {sum(len(v) for v in items_m.values())} item lines, "
	      f"{sum(len(v) for v in pays_m.values())} payment rows, {sum(len(v) for v in stock_ledger_y.values())} stock and "
	      f"{sum(len(v) for v in money_ledger_y.values())} money ledger rows, "
	      f"{sum(len(v) for v in activity_y.values())} activity rows.")


if __name__ == "__main__":
	main()
