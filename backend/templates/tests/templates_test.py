# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The clean templates: what the hub converts into a new shop's files.

Run from backend/templates: python -m unittest discover -s tests -p "*_test.py"
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from openpyxl import load_workbook

from dura_templates.checks import excel_compat
from dura_templates.fingerprint import folder_fingerprints
from dura_templates.paths import DEFAULT_TEMPLATES_DIR

CURRENCIES = ("USD", "ZWG", "ZAR")
SAMPLE_MARKERS = ("Chipo", "Mbare", "Glen View", "SAMPLE DATA", "Rudo", "P1-", "Harare")
MY_SHOP_DATA_TABS = ("Products", "Stock", "Locations", "Phones", "Staff", "Contacts", "Taxes", "HS Codes",
                     "Exchange Rates", "Stock Ledger", "Money Ledger", "Stock Counts", "Purchases",
                     "Payment Callbacks", "Balances", "Months", "Files")
MONTH_DATA_TABS = ("Sales", "Items Sold", "Payments", "Cash-ups", "Fiscal Days", "Quotes", "Activity")


def build(out: Path) -> None:
    subprocess.run([sys.executable, "-m", "dura_templates", "templates", "--out", str(out)],
                   check=True, capture_output=True)


class TemplatesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name) / "dist"
        build(cls.out)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def book(self, currency: str, name: str):
        return load_workbook(self.out / currency / name)

    def test_one_my_shop_and_one_month_file_per_pricing_currency(self):
        for code in CURRENCIES:
            self.assertTrue((self.out / code / "My Shop.xlsx").is_file())
            self.assertTrue((self.out / code / "Month.xlsx").is_file())

    def test_the_manifest_pins_each_file_by_its_sha256(self):
        manifest = json.loads((self.out / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(sorted(manifest["templates"]), sorted(CURRENCIES))
        for code, files in manifest["templates"].items():
            for entry in files.values():
                data = (self.out / entry["file"]).read_bytes()
                self.assertEqual(hashlib.sha256(data).hexdigest(), entry["sha256"])

    def test_the_manifest_names_the_cells_the_hub_fills(self):
        cells = json.loads((self.out / "manifest.json").read_text(encoding="utf-8"))["cells"]
        settings = self.book("USD", "My Shop.xlsx")["Settings"]
        for key, label in (("businessName", "Business name"), ("hubVersion", "Shop Hub"),
                           ("dataYear", "Data year")):
            sheet, address = cells["myShop"][key].split("!")
            self.assertEqual(sheet, "Settings")
            self.assertEqual(settings[f"A{address[1:]}"].value, label)
            self.assertEqual(address[0], "B")
        self.assertEqual(cells["month"]["period"], "Summary!E1")

    def test_the_contract_names_every_field_the_phones_write(self):
        contract = json.loads((self.out / "contract.json").read_text(encoding="utf-8"))
        sales = contract["tables"]["Sales"]
        self.assertEqual(sales["file"], "month")
        self.assertEqual(sales["fields"]["sale_id"], {"heading": "Sale ID", "kind": "text"})
        self.assertEqual(sales["fields"]["total"], {"heading": "Total", "kind": "money"})
        self.assertEqual(sales["fields"]["total_pricing"], {"heading": "Total ({pricing})", "kind": "money"})
        self.assertEqual(contract["tables"]["Stock Ledger"]["file"], "myShop")
        book = self.book("ZWG", "Month.xlsx")
        for table, spec in contract["tables"].items():
            if spec["file"] == "month":
                headings = [c.value for c in book[table][1]]
                self.assertEqual([f["heading"].replace("{pricing}", "ZWG") for f in spec["fields"].values()], headings)

    def test_the_contract_carries_the_stock_row_formulas(self):
        stock_row = json.loads((self.out / "contract.json").read_text(encoding="utf-8"))["stockRow"]
        self.assertEqual(sorted(stock_row), ["2", "4", "5", "6", "7", "8"])
        self.assertIn("$A{r}", stock_row["4"])
        self.assertNotIn("_xlfn", stock_row["8"])

    def test_the_names_the_hub_spells_are_in_the_templates(self):
        names = (Path(__file__).parents[2] / "hub" / "src" / "names.js").read_text(encoding="utf-8")

        def listed(table: str) -> list[str]:
            block = names.split(f"var {table} = Object.freeze({{")[1].split("}")[0]
            return re.findall(r"\w+: '([^']+)'", block)

        my_shop, month = self.book("USD", "My Shop.xlsx"), self.book("USD", "Month.xlsx")
        for tab in listed("TABLES_"):
            self.assertTrue(tab in my_shop.sheetnames or tab in month.sheetnames, tab)
        settings = {row[0] for row in my_shop["Settings"].iter_rows(values_only=True)}
        for setting in listed("SETTINGS_"):
            self.assertIn(setting, settings)
        headings = {cell.value for tab in ("Sales", "Items Sold", "Payments") for cell in month[tab][1]}
        for heading in listed("HEADINGS_"):
            self.assertIn(heading, headings)

    def test_the_month_summary_has_the_labels_the_hub_reads(self):
        summary = self.book("USD", "Month.xlsx")["Summary"]
        labels = {row[0] for row in summary.iter_rows(values_only=True)}
        for label in ("Month", "Sales, VAT included", "VAT in those sales", "Sales before VAT", "Cost of goods sold",
                      "Gross profit", "VAT in this month's sales, less returns"):
            self.assertIn(label, labels)

    def test_the_summary_reserves_rows_the_hub_labels(self):
        blocks = json.loads((self.out / "contract.json").read_text(encoding="utf-8"))["summaryBlocks"]
        ws = self.book("USD", "Month.xlsx")["Summary"]
        for key, heading in (("location", "Location"), ("phone", "Phone"), ("seller", "Seller"),
                             ("method", "Payment method"), ("product", "Product ID")):
            block = blocks[key]
            self.assertEqual(ws.cell(row=block["first"] - 1, column=1).value, heading)
            self.assertIsNone(ws.cell(row=block["first"], column=1).value)
            formula = ws.cell(row=block["first"] + block["rows"] - 1, column=3 if key == "product" else 2).value
            self.assertTrue(formula.startswith('=IF($A'), formula)

    def test_the_contract_carries_the_balance_row_formulas(self):
        row = json.loads((self.out / "contract.json").read_text(encoding="utf-8"))["balanceRow"]
        self.assertEqual(set(row), {"2", "3", "6", "7", "9", "10"})
        self.assertIn("$A{r}", row["6"])
        self.assertNotIn("_xlfn", row["10"])

    def test_a_rebuild_gives_the_same_bytes(self):
        with tempfile.TemporaryDirectory() as other:
            again = Path(other) / "dist"
            build(again)
            for code in CURRENCIES:
                for name in ("My Shop.xlsx", "Month.xlsx"):
                    self.assertEqual((self.out / code / name).read_bytes(), (again / code / name).read_bytes(),
                                     f"{code}/{name}")

    def test_no_sample_identity_appears_anywhere(self):
        for code in CURRENCIES:
            for name in ("My Shop.xlsx", "Month.xlsx"):
                for ws in self.book(code, name).worksheets:
                    for row in ws.iter_rows(values_only=True):
                        for value in row:
                            if isinstance(value, str):
                                for marker in SAMPLE_MARKERS:
                                    self.assertNotIn(marker, value, f"{code}/{name} {ws.title}")

    def test_data_tabs_hold_headings_only(self):
        my_shop, month = self.book("USD", "My Shop.xlsx"), self.book("USD", "Month.xlsx")
        for tab in MY_SHOP_DATA_TABS:
            self.assertEqual(my_shop[tab].max_row, 1, tab)
        for tab in MONTH_DATA_TABS:
            self.assertEqual(month[tab].max_row, 1, tab)

    def test_headings_and_settings_follow_the_pricing_currency(self):
        book = self.book("ZWG", "My Shop.xlsx")
        products = [c.value for c in book["Products"][1]]
        self.assertIn("Price (ZWG)", products)
        self.assertNotIn("Price (USD)", products)
        rates = [c.value for c in book["Exchange Rates"][1]]
        self.assertIn("USD per 1 ZWG", rates)
        self.assertIn("ZAR per 1 ZWG", rates)
        settings = {r[0]: r[1] for r in book["Settings"].iter_rows(min_row=2, values_only=True)}
        self.assertEqual(settings["Pricing currency"], "ZWG")
        self.assertEqual(settings["Business name"], None)
        accepted = {r[0]: r[2] for r in book["Currencies"].iter_rows(min_row=2, values_only=True)}
        self.assertEqual(accepted, {"USD": "No", "ZWG": "Yes", "ZAR": "No"})

    def test_input_tabs_keep_their_dropdowns_and_lists(self):
        book = self.book("USD", "My Shop.xlsx")
        self.assertGreater(len(book["Products"].data_validations.dataValidation), 0)
        self.assertGreater(len(book["Contacts"].data_validations.dataValidation), 0)
        lists = {c.value: c.column for c in book["Lists"][1]}
        usual = [r[0] for r in book["Lists"].iter_rows(min_row=2, min_col=lists["Usual location"],
                                                       max_col=lists["Usual location"], values_only=True) if r[0]]
        self.assertEqual(usual, ["Any"])

    def test_the_month_summary_takes_its_period_from_one_cell(self):
        summary = self.book("USD", "Month.xlsx")["Summary"]
        self.assertIsNone(summary["E1"].value)
        days = [summary.cell(row=r, column=1).value for r in range(5, 36)]
        self.assertEqual(len(days), 31)
        self.assertTrue(all(isinstance(d, str) and "$E$1" in d for d in days))
        self.assertIn('IF($A5="",""', summary["B5"].value)  # blank days never count empty cells

    def test_every_formula_is_excel_compatible(self):
        self.assertEqual(excel_compat.main(str(self.out)), 0)

    def test_the_committed_templates_match_a_fresh_build(self):
        self.assertEqual(folder_fingerprints(DEFAULT_TEMPLATES_DIR), folder_fingerprints(self.out),
                         "Rebuild with: python -m dura_templates templates")


if __name__ == "__main__":
    unittest.main()
