"""Read the generated sample workbooks back and check they add up. Run: python3 check_samples.py "Dura POS"

Checks:
- totals, VAT, payments and cash-ups;
- ZIMRA numbering and fiscal days;
- stock against the ledger;
- balances, purchases, invoices and quotes;
- HS codes against ZIMRA's list.
"""
import csv
import sys
from collections import defaultdict
from datetime import datetime
from decimal import Decimal as D
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(sys.argv[1]).resolve()  # the "Dura POS" folder
BIZ = ROOT / "Chipo's Corner Shop"
TEST = ROOT / "Chipo's Corner Shop (TEST)"
problems = []


def rows(path, sheet):
	ws = load_workbook(path, read_only=True)[sheet]
	it = ws.iter_rows(values_only=True)
	head = next(it)
	return [dict(zip(head, r)) for r in it]


def dec(x):
	return D(str(x)) if x is not None else D(0)


months = sorted(BIZ.glob("20*/20*-*.xlsx"))
LEDGER = rows(BIZ / "2025" / "Ledger 2025.xlsx", "Stock Ledger 2025") + rows(BIZ / "My Shop.xlsx", "Stock Ledger")
MONEY = rows(BIZ / "2025" / "Ledger 2025.xlsx", "Money Ledger 2025") + rows(BIZ / "My Shop.xlsx", "Money Ledger")
CONTACTS = {c["Contact ID"]: c for c in rows(BIZ / "My Shop.xlsx", "Contacts")}
drawer = defaultdict(D)  # money paid out of a till before its cash-up
for r in MONEY:
	if r["From till"] == "Yes" and r["Type"] != "Takings collected":
		drawer[(r["Phone"], r["Date"].date(), r["Currency"])] += dec(r["Cash amount"])
all_sales = {}
later = defaultdict(D)
quotes = []
globals_by_device = defaultdict(list)
fdays_by_device = defaultdict(list)
sold_items = defaultdict(int)  # (phone, date, pid) -> qty
sale_ids = set()

for path in months:
	sales = rows(path, "Sales")
	items = rows(path, "Items Sold")
	pays = rows(path, "Payments")
	cashups = rows(path, "Cash-ups")
	fdays = rows(path, "Fiscal Days")
	items_by_sale = defaultdict(list)
	for i in items:
		items_by_sale[i["Sale ID"]].append(i)
		if i["Type"] == "Sale":
			sold_items[(i["Phone"], i["Date"].date(), i["Product ID"])] += i["Qty"]
	pays_by_sale = defaultdict(list)
	for p in pays:
		pays_by_sale[p["Sale ID"]].append(p)
		if p["Status"] == "Paid later":
			later[p["Sale ID"]] += dec(p["Amount in sale currency"])
	quotes += rows(path, "Quotes")
	for s in sales:
		sid = s["Sale ID"]
		if sid in sale_ids:
			problems.append(f"duplicate sale {sid}")
		sale_ids.add(sid)
		all_sales[sid] = s
		lines = items_by_sale[sid]
		if dec(s["Total"]) != sum(dec(l["Line total"]) for l in lines):
			problems.append(f"{sid}: total != sum of lines")
		if dec(s["VAT"]) != sum(dec(l["VAT"]) for l in lines):
			problems.append(f"{sid}: VAT != sum of line VAT")
		paid = sum(dec(p["Amount in sale currency"]) for p in pays_by_sale[sid]
		           if p["Status"] in ("Paid", "Given", "Refunded", "Kept", "On account"))
		if paid != dec(s["Total"]):
			problems.append(f"{sid}: payments {paid} != total {s['Total']}")
		if s["Fiscal status"] != "Not fiscalised":
			globals_by_device[s["ZIMRA device ID"]].append((s["ZIMRA receipt no"], s["Date"], s["Time"]))
	# cash-ups: recompute expected cash per currency
	cash = defaultdict(D)
	for p in pays:
		if p["Method"].startswith("Cash") and p["Status"] in ("Paid", "Given", "Refunded"):
			cash[(p["Phone"], p["Date"].date(), p["Currency"])] += dec(p["Amount"])
	for c in cashups:
		day = c["Date"].date()
		for cur in ("USD", "ZWG", "ZAR"):
			exp = dec(c[f"Float {cur}"]) + cash[(c["Phone"], day, cur)] + drawer[(c["Phone"], day, cur)]
			if exp != dec(c[f"Cash {cur} expected"]):
				problems.append(f"cash-up {c['Phone']} {day} {cur}: {exp} != {c[f'Cash {cur} expected']}")
	for f in fdays:
		fdays_by_device[f["ZIMRA device ID"]].append(f["Fiscal day no"])

# invoices on account: paid later never exceeds the invoice, and status matches
for sid, amount in later.items():
	s = all_sales[sid]
	if amount != dec(s["Total"]) or s["Payment status"] != "Paid":
		problems.append(f"invoice {sid}: paid later {amount}, total {s['Total']}, status {s['Payment status']}")
for sid, s in all_sales.items():
	if s["Type"] == "Invoice" and s["Payment status"] == "Unpaid" and sid in later:
		problems.append(f"invoice {sid} marked unpaid but paid")
	if s["Type"] == "Invoice" and not s["Due date"]:
		problems.append(f"invoice {sid} has no due date")

# quotes: accepted ones point to a real sale for the same customer
for q in quotes:
	if q["Status"] == "Accepted":
		s = all_sales.get(q["Sale ID"])
		if not s or s["Customer ID"] != q["Customer ID"]:
			problems.append(f"quote {q['Quote ID']}: bad sale {q['Sale ID']}")

# balances: kept change never negative or over the limit; ledger balance rows match purchases
bal = defaultdict(D)
for r in sorted(MONEY, key=lambda r: (r["Date"], r["Time"] or "")):
	if r["Contact ID"] and r["Balance change"] is not None:
		key = r["Contact ID"]
		if key not in CONTACTS:
			problems.append(f"money row {r['Row ID']}: unknown contact {key}")
		bal[key] += dec(r["Balance change"])
		if r["Type"].startswith("Change") and not (0 <= bal[key] <= 2):
			problems.append(f"kept change for {key} out of range: {bal[key]} on {r['Date']:%Y-%m-%d}")
purch = rows(BIZ / "2025" / "Ledger 2025.xlsx", "Purchases 2025") + rows(BIZ / "My Shop.xlsx", "Purchases")
stock_in = defaultdict(D)
for r in LEDGER:
	if r["Type"] == "Stock in":
		stock_in[r["Reference"]] += dec(r["Stock value (USD)"])
paid_rows = {r["Reference"] for r in MONEY if r["Type"] == "Supplier paid"}
for p in purch:
	if stock_in[p["Purchase ID"]] != dec(p["Total"]):
		problems.append(f"purchase {p['Purchase ID']}: stock in {stock_in[p['Purchase ID']]} != total {p['Total']}")
	if not 0 <= dec(p["VAT"]) <= dec(p["Total"]):
		problems.append(f"purchase {p['Purchase ID']}: VAT out of range")
	if (p["Payment status"] == "Paid") != (p["Purchase ID"] in paid_rows or p["Paid how"] == "On account" and p["Paid on"] is not None):
		problems.append(f"purchase {p['Purchase ID']}: status {p['Payment status']} doesn't match payments")
owed_bakery = sum(dec(p["Total"]) for p in purch if p["Payment status"] == "Unpaid")
BAKERY, CLINIC = "P1-C0001", "P1-C0008"
if owed_bakery != bal[BAKERY]:
	problems.append(f"bakery owed {bal[BAKERY]} != unpaid purchases {owed_bakery}")
for key, v in bal.items():
	if CONTACTS[key]["Type"] == "Supplier" and key != BAKERY and v:
		problems.append(f"cash supplier {key} has a balance {v}")
	if CONTACTS[key]["Type"] == "Customer" and key != CLINIC and v < 0:
		problems.append(f"customer {key} owes kept change {v}")
if bal[CLINIC] != -sum(dec(s["Total"]) for s in all_sales.values() if s["Type"] == "Invoice" and s["Payment status"] == "Unpaid"):
	problems.append("clinic balance != unpaid invoices")

# HS codes: every product's code is in ZIMRA's list
hs = {r[0] for r in csv.reader(open(ROOT.parent.parent / "reference" / "zimra_hs_codes.csv"))}
for p in rows(BIZ / "My Shop.xlsx", "Products"):
	if p["HS code"] not in hs:
		problems.append(f"{p['Product ID']}: HS code {p['HS code']} not in the ZIMRA list")

# fiscal numbering: continuous per device, in time order
for dev, nos in globals_by_device.items():
	by_no = sorted(nos)
	if [n for n, *_ in by_no] != list(range(1, len(by_no) + 1)):
		problems.append(f"device {dev}: global numbers not continuous")
	stamps = [(d_, t_) for _, d_, t_ in by_no]
	if any(b <= a for a, b in zip(stamps, stamps[1:])):
		problems.append(f"device {dev}: receipt times not strictly increasing with the global number (RCPT030)")
for dev, days in fdays_by_device.items():
	if days != list(range(1, len(days) + 1)):
		problems.append(f"device {dev}: fiscal day numbers not continuous")

# ledger: Sold rows match Items Sold; stock never negative
ledger = LEDGER
sold_ledger = defaultdict(int)
stock = defaultdict(int)
for r in ledger:
	if r["Type"] == "Sold":
		sold_ledger[(r["Phone"], r["Date"].date(), r["Product ID"])] += -r["Qty"]
for key in set(sold_items) | set(sold_ledger):
	if sold_items[key] != sold_ledger[key]:
		problems.append(f"ledger Sold {key}: {sold_ledger[key]} != items {sold_items[key]}")
for r in rows(BIZ / "My Shop.xlsx", "Stock Ledger"):
	if r["Product ID"]:
		stock[(r["Location"], r["Product ID"])] += r["Qty"]
neg = {k: v for k, v in stock.items() if v < 0}
if neg:
	problems.append(f"negative stock in Ledger 2026: {neg}")
closing = {(r["Location"], r["Product ID"]): r["Closing qty"] for r in rows(BIZ / "2025" / "Ledger 2025.xlsx", "Closing Stock 2025")}
s25 = defaultdict(int)
for r in rows(BIZ / "2025" / "Ledger 2025.xlsx", "Stock Ledger 2025"):
	if r["Product ID"]:
		s25[(r["Location"], r["Product ID"])] += r["Qty"]
if {k: v for k, v in s25.items() if v} != closing:
	problems.append("Closing Stock 2025 != Ledger 2025 summed")
opening26 = {(r["Location"], r["Product ID"]): r["Qty"] for r in rows(BIZ / "My Shop.xlsx", "Stock Ledger")
             if r["Type"] == "Opening" and r["Product ID"]}
if opening26 != closing:
	problems.append("Ledger 2026 opening rows != Closing Stock 2025")

low = [k for k, v in stock.items() if v <= 3]
# money in the pricing currency, Months, Files, photos, test separation
PC = "USD"
pc_by_month = defaultdict(D)
for path in months:
	for s_ in rows(path, "Sales"):
		pc_by_month[f"{s_['Date']:%Y-%m}"] += dec(s_[f"Total ({PC})"])
		if s_["Currency"] == PC and dec(s_[f"Total ({PC})"]) != dec(s_["Total"]):
			problems.append(f"{s_['Sale ID']}: Total ({PC}) differs from Total")
	cogs = sum(dec(i[f"Line cost ({PC})"]) for i in rows(path, "Items Sold"))
	ym = path.name[:7]
	sold_value = sum(dec(r[f"Stock value ({PC})"]) for r in LEDGER
	                 if r["Type"] in ("Sold", "Returned") and f"{r['Date']:%Y-%m}" == ym)
	if cogs != -sold_value:
		problems.append(f"{ym}: cost of goods sold {cogs} != stock ledger {-sold_value}")
for m in rows(BIZ / "My Shop.xlsx", "Months"):
	ym = f"{m['Year']}-{datetime.strptime(m['Month'], '%b').month:02d}"
	if dec(m[f"Sales incl VAT ({PC})"]) != pc_by_month[ym]:
		problems.append(f"Months {ym}: {m[f'Sales incl VAT ({PC})']} != month file {pc_by_month[ym]}")
listed = {f["File or folder"] for f in rows(BIZ / "My Shop.xlsx", "Files")}
for path in months:
	if path.stem not in listed:
		problems.append(f"{path.name} is not in the Files tab")
for prod in rows(BIZ / "My Shop.xlsx", "Products"):
	if not (BIZ / prod["Photo"]).exists():
		problems.append(f"{prod['Product ID']}: photo {prod['Photo']} missing")
for prod in rows(BIZ / "My Shop.xlsx", "Purchases"):
	if prod["Invoice photo"] and not (BIZ / prod["Invoice photo"]).exists():
		problems.append(f"{prod['Purchase ID']}: invoice photo missing")
test_ids = []
for path in TEST.glob("**/*.xlsx"):
	for ws_name in load_workbook(path, read_only=True).sheetnames:
		if ws_name in ("Read Me", "Summary", "Products", "Settings", "Cash-ups", "Fiscal Days", "Quotes"):
			continue
		for r in rows(path, ws_name):
			first = next(iter(r.values()))
			test_ids.append(first)
			if not str(first).startswith("T-"):
				problems.append(f"TEST {path.name}/{ws_name}: ID {first} doesn't start with T-")
for sid in sale_ids:
	if str(sid).startswith("T-"):
		problems.append(f"live sale {sid} has a test ID")
for s_ in rows(TEST / "2026" / "2026-10 October.xlsx", "Sales"):
	if s_["ZIMRA device ID"] in globals_by_device:
		problems.append(f"test sale {s_['Sale ID']} used a live ZIMRA device")

print(f"test shop rows checked: {len(test_ids)}; months with profit checked: {len(pc_by_month)}")
print(f"invoices: {sum(1 for s in all_sales.values() if s['Type'] == 'Invoice')}, quotes: {len(quotes)} "
      f"({sum(1 for q in quotes if q['Status'] == 'Accepted')} accepted), purchases: {len(purch)}, "
      f"kept-change customers: {sum(1 for k in bal if CONTACTS[k]['Type'] == 'Customer' and k != CLINIC)}, "
      f"kept change owed now: {sum(v for k, v in bal.items() if CONTACTS[k]['Type'] == 'Customer' and k != CLINIC)}, "
      f"bakery owed: {bal[BAKERY]}, clinic owes: {-bal[CLINIC]}")
print(f"sales checked: {len(sale_ids)}, fiscal devices: {sorted(globals_by_device)}, "
      f"stock lines: {len(stock)}, at or below 3 units today: {len(low)}")
print("PROBLEMS:" if problems else "All checks passed.")
for p in problems[:30]:
	print(" ", p)
