# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The monthly workbook, e.g. `2026-10 October`: sales, items, payments,
cash-ups, fiscal days, quotes, Activity and a Summary with charts.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path
from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.formatting.rule import ColorScaleRule
from openpyxl.utils import get_column_letter
from dura_templates.profile import PC
from dura_templates.sample.business import BUSINESS, PROD, business_dir, month_name
from dura_templates.sample.period import TODAY
from dura_templates.sample.records import activity_y, cashups_m, fdays_m, items_m, pays_m, quotes_m, sales_m
from dura_templates.workbook.headers import H_ACTIVITY, H_CASHUPS, H_FDAYS, H_ITEMS, H_PAYS, H_QUOTES, H_SALES
from dura_templates.workbook.lists import colour_status
from dura_templates.workbook.styles import BAD, BOLD, FMT, GOOD, INFO, OFF, TITLE_FONT, WARN, highlight
from dura_templates.workbook.tables import add_table, col, mark_formula_tab, readme


def month_summary(wb: Workbook, ym: str, data: dict, template: bool = False):
    """The month's Summary tab: totals by day, location, phone, seller, payment
    method and product, profit and VAT, and charts, all as formulas.

    `template=True` makes it period-neutral: the month comes from cell E1,
    which the hub writes (the month's first day), and the 31 day rows are
    formulas that stay blank for days the month doesn't have.
    """
    ws = wb.create_sheet("Summary")
    mark_formula_tab(ws)
    if template:
        ws["A1"] = "Summary of the month"
        ws["D1"] = "Month (its first day)"
        ws["D1"].font = BOLD
        ws["E1"].number_format = FMT["date"]
    else:
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
    if first > TODAY:
        pass  # a month made ahead of time: every day shows, all zero for now
    elif last > TODAY:
        last = TODAY
    r0 = r + 1
    if template:
        _template_days(ws, r0, S)
        r += 31
    d2 = first
    while d2 <= last and not template:
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
        for v in sorted({row[idx] for row in data["sales"]}):
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
    for method in sorted({row[7] for row in data["pays"]}):
        r += 1
        ws.cell(row=r, column=1, value=method)
        ws.cell(row=r, column=2, value=f'=SUMIFS(Payments!${P["Amount"]}:${P["Amount"]},Payments!${P["Method"]}:${P["Method"]},$A{r},Payments!${P["Status"]}:${P["Status"]},"<>Failed",Payments!${P["Status"]}:${P["Status"]},"<>Cancelled")').number_format = FMT["money"]
    # products
    r += 2
    I = {h: col(H_ITEMS, h) for h in ("Product ID", "Qty", "Line total", "Currency")}
    for c, h in enumerate(["Product ID", "Product", "Qty sold", "USD", "ZWG", "ZAR"], start=1):
        ws.cell(row=r, column=c, value=h).font = BOLD
    r_prod = r
    for pid in sorted({row[6] for row in data["items"]}):
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
    # profit and VAT: each sale converted at its own rate into the pricing currency
    r += 2
    ws.cell(row=r, column=1, value=f"Profit and VAT ({PC}; each sale at its own rate)").font = BOLD
    TP, VP, LC = col(H_SALES, f"Total ({PC})"), col(H_SALES, f"VAT ({PC})"), col(H_ITEMS, f"Line cost ({PC})")
    r1 = r + 1
    for label, f, fmt in (("Sales, VAT included", f"=SUM(Sales!{TP}:{TP})", "money"),
                          ("VAT in those sales", f"=SUM(Sales!{VP}:{VP})", "money"),
                          ("Sales before VAT", f"=B{r1}-B{r1 + 1}", "money"),
                          ("Cost of goods sold", f"=SUM('Items Sold'!{LC}:{LC})", "money"),
                          ("Gross profit", f"=B{r1 + 2}-B{r1 + 3}", "money"),
                          ("Gross margin", f"=IF(B{r1 + 2}=0,0,B{r1 + 4}/B{r1 + 2})", "pct100")):
        r += 1
        ws.cell(row=r, column=1, value=label)
        ws.cell(row=r, column=2, value=f).number_format = FMT[fmt]
    ws.cell(row=r1 + 4, column=1).font = ws.cell(row=r1 + 4, column=2).font = BOLD
    highlight(ws, f"B{r1 + 4}", f"B{r1 + 4}>0", GOOD)
    highlight(ws, f"B{r1 + 4}", f"B{r1 + 4}<0", BAD)
    r += 2
    for c, h in enumerate(["Output VAT, per currency (for the VAT return)", "USD", "ZWG", "ZAR"], start=1):
        ws.cell(row=r, column=c, value=h).font = BOLD
    r += 1
    ws.cell(row=r, column=1, value="VAT in this month's sales, less returns")
    for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=2):
        ws.cell(row=r, column=c, value=f'=SUMIFS(Sales!${S["VAT"]}:${S["VAT"]},Sales!${S["Currency"]}:${S["Currency"]},"{cur}")').number_format = FMT["money"]
    # visuals: busy days stand out, and three charts beside the tables
    for c in "DEF":
        ws.conditional_formatting.add(f"{c}{r0}:{c}{r_last}", ColorScaleRule(start_type="min", start_color="FFFFFF",
                                                                            end_type="max", end_color="63BE7B"))
    ws.conditional_formatting.add(f"B{r + 0}:D{r + 0}", ColorScaleRule(start_type="num", start_value=-5, start_color="F8696B",
                                                                     mid_type="num", mid_value=0, mid_color="FFFFFF",
                                                                     end_type="num", end_value=5, end_color="FFEB84"))
    if not data["sales"] and not template:
        ws.column_dimensions["A"].width = 44
        return
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
    if not template:  # a template has no product rows yet to chart
        ch = BarChart()
        ch.type = "bar"
        ch.title = "Items sold this month"
        ch.height, ch.width = 12, 18
        ch.add_data(Reference(ws, min_col=3, min_row=r_prod, max_row=r_prod_end), titles_from_data=True)
        ch.set_categories(Reference(ws, min_col=2, min_row=r_prod + 1, max_row=r_prod_end))
        ch.legend = None
        ws.add_chart(ch, "K34")
    ws.column_dimensions["A"].width = 44
    ws.column_dimensions["B"].width = 22
    for c in "CDEFGHI":
        ws.column_dimensions[c].width = 12
    ws.freeze_panes = "A5"


def _template_days(ws, r0: int, S: dict[str, str]) -> None:
    """31 day rows driven by the month in E1. Every formula is guarded, so a
    blank day never makes COUNTIFS count the empty cells of a whole column.
    """
    for k in range(31):
        r = r0 + k
        day = f'IF(MONTH($E$1+{k})=MONTH($E$1),$E$1+{k},"")'
        ws.cell(row=r, column=1, value=f'=IF($E$1="","",{day})').number_format = FMT["date"]
        guard = f'IF($A{r}="",""'
        ws.cell(row=r, column=2, value=f'={guard},COUNTIFS(Sales!${S["Date"]}:${S["Date"]},$A{r},Sales!${S["Type"]}:${S["Type"]},"<>Return"))')
        ws.cell(row=r, column=3, value=f'={guard},COUNTIFS(Sales!${S["Date"]}:${S["Date"]},$A{r},Sales!${S["Type"]}:${S["Type"]},"Return"))')
        for c, cur in enumerate(("USD", "ZWG", "ZAR"), start=4):
            ws.cell(row=r, column=c, value=f'={guard},SUMIFS(Sales!${S["Total"]}:${S["Total"]},Sales!${S["Date"]}:${S["Date"]},$A{r},Sales!${S["Currency"]}:${S["Currency"]},"{cur}"))').number_format = FMT["money"]
            ws.cell(row=r, column=c + 3, value=f'={guard},SUMIFS(Sales!${S["VAT"]}:${S["VAT"]},Sales!${S["Date"]}:${S["Date"]},$A{r},Sales!${S["Currency"]}:${S["Currency"]},"{cur}"))').number_format = FMT["money"]


def month_data(ym: str) -> dict:
    """The rows that belong to month `ym` ("2026-10"), from every collection."""
    return {"sales": sales_m[ym], "items": items_m[ym], "pays": pays_m[ym], "cashups": cashups_m[ym],
            "fdays": fdays_m[ym], "quotes": quotes_m[ym],
            "activity": [r for r in activity_y[int(ym[:4])] if f"{r[1]:%Y-%m}" == ym]}


def write_month(ym: str, data: dict | None = None, folder: Path | None = None, test: bool = False,
                template_path: Path | None = None):
    """Writes one month file into its year folder. Empty `data` gives a ready-made
    month, as the hub makes it; `test=True` labels it as the test shop.
    """
    data = data or month_data(ym)
    folder = folder or business_dir()
    y = ym[:4]
    wb = Workbook()
    n = len(data["sales"]) + 1
    ws = add_table(wb, "Sales", H_SALES, data["sales"], first=True)
    S = {h: col(H_SALES, h) for h in ("Type", "Fiscal status", "Payment status")}
    last = get_column_letter(len(H_SALES))
    highlight(ws, f"A2:{last}{n}", f'${S["Type"]}2="Return"', "FCE4D6")
    highlight(ws, f"A2:{last}{n}", f'${S["Type"]}2="Invoice"', "DDEBF7")
    PSL, DUE = S["Payment status"], col(H_SALES, "Due date")
    highlight(ws, f"{PSL}2:{PSL}{n}", f'AND(${PSL}2="Unpaid",${DUE}2<TODAY())', BAD)  # overdue
    colour_status(ws, H_SALES, "Payment status", n, {"Unpaid": "F4B183", "Refunded": OFF, "Paid": GOOD})
    colour_status(ws, H_SALES, "Fiscal status", n, {"Yellow": WARN, "Queued": INFO, "Not fiscalised": OFF, "Submitted": GOOD})
    add_table(wb, "Items Sold", H_ITEMS, data["items"])
    ws = add_table(wb, "Payments", H_PAYS, data["pays"])
    P = col(H_PAYS, "Status")
    n = len(data["pays"]) + 1
    highlight(ws, f"A2:{get_column_letter(len(H_PAYS))}{n}", f'OR(${P}2="Failed",${P}2="Cancelled")', "EDEDED")
    highlight(ws, f"A2:{get_column_letter(len(H_PAYS))}{n}", f'OR(${P}2="Kept",${P}2="On account",${P}2="Paid later")', "FFF2CC")
    ws = add_table(wb, "Cash-ups", H_CASHUPS, data["cashups"])
    n = len(data["cashups"]) + 1
    for cur in ("USD", "ZWG", "ZAR"):
        L = col(H_CASHUPS, f"Cash {cur} difference")
        highlight(ws, f"{L}2:{L}{n}", f"{L}2<0", "F8CBAD")
        highlight(ws, f"{L}2:{L}{n}", f"{L}2>0", "FFE699")
    add_table(wb, "Fiscal Days", H_FDAYS, data["fdays"])
    ws = add_table(wb, "Quotes", H_QUOTES, data["quotes"])
    Q = col(H_QUOTES, "Status")
    n = max(len(data["quotes"]), 1) + 1
    for status, colour in (("Open", "DDEBF7"), ("Accepted", "C6EFCE"), ("Expired", "EDEDED")):
        highlight(ws, f"A2:{get_column_letter(len(H_QUOTES))}{n}", f'${Q}2="{status}"', colour)
    ws = add_table(wb, "Activity", H_ACTIVITY, data["activity"])
    colour_activity(ws, len(data["activity"]) + 1)
    template = template_path is not None
    month_summary(wb, ym, data, template=template)
    month = "one month" if template else f"{datetime.strptime(ym, '%Y-%m'):%B %Y}"
    title = "Month file" if template else f"{month}{' (TEST)' if test else ''}: {BUSINESS['Business name']}"
    readme(wb, title, [
        *(["TEST MODE: practice data, kept apart from the live shop. Every ID starts with T-. Nothing here is a real sale."] if test else []),
        f"Everything that happened in {month}, from every phone: sales, money, cash-ups, fiscal days and who did what.",
        "Phones add rows here; nobody needs to type in this file.",
        "Rows appear once their phone has synced. A sale is filed in the month it happened, even if it synced later.",
        "Money is never added across currencies: USD, ZWG and ZAR always have their own columns.",
        *([] if template else ["SAMPLE DATA: the shop, people, tax IDs, rates and references are fictional."]),
    ], tabs=[
        ("Sales", "phones", "One row per sale, invoice or return. Returns are pink and have negative totals; invoices on account are blue."),
        ("Items Sold", "phones", "One row per item line, at the price on the day."),
        ("Payments", "phones", "What was actually handed over: each payment, change given, change kept, refund, and later payment of an invoice."),
        ("Cash-ups", "phones", "One row per phone per day: cash expected against counted, per currency. Short is red, over is yellow."),
        ("Fiscal Days", "phones", "One row per ZIMRA fiscal day per phone, with its totals per currency."),
        ("Quotes", "phones", "Quotes shared with customers: open (blue), accepted (green, with its sale) or expired (grey). Not fiscal."),
        ("Activity", "phones", "Who did what, on which phone, and when. Pink: refunds, pay-outs, rejections. Yellow: stock alerts. Green: cash-ups."),
        ("Summary", "dura", "The month at a glance: by day, location, phone, seller, payment method and product; profit and VAT; charts."),
    ], questions=[
        ("How much did we sell on a day?", "Summary, the table by day (busy days are greener)"),
        ("Which seller's cash was short?", "Cash-ups: red cells, or the bottom of Summary"),
        ("What did a customer buy?", "Sales: filter Customer, then Items Sold by Sale ID"),
        ("Who still owes us for an invoice?", "Sales: orange 'Unpaid' cells (also My Shop, Balances)"),
        ("What did we make this month?", "Summary, 'Profit and VAT'"),
        ("Who gave a refund, and who approved it?", "Activity: filter Action = Refund"),
        ("Was a receipt accepted by ZIMRA?", "Sales: Fiscal status and Verification code"),
    ])
    path = template_path or folder / y / f"{month_name(ym)}.xlsx"
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def colour_activity(ws, n: int):
    """Colours Activity rows: pink for money out or rejections, yellow for stock
    alerts, green for cash-ups.
    """
    AC = col(H_ACTIVITY, "Action")
    last = get_column_letter(len(H_ACTIVITY))
    for words, colour in ((("Refund", "paid out", "Discount over limit", "rejected", "flagged", "skipped"), "FCE4D6"),
                          (("Stock alert",), "FFF2CC"), (("Cash-up",), "E2EFDA")):
        highlight(ws, f"A2:{last}{n}", "OR(" + ",".join(f'ISNUMBER(SEARCH("{w}",${AC}2))' for w in words) + ")", colour)
