# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Workbook styles shared by every file: fonts, number formats (negatives are
red everywhere), status colours, and the tab colours that say who writes a
tab.
"""

from __future__ import annotations

import re
from decimal import Decimal as D
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Font, PatternFill


TITLE_FONT = Font(bold=True, size=13)
BOLD = Font(bold=True)
# Negative numbers are red everywhere: money out, stock out, short, owed.
FMT = {"pct100": "0.0%", "money": "#,##0.00;[Red]-#,##0.00", "date": "d mmm yyyy", "time": "hh:mm", "datetime": "d mmm yyyy hh:mm",
       "rate": "0.00", "int": "0;[Red]-0", "pct": "0.0"}


def cell_value(v):
    """A value as a cell stores it: Decimals become floats, everything else as is."""
    return float(v) if isinstance(v, D) else v


# Every tab is coloured by who writes it, and each file's Read Me has the key.
KINDS = {  # kind: (tab colour, header fill, who writes it)
    "owner": ("70AD47", "E2EFDA", "You (the owner) edit it"),
    "phones": ("4472C4", "DDEBF7", "The phones add rows; don't edit"),
    "dura": ("A6A6A6", "EDEDED", "Dura works it out (formulas or lists); don't type in it"),
}


def fill(colour: str) -> PatternFill:
    """A solid background fill of `colour` (hex RGB)."""
    return PatternFill("solid", fgColor=colour)


def highlight(ws, rng_: str, formula: str, colour: str):
    """Adds a conditional colour to `rng_` where `formula` is true. An empty tab
    still gets its rules on row 2, so the owner's first row is coloured too.
    """
    rng_ = re.sub(r"([A-Z]+)([01])$", r"\g<1>2", rng_)  # an empty tab still gets its colour rules on row 2
    ws.conditional_formatting.add(rng_, FormulaRule(formula=[formula], fill=fill(colour)))



GOOD, WARN, BAD, INFO, OFF = "C6EFCE", "FFE699", "F8CBAD", "DDEBF7", "EDEDED"

# The workbook layout version, recorded in each file so upgrades know what
# they're upgrading from.
LAYOUT_VERSION = 3
