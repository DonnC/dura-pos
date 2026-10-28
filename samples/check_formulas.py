"""Map every cross-tab formula reference to the heading it reads, to spot a formula pointing at the wrong column.
Run: python3 check_formulas.py "Dura POS"
"""
import re, sys
from pathlib import Path
from openpyxl import load_workbook
root = Path(sys.argv[1]) / "Chipo's Corner Shop"
ref = re.compile(r"(?:'([^']+)'|(\b[A-Za-z][A-Za-z ]*?))!\$([A-Z]+):\$?([A-Z]+)")
for path in [root / "My Shop.xlsx", root / "2026" / "2026-10 October.xlsx", root / "2025" / "Ledger 2025.xlsx"]:
    wb = load_workbook(path)
    heads = {ws.title: {c.column_letter: c.value for c in ws[1]} for ws in wb.worksheets}
    seen = {}
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str) and c.value.startswith("="):
                    for q, plain, a, b in ref.findall(c.value):
                        sheet = q or plain.strip()
                        if sheet not in heads:
                            print(f"{path.name}: {ws.title}!{c.coordinate} -> unknown sheet {sheet!r}")
                            continue
                        seen[(ws.title, sheet, a)] = heads[sheet].get(a)
    print(f"== {path.name}")
    for (src, sheet, colL), h in sorted(seen.items()):
        print(f"  {src:9} uses {sheet}!{colL} = {h!r}")
    # sample formulas
    if not {"Stock", "Summary"} & set(wb.sheetnames):
        continue
    ws = wb["Stock"] if "Stock" in wb.sheetnames else wb["Summary"]
    for coord in ("D2", "H2", "B6", "D6"):
        v = ws[coord].value
        if isinstance(v, str) and v.startswith("="):
            print(f"  sample {ws.title}!{coord}: {v[:160]}")
