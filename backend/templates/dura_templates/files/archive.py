# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""`Ledger 2025`: the closed year's stock and money ledgers, kept read-only in
the year folder.
"""

from __future__ import annotations

from openpyxl import Workbook
from dura_templates.files.reports import month_rows
from dura_templates.sample.business import BUSINESS, PC, business_dir
from dura_templates.sample.records import closing_2025, counts_y, money_ledger_y, purchases_y, rates_rows_y, stock_ledger_y
from dura_templates.workbook.headers import H_COUNTS, H_LEDGER, H_MONEY, H_MONTHS, H_PURCHASES, H_RATES
from dura_templates.workbook.tables import add_table, readme


def write_archive():
    # 2025 archive
    """Writes 2025/Ledger 2025: the closed year's ledgers, counts, purchases,
    rates, month totals and closing stock, read-only.
    """
    wb = Workbook()
    add_table(wb, "Stock Ledger 2025", H_LEDGER, stock_ledger_y[2025], first=True)
    add_table(wb, "Money Ledger 2025", H_MONEY, money_ledger_y[2025])
    add_table(wb, "Stock Counts 2025", H_COUNTS, counts_y[2025])
    add_table(wb, "Purchases 2025", H_PURCHASES, purchases_y[2025])
    add_table(wb, "Exchange Rates 2025", H_RATES, rates_rows_y[2025])
    add_table(wb, "Months 2025", H_MONTHS, month_rows(2025), kind="dura")
    add_table(wb, "Closing Stock 2025", [("Product ID", None, 9), ("Product", None, 24), ("Location", None, 9),
                                         ("Closing qty", "int", 9), (f"Unit cost ({PC})", "money", 9),
                                         (f"Value ({PC})", "money", 10)], closing_2025, kind="dura")
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
        ("Months 2025", "dura", "The year's month-by-month totals, as the Shop Hub wrote them."),
        ("Closing Stock 2025", "dura", "The Ledger added up on 31 December: it equals the 'Opening' rows of the 2026 Stock Ledger."),
    ])
    (business_dir() / "2025").mkdir(parents=True, exist_ok=True)
    wb.save(business_dir() / "2025" / "Ledger 2025.xlsx")
