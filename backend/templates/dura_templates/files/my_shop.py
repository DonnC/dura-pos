# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""`My Shop`: the permanent workbook with products, contacts, staff, settings,
rates, ledgers, stock, balances and the owner's reports.

`write_my_shop` lays out whatever content it's given: the sample's (from
`files.my_shop_content`) or a clean template's (from `files.templates`).
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter
from dura_templates.profile import OTHER_CURRENCIES, PC
from dura_templates.files.reports import write_files_tab, write_months_and_reports
from dura_templates.sample.business import business_dir
from dura_templates.workbook.headers import H_CALLBACKS, H_COUNTS, H_LEDGER, H_MONEY, H_PRODUCTS, H_PURCHASES, H_RATES
from dura_templates.workbook.lists import colour_status, date_picker, dropdown, write_lists
from dura_templates.workbook.styles import BAD, BOLD, FMT, GOOD, INFO, OFF, WARN, fill, highlight
from dura_templates.workbook.tables import add_table, col, mark_formula_tab, readme



H_CON = [("Contact ID", None, 10), ("Name", None, 24), ("Type", None, 11), ("Person or business", None, 9),
         ("Phone no", None, 16), ("Email", None, 20), ("TIN", None, 11), ("VAT number", None, 11),
         ("Address", None, 22), ("Usual location", None, 9), ("On account", None, 9),
         (f"Credit limit ({PC})", "money", 9), ("Payment days", "int", 8), ("Supplies", None, 22),
         ("Supplier terms", None, 34), ("Added by", None, 7), ("Added on", "date", 12), ("Updated on", "date", 12),
         ("Active", None, 7), ("Merged into", None, 10), ("Note", None, 44)]


def stock_row_formulas(r: int) -> dict[int, tuple[str, str | None]]:
    """One Stock row's formulas, by column: column 1 is the product and 3 the
    location. They're over this year's Stock Ledger. The hub writes the same
    formulas for a real shop's products, from the template contract.
    """
    sled = "'Stock Ledger'"
    L = {h: col(H_LEDGER, h) for h in ("Date", "Location", "Type", "Product ID", "Qty")}
    PR = {h: col(H_PRODUCTS, h) for h in ("Low-stock level", f"Cost ({PC})")}
    last_in = (f"MAX(_xlfn.MAXIFS({sled}!${L['Date']}:${L['Date']},{sled}!${L['Product ID']}:${L['Product ID']},$A{r},"
               f"{sled}!${L['Location']}:${L['Location']},$C{r},{sled}!${L['Type']}:${L['Type']},\"Stock in\"),"
               f"_xlfn.MAXIFS({sled}!${L['Date']}:${L['Date']},{sled}!${L['Product ID']}:${L['Product ID']},$A{r},"
               f"{sled}!${L['Location']}:${L['Location']},$C{r},{sled}!${L['Type']}:${L['Type']},\"Moved in\"))")
    return {
        2: (f"=IFERROR(INDEX(Products!$B:$B,MATCH($A{r},Products!$A:$A,0)),\"\")", None),
        4: (f"=SUMIFS({sled}!${L['Qty']}:${L['Qty']},{sled}!${L['Product ID']}:${L['Product ID']},$A{r},{sled}!${L['Location']}:${L['Location']},$C{r})", "int"),
        5: (f"=IFERROR(INDEX(Products!${PR['Low-stock level']}:${PR['Low-stock level']},MATCH($A{r},Products!$A:$A,0)),0)", None),
        6: (f'=IF($D{r}<=0,"🔴 Out",IF($D{r}<=$E{r},"🟡 Low","🟢 OK"))', None),
        7: (f"=IFERROR($D{r}*INDEX(Products!${PR[f'Cost ({PC})']}:${PR[f'Cost ({PC})']},MATCH($A{r},Products!$A:$A,0)),0)", "money"),
        8: (f'=IF({last_in}=0,"",{last_in})', "date"),
    }


def balance_row_formulas(r: int) -> dict[int, str]:
    """One Balances row's formulas, by column. Column 1 is the contact, 4 what
    the balance is, 5 its currency and 8 its limit. The hub writes the same
    formulas for a real shop, from the template contract.
    """
    mled = "'Money Ledger'"
    B = {h: col(H_MONEY, h) for h in ("Date", "Contact ID", "Balance change", "Currency")}
    TY = col(H_CON, "Type")
    total = (f"SUMIFS({mled}!${B['Balance change']}:${B['Balance change']},{mled}!${B['Contact ID']}:"
             f"${B['Contact ID']},$A{r},{mled}!${B['Currency']}:${B['Currency']},$E{r})")
    return {
        2: f'=IFERROR(INDEX(Contacts!$B:$B,MATCH($A{r},Contacts!$A:$A,0)),"")',
        3: f'=IFERROR(INDEX(Contacts!${TY}:${TY},MATCH($A{r},Contacts!$A:$A,0)),"")',
        6: f"=MAX(0,{total})",
        7: f"=MAX(0,-{total})",
        9: (f'=IF(AND($H{r}<>"",MAX($F{r},$G{r})>$H{r}),"🔴 Over limit",IF($G{r}>0,"🟠 Owes the shop",'
            f'IF($F{r}>0,"🔵 Shop owes them","⚪ Settled")))'),
        10: (f"=_xlfn.MAXIFS({mled}!${B['Date']}:${B['Date']},{mled}!${B['Contact ID']}:"
             f"${B['Contact ID']},$A{r})"),
    }


def write_my_shop(content: dict | None = None, path: Path | None = None):
    """Writes My Shop: inputs the owner edits (products, contacts, staff,
    settings, rates), the ledgers phones add to, and the formula reports.

    `content` defaults to the sample's. A template passes its own, with
    `summary_locations` set to None so Reports lists locations by formula.
    """
    if content is None:
        from dura_templates.files.my_shop_content import sample_my_shop
        content = sample_my_shop()
    wb = Workbook()
    product_rows_ = content["products"]
    ws_products = add_table(wb, "Products", H_PRODUCTS, product_rows_, first=True, kind="owner")
    highlight(ws_products, f"A2:{get_column_letter(len(H_PRODUCTS))}{len(product_rows_) + 1}", f'${col(H_PRODUCTS, "Active")}2="No"', OFF)
    PH = col(H_PRODUCTS, "Photo")
    for r_ in range(2, len(product_rows_) + 2):
        cell = ws_products[f"{PH}{r_}"]
        cell.hyperlink = cell.value  # in Google Drive this is the photo's Drive link
        cell.font = Font(color="0563C1", underline="single")
    lists = write_lists(wb, content["lists"])

    # Stock (formulas over this year's Stock Ledger)
    H_STOCK = [("Product ID", None, 9), ("Product", None, 24), ("Location", None, 9), ("In stock", "int", 9),
               ("Low-stock level", "int", 9), ("Status", None, 10), (f"Stock value ({PC})", "money", 11),
               ("Last received", "date", 12)]
    ws = add_table(wb, "Stock", H_STOCK, [], kind="dura")
    sled, mled = "'Stock Ledger'", "'Money Ledger'"
    r = 1
    for loc, pid in content["stock"]:
        r += 1
        ws.cell(row=r, column=1, value=pid)
        ws.cell(row=r, column=3, value=loc)
        for column, (formula, fmt) in stock_row_formulas(r).items():
            cell = ws.cell(row=r, column=column, value=formula)
            if fmt:
                cell.number_format = FMT[fmt]
    ws.auto_filter.ref = f"A1:H{r}"
    highlight(ws, f"A2:H{r}", 'ISNUMBER(SEARCH("Out",$F2))', BAD)
    highlight(ws, f"A2:H{r}", 'ISNUMBER(SEARCH("Low",$F2))', WARN)
    mark_formula_tab(ws)

    H_LOC = [("Location", None, 9), ("Name", None, 22), ("Type", None, 12), ("Address", None, 34), ("Phones", None, 10),
             ("Opened on", "date", 12), ("Active", None, 7)]
    ws = add_table(wb, "Locations", H_LOC, content["locations"], kind="owner")
    dropdown(ws, H_LOC, "Type", lists["Location type"], rows=50)
    dropdown(ws, H_LOC, "Active", lists["Yes/No"], rows=50)
    date_picker(ws, H_LOC, "Opened on", rows=50)

    phone_rows = content["phones"]
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
    staff = content["staff"]
    ws = add_table(wb, "Staff", H_STAFF, staff, kind="owner")
    for column, source in (("Role", "Role"), ("App access", "App access"), ("Discount limit", "Discount limit"),
                           ("Can refund", "Refunds"), ("Active", "Yes/No")):
        dropdown(ws, H_STAFF, column, lists[source], rows=100)
    date_picker(ws, H_STAFF, "From", rows=100)
    date_picker(ws, H_STAFF, "To", rows=100)
    highlight(ws, f"A2:K{len(staff) + 1}", '$H2="No"', OFF)

    # Contacts: customers and suppliers in one list
    contacts = content["contacts"]
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
              content["taxes"])

    # HS codes: Dura carries ZIMRA's whole list and writes only the codes this shop uses, with their official wording
    used = content["hs_codes"]
    H_HS = [("HS code", None, 10), ("Official description (ZIMRA list)", None, 90), ("Products using it", "int", 9)]
    ws = add_table(wb, "HS Codes", H_HS, [[code, description, None] for code, description in used], kind="dura")
    HSC = col(H_PRODUCTS, "HS code")
    for r in range(2, len(used) + 2):
        ws.cell(row=r, column=3, value=f"=COUNTIF(Products!${HSC}:${HSC},$A{r})")
        ws.cell(row=r, column=2).alignment = Alignment(wrap_text=True, vertical="top")
    mark_formula_tab(ws)

    H_CUR = [("Currency", None, 9), ("Name", None, 20), ("Accepted", None, 9), ("Used for", None, 30),
             ("Cash", None, 6), ("Mobile money", None, 9), ("Price rounding", None, 10), ("Note", None, 50)]
    ws = add_table(wb, "Currencies", H_CUR, content["currencies"], kind="owner")
    for column in ("Accepted", "Cash", "Mobile money"):
        dropdown(ws, H_CUR, column, lists["Yes/No"], rows=20)
    currencies = "Currencies!$A$2:$A$20"

    H_PM = [("Method", None, 18), ("Currency", None, 8), ("ZIMRA money type", None, 16),
            ("Provider", None, 16), ("Mode", None, 8), ("Confirmed by", None, 24),
            ("Keys kept", None, 26), ("Active", None, 7), ("Note", None, 44), ("Account", None, 18)]
    pm_rows = content["payment_methods"]
    ws = add_table(wb, "Payment Methods", H_PM, pm_rows, kind="owner")
    dropdown(ws, H_PM, "Currency", currencies, rows=50)
    dropdown(ws, H_PM, "ZIMRA money type", lists["ZIMRA money type"], rows=50)
    dropdown(ws, H_PM, "Mode", lists["Mode"], rows=50)
    dropdown(ws, H_PM, "Active", lists["Yes/No"], rows=50)
    dropdown(ws, H_PM, "Account", lists["Money account"], rows=50)

    settings = content["settings"]
    add_table(wb, "Settings", [("Setting", None, 26), ("Value", None, 52), ("Note", None, 60)], settings,
              kind="owner")

    ws = add_table(wb, "Exchange Rates", H_RATES, content["rates"], kind="owner")
    date_picker(ws, H_RATES, "Date", rows=400)
    dropdown(ws, H_RATES, "Set by", "Staff!$B$2:$B$100", rows=400)

    # The two ledgers
    ws = add_table(wb, "Stock Ledger", H_LEDGER, content["stock_ledger"])
    n = len(content["stock_ledger"]) + 1
    LT = col(H_LEDGER, "Type")
    for types, colour in ((("Stock in", "Opening", "Moved in", "Returned"), GOOD), (("Written off", "Counted"), BAD),
                          (("Moved out",), WARN)):
        highlight(ws, f"{LT}2:{LT}{n}", "OR(" + ",".join(f'${LT}2="{t}"' for t in types) + ")", colour)
    ws = add_table(wb, "Money Ledger", H_MONEY, content["money_ledger"])
    n = len(content["money_ledger"]) + 1
    MT = col(H_MONEY, "Type")
    for types, colour in ((("Account paid", "Change used", "Opening", "Float added"), GOOD),
                          (("Expense", "Change paid out", "Supplier paid", "Cash difference"), BAD),
                          (("Purchase", "Invoiced on account", "Change kept"), WARN),
                          (("Takings collected", "Banked", "Till topped up", "Mobile money withdrawn", "Card paid into bank"), INFO)):
        highlight(ws, f"{MT}2:{MT}{n}", "OR(" + ",".join(f'${MT}2="{t}"' for t in types) + ")", colour)

    ws = add_table(wb, "Stock Counts", H_COUNTS, content["stock_counts"])
    n = len(content["stock_counts"]) + 1
    for column in ("Difference", f"Value difference ({PC})"):
        L2 = col(H_COUNTS, column)
        highlight(ws, f"{L2}2:{L2}{n}", f"{L2}2<0", BAD)
        highlight(ws, f"{L2}2:{L2}{n}", f"{L2}2>0", WARN)
    ws = add_table(wb, "Purchases", H_PURCHASES, content["purchases"])
    colour_status(ws, H_PURCHASES, "Payment status", len(content["purchases"]) + 1, {"Unpaid": "F4B183", "Paid": GOOD})
    ws = add_table(wb, "Payment Callbacks", H_CALLBACKS, content["callbacks"])
    colour_status(ws, H_CALLBACKS, "Result", len(content["callbacks"]) + 1, {"Rejected": BAD, "Duplicate": OFF})

    # Balances: kept change owed to customers, accounts owed by customers, amounts owed to suppliers
    H_BAL = [("Contact ID", None, 10), ("Name", None, 24), ("Type", None, 10), ("What", None, 18),
             ("Currency", None, 8), ("The shop owes them", "money", 11), ("They owe the shop", "money", 11),
             ("Limit", "money", 9), ("Status", None, 18), ("Last movement", "date", 12)]
    ws = add_table(wb, "Balances", H_BAL, [], kind="dura")
    r = 1
    for party, cur, what, limit in content["balances"]:
        r += 1
        values = {1: party, 4: what, 5: cur, 8: limit, **balance_row_formulas(r)}
        for c in range(1, 11):
            cell = ws.cell(row=r, column=c, value=values[c])
            if c in (6, 7, 8):
                cell.number_format = FMT["money"]
            if c == 10:
                cell.number_format = FMT["date"]
    colour_status(ws, H_BAL, "Status", r, {"Over limit": BAD, "Owes the shop": "F4B183", "Shop owes": INFO, "Settled": OFF})
    ws.auto_filter.ref = f"A1:J{r}"
    mark_formula_tab(ws)

    write_months_and_reports(wb, sled, mled, content["months"], content["title"], content["summary_locations"])
    write_files_tab(wb, content["files"])

    readme(wb, f"My Shop: {content['title']}" if content["title"] else "My Shop", [
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
        *(["SAMPLE DATA: the shop, people, tax IDs, rates and references are fictional."] if content["sample"] else []),
    ], tabs=[
        ("Products", "owner", f"Your price list: one {PC} price per product, cost, tax, HS code, low-stock level."),
        ("Lists", "owner", "The choices behind every dropdown. Add to the green columns; the grey ones are fixed."),
        ("Stock", "dura", "What's in stock at each location now: 🟢 OK, 🟡 low, 🔴 out."),
        ("Locations", "owner", "Your shops, branches, stalls or storerooms."),
        ("Phones", "phones", "Each phone: where it is, its ZIMRA device, last sync."),
        ("Staff", "owner", "You and your sellers: role and what each may do. PINs are not here."),
        ("Contacts", "owner", "Everyone the shop deals with: customers (blue) and suppliers (pink), in one list."),
        ("Taxes", "phones", "VAT rates, copied from ZIMRA."),
        ("HS Codes", "dura", "The ZIMRA HS codes your products use, with ZIMRA's wording. Hidden until fiscalisation is on."),
        ("Currencies", "owner", "USD, ZWG, ZAR: which you accept, and rounding."),
        ("Payment Methods", "owner", "Cash, mobile money, card, bank, kept change, account, and the account each one lands in. Keys are not here."),
        ("Settings", "owner", "Business details and how Dura behaves."),
        ("Exchange Rates", "owner", f"{' and '.join(OTHER_CURRENCIES)} per 1 {PC}, with the time and whether it's for the day. Other currencies' prices come from these."),
        ("Stock Ledger", "phones", "Every stock movement this year: in (green), sold, moved, written off or counted short (pink), with its debit and credit."),
        ("Money Ledger", "phones", "Every money movement that isn't a sale: expenses, banking, suppliers, kept change, invoices. A row with no accounts was posted in another tab."),
        ("Stock Counts", "phones", "Each stock take: missing is red, extra found is yellow."),
        ("Purchases", "phones", "Each supplier invoice: total, VAT, paid (green) or unpaid (orange)."),
        ("Payment Callbacks", "phones", "Messages from Paynow. Rejected ones are red. Hidden until online payments are on."),
        ("Balances", "dura", "Who owes what: kept change, invoices and suppliers, with a status dot."),
        ("Months", "dura", "One row per month, written by the Shop Hub when the month closes (to date for this month)."),
        ("Reports", "dura", "Income statement, VAT, cash flow, what the business owns and owes, the trial balance, and stock, with charts."),
        ("Files", "dura", "Every Dura file and folder for this shop, with its ID: Dura finds files here, never by name."),
    ], questions=[
        ("What's running out?", "Stock (🟡 and 🔴 rows), or the chart in Reports"),
        ("What happened to one product?", "Stock Ledger: filter Product ID (and Location)"),
        ("How much is my stock worth?", "Reports, 'Stock by location'"),
        ("Who owes me, and whom do I owe?", "Balances"),
        ("How much kept change do I owe customers?", "Reports, 'What the business owns and owes'"),
        ("What did I pay a supplier, and the VAT on it?", "Purchases"),
        ("Where did cash go, apart from sales?", "Money Ledger"),
        ("Did I make a profit this year?", "Reports, 'Income statement'"),
        ("How much VAT do I owe?", "Reports, 'VAT' (per currency)"),
        ("What did I sell in a month?", "That month's file, in the year's folder"),
        ("Who changed what, and when?", "The Activity tab in that month's file"),
    ])
    path = path or business_dir() / "My Shop.xlsx"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content["sample"]:
        for tab in ("HS Codes", "Payment Callbacks"):  # shown when fiscalisation or online payments are on
            wb[tab].sheet_state = "hidden"
    wb.save(path)
