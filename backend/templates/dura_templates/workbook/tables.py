# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Building blocks for tabs: a formatted table with filters and frozen
headings, column lookup by heading, the Read Me tab, and formula tabs.
"""

from __future__ import annotations

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter
from dura_templates.workbook.styles import BOLD, FMT, KINDS, TITLE_FONT, cell_value, fill


def add_table(wb: Workbook, title: str, headers: list[tuple[str, str | None, int]], rows: list[list],
              first: bool = False, kind: str = "phones"):
    """A tab with a heading row, widths, number formats, filters and frozen
    headings, coloured by `kind` (who writes it). Returns the sheet.
    """
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
    """The column letter of a heading. Formulas look columns up this way, never by
    fixed letter.
    """
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
    """Marks a tab as Dura's (grey) and, by default, warning-locked against edits."""
    ws.sheet_properties.tabColor = KINDS["dura"][0]
    if protect:
        ws.protection.sheet = True  # Dura sets a warning-only lock through the Sheets API
