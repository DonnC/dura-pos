# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The Months, Reports and Files tabs of `My Shop`.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal as D
from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import ColorScaleRule
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter
from dura_templates.sample.business import BUSINESS, PC, month_name
from dura_templates.sample.period import START, TODAY
from dura_templates.sample.records import items_m, pays_m, sales_m
from dura_templates.workbook.headers import H_LEDGER, H_MONEY, H_MONTHS, H_PURCHASES
from dura_templates.workbook.lists import colour_status
from dura_templates.workbook.styles import BAD, BOLD, FMT, GOOD, INFO, LAYOUT_VERSION, OFF, fill, highlight
from dura_templates.workbook.tables import add_table, col, mark_formula_tab


def month_rows(year: int) -> list[list]:
    """What the Shop Hub writes into Months at each month end (and nightly for the current month)."""
    out = []
    for ym in sorted(sales_m):
        if int(ym[:4]) != year:
            continue
        sales, items, pays = sales_m[ym], items_m[ym], pays_m[ym]
        tot = sum((r[29] for r in sales), D(0))
        vat = sum((r[30] for r in sales), D(0))
        cogs = sum((r[16] for r in items), D(0))
        out_vat = {c: sum((r[14] for r in sales if r[9] == c), D(0)) for c in ("USD", "ZWG", "ZAR")}
        money_in = {c: sum((r[9] for r in pays if r[8] == c and r[13] in ("Paid", "Given", "Refunded", "Paid later")
                            and not r[7].startswith("Kept change")), D(0)) for c in ("USD", "ZWG", "ZAR")}
        y, m = map(int, ym.split("-"))
        closed = (date(y, m, 1) + timedelta(days=32)).replace(day=1)
        status = "Closed" if closed <= TODAY else "To date"
        written = f"Shop Hub, {closed:%d %b} 03:00" if status == "Closed" else f"Shop Hub, nightly ({TODAY - timedelta(days=1):%d %b})"
        if closed <= date(2026, 8, 15):
            written = f"Owner's phone, {closed:%d %b}"
        out.append([y, f"{date(y, m, 1):%b}", status, sum(1 for r in sales if r[7] != "Return"), tot, vat, tot - vat, cogs,
                    tot - vat - cogs, out_vat["USD"], out_vat["ZWG"], out_vat["ZAR"],
                    money_in["USD"], money_in["ZWG"], money_in["ZAR"], written])
    return out


def write_months_and_reports(wb: Workbook, sled: str, mled: str):
    """Adds My Shop's Months tab (one row per month, written when the month
    closes) and the Reports tab (year to date, by formula from Settings'
    Data year).
    """
    rows = month_rows(2026)
    ws = add_table(wb, "Months", H_MONTHS, rows, kind="dura")
    colour_status(ws, H_MONTHS, "Status", len(rows) + 1, {"To date": INFO, "Closed": OFF})
    mark_formula_tab(ws)

    ws = wb.create_sheet("Reports")
    mark_formula_tab(ws)
    ws["A1"] = f"{BUSINESS['Business name']}: financial reports"
    ws["A1"].font = Font(bold=True, size=15, color="1F3864")
    ws["A2"] = ("For running the business and for your accountant. Profit is in the pricing currency, each sale at its own "
                "rate; VAT and cash are per currency, never added together. Red numbers are negative.")
    ws["D1"], ws["E1"] = "Year (from Settings)", '=INDEX(Settings!$B:$B,MATCH("Data year",Settings!$A:$A,0))'
    ws["D1"].font = ws["E1"].font = BOLD
    M = {h: col(H_MONTHS, h) for h, _, _ in H_MONTHS}
    SL = {h: col(H_LEDGER, h) for h in ("Date", "Type", f"Stock value ({PC})")}
    ML = {h: col(H_MONEY, h) for h in ("Date", "Type", "Currency", "Cash amount", f"Cash amount ({PC})", "Balance change")}
    PU = {h: col(H_PURCHASES, h) for h in ("Date", "Currency", "VAT")}
    this_year = "Months!$A:$A,$E$1"
    ytd = lambda led, L: f'{led}!${L["Date"]}:${L["Date"]},">="&DATE($E$1,1,1)'
    section_fill = fill("D9E1F2")

    def title(r, text):
        for c in range(1, 6):
            ws.cell(row=r, column=c).fill = section_fill
        ws.cell(row=r, column=1, value=text).font = Font(bold=True, size=12)

    def line(r, label, formula, bold=False, fmt="money", col_=2):
        ws.cell(row=r, column=1, value=label).font = Font(bold=bold)
        cell = ws.cell(row=r, column=col_, value=formula)
        cell.number_format = FMT[fmt]
        cell.font = Font(bold=bold)
        return r + 1

    # 1. income statement
    r = 4
    title(r, f"1. Income statement, year to date ({PC})")
    r += 1
    r_is = r
    r = line(r, "Sales (before VAT)", f"=SUMIFS(Months!${M[f'Sales before VAT ({PC})']}:${M[f'Sales before VAT ({PC})']},{this_year})")
    r = line(r, "Cost of goods sold", f"=-SUMIFS(Months!${M[f'Cost of goods sold ({PC})']}:${M[f'Cost of goods sold ({PC})']},{this_year})")
    r = line(r, "Gross profit", f"=B{r_is}+B{r_is + 1}", bold=True)
    r = line(r, "Stock written off and lost in counts",
             f'=SUMIFS({sled}!${SL[f"Stock value ({PC})"]}:${SL[f"Stock value ({PC})"]},{sled}!${SL["Type"]}:${SL["Type"]},"Written off",{ytd(sled, SL)})'
             f'+SUMIFS({sled}!${SL[f"Stock value ({PC})"]}:${SL[f"Stock value ({PC})"]},{sled}!${SL["Type"]}:${SL["Type"]},"Counted",{ytd(sled, SL)})')
    r = line(r, "Expenses (levies, transport, ...)",
             f'=SUMIFS({mled}!${ML[f"Cash amount ({PC})"]}:${ML[f"Cash amount ({PC})"]},{mled}!${ML["Type"]}:${ML["Type"]},"Expense",{ytd(mled, ML)})')
    r = line(r, "Profit before tax", f"=B{r_is + 2}+B{r_is + 3}+B{r_is + 4}", bold=True)
    highlight(ws, f"B{r - 1}", f"B{r - 1}>0", GOOD)
    highlight(ws, f"B{r - 1}", f"B{r - 1}<0", BAD)
    ws.cell(row=r, column=1, value="Before tax, wages, rent and other costs Dura doesn't see: add those with your accountant.").font = Font(italic=True)
    r += 2
    for c, h in enumerate(["Month", "Sales before VAT", "Cost of goods sold", "Gross profit", "Gross margin"], start=1):
        ws.cell(row=r, column=c, value=h).font = BOLD
    r_m = r
    for m in range(1, 13):
        r += 1
        ws.cell(row=r, column=1, value=f"{date(2026, m, 1):%b}")
        key = f'{this_year},Months!${M["Month"]}:${M["Month"]},$A{r}'
        ws.cell(row=r, column=2, value=f"=SUMIFS(Months!${M[f'Sales before VAT ({PC})']}:${M[f'Sales before VAT ({PC})']},{key})").number_format = FMT["money"]
        ws.cell(row=r, column=3, value=f"=SUMIFS(Months!${M[f'Cost of goods sold ({PC})']}:${M[f'Cost of goods sold ({PC})']},{key})").number_format = FMT["money"]
        ws.cell(row=r, column=4, value=f"=B{r}-C{r}").number_format = FMT["money"]
        ws.cell(row=r, column=5, value=f"=IF(B{r}=0,0,D{r}/B{r})").number_format = FMT["pct100"]
    ws.conditional_formatting.add(f"E{r_m + 1}:E{r}", ColorScaleRule(start_type="num", start_value=0, start_color="F8696B",
                                                                    mid_type="percentile", mid_value=50, mid_color="FFEB84",
                                                                    end_type="max", end_color="63BE7B"))
    ch = BarChart()
    ch.title = f"Sales and gross profit by month ({PC})"
    ch.height, ch.width = 8, 16
    ch.add_data(Reference(ws, min_col=2, max_col=2, min_row=r_m, max_row=r), titles_from_data=True)
    ch.add_data(Reference(ws, min_col=4, max_col=4, min_row=r_m, max_row=r), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=1, min_row=r_m + 1, max_row=r))
    ch.series[0].graphicalProperties.solidFill = "4472C4"
    ch.series[1].graphicalProperties.solidFill = "70AD47"
    ws.add_chart(ch, "G4")

    # 2. VAT per currency
    r += 2
    title(r, "2. VAT, year to date, per currency (each currency is declared on its own)")
    r += 1
    for c, h in enumerate(["", "USD", "ZWG", "ZAR"], start=1):
        ws.cell(row=r, column=c, value=h).font = BOLD
    r += 1
    r_v = r
    ws.cell(row=r, column=1, value="Output VAT (in your sales)")
    ws.cell(row=r + 1, column=1, value="Input VAT (on supplier invoices)")
    ws.cell(row=r + 2, column=1, value="VAT to pay (output less input)").font = BOLD
    for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=2):
        L = get_column_letter(c)
        ws.cell(row=r, column=c, value=f"=SUMIFS(Months!${M[f'Output VAT {cur}']}:${M[f'Output VAT {cur}']},{this_year})").number_format = FMT["money"]
        ws.cell(row=r + 1, column=c, value=f'=SUMIFS(Purchases!${PU["VAT"]}:${PU["VAT"]},Purchases!${PU["Currency"]}:${PU["Currency"]},"{cur}",'
                                             f'Purchases!${PU["Date"]}:${PU["Date"]},">="&DATE($E$1,1,1))').number_format = FMT["money"]
        cell = ws.cell(row=r + 2, column=c, value=f"={L}{r}-{L}{r + 1}")
        cell.number_format, cell.font = FMT["money"], BOLD
    r += 3
    ws.cell(row=r, column=1, value=("ZIMRA's VAT periods and currency rules decide what is filed when: confirm with your accountant. "
                                    "Each month's figures are in that month's file, Summary.")).font = Font(italic=True)

    # 3. cash flow per currency
    r += 2
    title(r, "3. Cash flow, year to date, per currency")
    r += 1
    for c, h in enumerate(["", "USD", "ZWG", "ZAR"], start=1):
        ws.cell(row=r, column=c, value=h).font = BOLD
    flows = [("Money in from customers (all methods, less change and refunds)", "months", None),
             ("Paid to suppliers", "ledger", "Supplier paid"),
             ("Expenses", "ledger", "Expense"),
             ("Kept change paid out", "ledger", "Change paid out")]
    r_c = r + 1
    for label, kind, typ in flows:
        r += 1
        ws.cell(row=r, column=1, value=label)
        for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=2):
            if kind == "months":
                f = f"=SUMIFS(Months!${M[f'Money in {cur}']}:${M[f'Money in {cur}']},{this_year})"
            else:
                f = (f'=SUMIFS({mled}!${ML["Cash amount"]}:${ML["Cash amount"]},{mled}!${ML["Type"]}:${ML["Type"]},"{typ}",'
                     f'{mled}!${ML["Currency"]}:${ML["Currency"]},"{cur}",{ytd(mled, ML)})')
            ws.cell(row=r, column=c, value=f).number_format = FMT["money"]
    r += 1
    ws.cell(row=r, column=1, value="Net cash from trading").font = BOLD
    for c in range(2, 5):
        L = get_column_letter(c)
        cell = ws.cell(row=r, column=c, value=f"=SUM({L}{r_c}:{L}{r - 1})")
        cell.number_format, cell.font = FMT["money"], BOLD
    for typ in ("Takings collected", "Banked"):
        r += 1
        ws.cell(row=r, column=1, value=f"{typ} (moved, not spent)").font = Font(italic=True)
        for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=2):
            ws.cell(row=r, column=c, value=f'=SUMIFS({mled}!${ML["Cash amount"]}:${ML["Cash amount"]},{mled}!${ML["Type"]}:${ML["Type"]},"{typ}",'
                                           f'{mled}!${ML["Currency"]}:${ML["Currency"]},"{cur}",{ytd(mled, ML)})').number_format = FMT["money"]

    # 4. what the business owns and owes (Dura's part of a balance sheet)
    r += 2
    title(r, f"4. What the business owns and owes, today ({PC}, from Dura's records)")
    BC, MT = ML["Balance change"], ML["Type"]
    bal = lambda types: "+".join(f'SUMIFS({mled}!${BC}:${BC},{mled}!${MT}:${MT},"{t}")' for t in types)
    r += 1
    r = line(r, "Stock, at cost", "=SUM(Stock!$G:$G)")
    r = line(r, "Customers owe the shop (invoices)", f"=-({bal(('Invoiced on account', 'Account paid'))})")
    r = line(r, "Owed to suppliers", f"=-({bal(('Purchase', 'Supplier paid'))})")
    r = line(r, "Kept change owed to customers", f"=-({bal(('Change kept', 'Change used', 'Change paid out'))})")
    ws.cell(row=r, column=1, value=("Not in Dura: cash in hand and at the bank, equipment, loans, the owner's capital. "
                                    "Your accountant adds these for a full balance sheet. Who owes what: the Balances tab.")).font = Font(italic=True)
    ws.column_dimensions["A"].width = 58
    for c in "BCDE":
        ws.column_dimensions[c].width = 16


def fake_id(name: str) -> str:
    """A stable made-up Drive file ID for the Files tab."""
    import hashlib
    return "1" + hashlib.sha1(name.encode()).hexdigest()[:32]


def write_files_tab(wb: Workbook):
    """Adds the Files tab: every file and folder Dura made, with its ID, period
    and layout version. Phones and the hub find files here, never by name.
    """
    biz = BUSINESS["Business name"]
    rows = [["My Shop", "Main file", "Permanent", f"Dura POS/{biz}/", fake_id("myshop"), LAYOUT_VERSION, START, "P1 (setup)"]]
    for ym in sorted(set(sales_m) | {"2026-11"}):
        y, m = map(int, ym.split("-"))
        made = START if ym == f"{START:%Y-%m}" else (date(y, m, 1) - timedelta(days=1)).replace(day=25)
        rows.append([month_name(ym), "Month file", ym, f"Dura POS/{biz}/{y}/", fake_id(ym), LAYOUT_VERSION, made,
                     "Shop Hub" if made >= date(2026, 8, 15) else "P1 (owner's phone)"])
    rows.append(["Ledger 2025", "Year archive", "2025", f"Dura POS/{biz}/2025/", fake_id("ledger2025"), LAYOUT_VERSION,
                 date(2026, 1, 2), "P1 (owner's phone)"])
    rows.append(["Product photos", "Folder", "Permanent", f"Dura POS/{biz}/", fake_id("photos"), None, START, "P1 (setup)"])
    for y in (2025, 2026):
        rows.append([f"Supplier invoices {y}", "Folder", str(y), f"Dura POS/{biz}/{y}/", fake_id(f"inv{y}"), None,
                     START if y == 2025 else date(2025, 12, 1), "P1 (owner's phone)"])
    rows.append([f"{biz} (TEST)", "Test shop folder", "Test mode", "Dura POS/", fake_id("test"), LAYOUT_VERSION,
                 date(2026, 10, 27), "P4 (test mode)"])
    H_FILES = [("File or folder", None, 26), ("Kind", None, 14), ("Period", None, 10), ("Where", None, 34),
               ("File ID", None, 36), ("Layout version", "int", 8), ("Created on", "date", 12), ("Created by", None, 20)]
    ws = add_table(wb, "Files", H_FILES, rows, kind="dura")
    colour_status(ws, H_FILES, "Kind", len(rows) + 1, {"Test": "F4B183", "Main": GOOD})
    mark_formula_tab(ws)
