# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Fail if any workbook uses a function outside the Excel-compatible allowlist.

Every template must calculate the same in Google Sheets and in Excel 2019 or
later. Run: python check_excel.py "sample/Dura POS"
"""

import re
import sys
from pathlib import Path

from openpyxl import load_workbook

# Functions that work the same in Google Sheets and Excel 2019+.
# MAXIFS and MINIFS need Excel 2019 or Microsoft 365; Excel 2016 lacks them.
ALLOWED = {
    "ABS", "AND", "AVERAGE", "AVERAGEIFS", "COUNTA", "COUNTIF", "COUNTIFS",
    "DATE", "DAY", "EOMONTH", "IF", "IFERROR", "INDEX", "MATCH", "MAX",
    "MAXIFS", "MIN", "MINIFS", "MONTH", "NOT", "OR", "ROUND", "SUM", "SUMIFS",
    "YEAR",
}

FUNCTION = re.compile(r"\b([A-Z][A-Z0-9.]*)\(")


def formulas(workbook):
    """Yield (location, formula) for every cell formula and validation rule."""
    for sheet in workbook.worksheets:
        for row in sheet.iter_rows():
            for cell in row:
                if isinstance(cell.value, str) and cell.value.startswith("="):
                    yield f"{sheet.title}!{cell.coordinate}", cell.value
        for rule in sheet.data_validations.dataValidation:
            for formula in (rule.formula1, rule.formula2):
                if formula:
                    yield f"{sheet.title} validation {rule.sqref}", str(formula)


def main(root):
    problems = []
    files = sorted(Path(root).rglob("*.xlsx"))
    for path in files:
        workbook = load_workbook(path)
        for where, formula in formulas(workbook):
            # Text inside quotes is data, not a function call.
            code = re.sub(r'"[^"]*"', '""', formula)
            for name in FUNCTION.findall(code):
                if name not in ALLOWED:
                    problems.append(f"{path.name} {where}: {name} in {formula}")
    if problems:
        print("\n".join(problems[:50]))
        print(f"{len(problems)} formulas use functions outside the allowlist.")
        return 1
    print(f"Excel-compatible: {len(files)} workbooks checked.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
