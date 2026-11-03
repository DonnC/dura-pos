# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Clean templates: `My Shop` and the month file, with every heading,
formula, dropdown, colour rule, chart and Read Me, but no rows and no sample
identity.

The Shop Hub converts these into a new shop's Google Sheets
(decision 0005). They're built by the same writers as the sample, so the two
can't drift apart. One set is built per pricing currency, because headings
carry it (`Price (ZWG)`); this module builds the set for the current
process's currency, and the `templates` command runs it once per currency.

What the hub fills in after converting:

- My Shop's `Settings`: the business name, the other identity rows, and
  `Data year`;
- the month file's `Summary!E1`: the month's first day, which drives its day
  rows.

Everything else fills as the shop trades.
"""

from __future__ import annotations

import re
import zipfile
from pathlib import Path

from dura_templates.files.month_file import write_month
from dura_templates.files.my_shop import write_my_shop
from dura_templates.profile import CURRENCIES, PC
from dura_templates.workbook.lists import starter_lists

MY_SHOP_FILE = "My Shop.xlsx"
MONTH_FILE = "Month.xlsx"

CURRENCY_NAMES = {"USD": "US dollar", "ZWG": "Zimbabwe Gold (ZiG)", "ZAR": "South African rand"}
ROUNDING = {"USD": "0.01", "ZWG": "0.50", "ZAR": "0.50"}

# Fixed times written into every template, so a rebuild gives identical bytes.
_FIXED_ZIP_TIME = (2026, 1, 1, 0, 0, 0)
_FIXED_STAMP = "2026-01-01T00:00:00Z"


def _currencies() -> list[list]:
    rows = []
    for code in CURRENCIES:
        pricing = code == PC
        note = (f"The pricing currency: every product has one {PC} price." if pricing else
                f"{code} price = {PC} price x the day's rate (Exchange Rates), rounded to {ROUNDING[code]}.")
        rows.append([code, CURRENCY_NAMES[code], "Yes" if pricing else "No",
                     "Prices (the pricing currency)" if pricing else "", "Yes" if pricing else "", "",
                     ROUNDING[code], note])
    return rows


def _payment_methods() -> list[list]:
    return [[f"Cash {code}", code, "Cash", "", "", "Cash count", "", "Yes" if code == PC else "No", ""]
            for code in CURRENCIES]


def _settings() -> list[list]:
    """Defaults from note 10: daily rate, ask when a rate is missing, owner-only
    rates, fiscalisation off until ZIMRA's tests pass. Identity rows are blank:
    the hub writes them at setup.
    """
    return [list(row) for row in [
        ("Business name", "", "Written at setup"), ("Legal name", "", "Printed on receipts"),
        ("Owner", "", ""), ("TIN", "", "Needed for fiscalisation"), ("VAT number", "", "If VAT-registered"),
        ("Address", "", ""), ("Phone", "", ""),
        ("Shop Google account", "", "The Google account that holds these files and the Shop Hub"),
        ("Word for a location", "Shop", "Shop, branch, store, stall or outlet: the app uses this word"),
        ("Mode", "Live", "Test mode uses its own folder, '<shop> (TEST)', and never touches this one"),
        ("Pricing currency", PC, "Chosen at setup. Every product has one price, in this currency"),
        ("Accepted currencies", PC, "Others can be added; they use the day's rate"),
        ("Rate policy", "Daily rate", "One rate per currency for the whole day. The other choice is 'Latest rate'"),
        ("If today's rate is missing", "Ask", "Ask, Use the last rate with a warning, or Block (only blocks other currencies)"),
        ("Who may set rates", "Owner", "Owner, or Owner and managers"),
        ("Fiscalisation", "Off", "Turned on per phone once ZIMRA's tests pass; see Phones"),
        ("Low-stock alerts", "On", ""), ("Seller discount limit", "5%", "Above it needs the owner's PIN"),
        ("Refunds", "Owner's PIN", ""), ("Day close time", "", "Cash-up and fiscal day close"),
        ("Kept change", "Off", "Change the shop keeps for a customer, up to a limit"),
        ("Kept change reminder", "After 60 days", "Old balances are listed for the owner"),
        ("Invoices on account", "Off", "Only for contacts marked 'On account'"),
        ("Quotes", "Off", "Shared as a PDF; not fiscal"),
        ("Suppliers and purchases", "On", "Supplier invoice photos go to <year>/Supplier invoices"),
        ("Shop Hub", "", "The hub records its version here"),
        ("Receipt footer", "Thank you!", ""),
        ("Data year", "", "The year the ledger tabs and Summary show. The hub sets it"),
    ]]


def clean_my_shop() -> dict:
    """A new shop's My Shop content: starter lists and defaults, no rows."""
    return {
        "title": None, "sample": False, "lists": starter_lists(),
        "products": [], "stock": [], "locations": [], "summary_locations": None,
        "phones": [], "staff": [], "contacts": [], "taxes": [], "hs_codes": [],
        "currencies": _currencies(), "payment_methods": _payment_methods(), "settings": _settings(),
        "rates": [], "stock_ledger": [], "money_ledger": [], "stock_counts": [], "purchases": [],
        "callbacks": [], "balances": [], "months": [], "files": [],
    }


def normalise(path: Path) -> None:
    """Rewrites an .xlsx with fixed zip times and creation stamps, so building
    the same layout twice gives the same bytes and the same SHA-256.
    """
    with zipfile.ZipFile(path) as source:
        parts = [(info.filename, source.read(info.filename)) for info in source.infolist()]
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as target:
        for name, data in parts:
            if name == "docProps/core.xml":
                data = re.sub(rb"(<dcterms:(?:created|modified)[^>]*>)[^<]*(</dcterms)",
                              rb"\g<1>" + _FIXED_STAMP.encode() + rb"\g<2>", data)
            info = zipfile.ZipInfo(name, date_time=_FIXED_ZIP_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            target.writestr(info, data)


def write_manifest(out: Path, layout_version: int) -> Path:
    """`out/manifest.json`: each template's path and SHA-256, per currency, for
    the hub to pin in its template manifest.
    """
    import hashlib
    import json
    templates = {}
    for code in CURRENCIES:
        templates[code] = {}
        for key, name in (("myShop", MY_SHOP_FILE), ("month", MONTH_FILE)):
            path = out / code / name
            templates[code][key] = {"file": f"{code}/{name}",
                                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    manifest = out / "manifest.json"
    manifest.write_text(json.dumps({"layoutVersion": layout_version, "templates": templates}, indent=2) + "\n",
                        encoding="utf-8", newline="\n")  # LF on every platform; Git never converts dist/
    return manifest


def build_templates(out: Path) -> list[Path]:
    """Writes this currency's templates into `out/<currency>/` and returns them."""
    folder = out / PC
    folder.mkdir(parents=True, exist_ok=True)
    my_shop, month = folder / MY_SHOP_FILE, folder / MONTH_FILE
    write_my_shop(clean_my_shop(), my_shop)
    empty = {k: [] for k in ("sales", "items", "pays", "cashups", "fdays", "quotes", "activity")}
    write_month("2026-01", empty, template_path=month)  # the period is a placeholder; Summary!E1 sets it
    for path in (my_shop, month):
        normalise(path)
    return [my_shop, month]
