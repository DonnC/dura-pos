# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The Lists tab that every dropdown reads from, and the helpers that add
dropdowns, date pickers and status colours to a tab.
"""

from __future__ import annotations

from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from dura_templates.sample.business import LOCATIONS, PRODUCTS, SUPPLIERS, TAXES
from dura_templates.workbook.accounts import METHOD_ACCOUNTS
from dura_templates.workbook.styles import BOLD, KINDS, fill, highlight
from dura_templates.workbook.tables import col


LIST_ROWS = 40  # room for the owner to add categories, units and terms


def shop_lists() -> list[tuple[str, list[str], bool]]:
    """The sample shop's choices behind every dropdown, as (name, values,
    owner can add to it). Templates start from `starter_lists` instead.
    """
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
        ("Money account", sorted(set(METHOD_ACCOUNTS.values())), False),
    ]


def starter_lists() -> list[tuple[str, list[str], bool]]:
    """The choices a new shop starts with: the same lists, without the sample's
    locations or supplier terms. Categories and units are common starters the
    owner can extend; tax names are replaced from ZIMRA once fiscalised.
    """
    starters = {
        "Usual location": ["Any"],
        "Supplier terms": ["Cash on delivery", "Cash on purchase", "7 days", "14 days", "30 days"],
    }
    return [(name, starters.get(name, values), editable) for name, values, editable in shop_lists()]


def write_lists(wb: Workbook, lists: list[tuple[str, list[str], bool]] | None = None) -> dict[str, str]:
    """Writes the Lists tab: one column per dropdown, with room to add values.
    Returns each list's range for `dropdown`.
    """
    ws = wb.create_sheet("Lists")
    ws.sheet_properties.tabColor = KINDS["owner"][0]
    ranges = {}
    for c, (name, values, editable) in enumerate(lists or shop_lists(), start=1):
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
    """Colours a status column's cells by the words they contain."""
    L = col(headers, column)
    for word, colour in colours.items():
        highlight(ws, f"{L}2:{L}{n}", f'ISNUMBER(SEARCH("{word}",${L}2))', colour)
