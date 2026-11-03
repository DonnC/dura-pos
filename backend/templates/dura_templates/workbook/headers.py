# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Every tab's columns: (heading, format, width). Formulas and the app find
columns by heading, never by letter, so reordering here is safe.
"""

from __future__ import annotations

from dura_templates.profile import OTHER_CURRENCIES, PC


H_SALES = [("Sale ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7), ("Location", None, 9),
           ("Seller", None, 13), ("Receipt no", None, 13), ("Type", None, 7), ("Original sale", None, 18),
           ("Currency", None, 8), ("Items", "int", 6), ("Subtotal", "money", 10), ("Discount", "money", 9),
           ("Total", "money", 10), ("VAT", "money", 9), ("Paid by", None, 26), ("Change given", None, 22),
           ("Customer ID", None, 10), ("Customer", None, 22), ("Customer TIN", None, 12), ("Fiscal status", None, 16),
           ("ZIMRA device ID", None, 9), ("Fiscal day no", None, 8), ("ZIMRA receipt no", None, 10),
           ("Verification code", None, 20), ("Payment status", None, 10), ("Due date", "date", 12),
           ("Synced at", "datetime", 16), ("Note", None, 18), (f"Total ({PC})", "money", 10), (f"VAT ({PC})", "money", 9)]
H_ITEMS = [("Sale ID", None, 18), ("Line", "int", 5), ("Date", "date", 11), ("Phone", None, 7), ("Location", None, 9),
           ("Type", None, 7), ("Product ID", None, 9), ("Product", None, 22), ("Qty", "int", 6),
           ("Unit price", "money", 10), ("Currency", None, 8), ("Discount", "money", 9), ("Line total", "money", 10),
           ("Tax", None, 18), ("VAT", "money", 9), (f"Unit cost ({PC})", "money", 9), (f"Line cost ({PC})", "money", 10)]
H_PAYS = [("Payment ID", None, 20), ("Sale ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7),
          ("Seller", None, 13), ("Kind", None, 8), ("Method", None, 18), ("Currency", None, 8), ("Amount", "money", 10),
          ("Rate used", "rate", 8), ("Sale currency", None, 8), ("Amount in sale currency", "money", 11),
          ("Status", None, 10), ("Provider", None, 16), ("Provider reference", None, 14), ("Confirmed by", None, 20),
          ("ZIMRA money type", None, 13)]
H_CASHUPS = [("Date", "date", 11), ("Phone", None, 7), ("Location", None, 9), ("Seller", None, 13),
             ("Float USD", "money", 8), ("Float ZWG", "money", 8), ("Float ZAR", "money", 8),
             ("Cash USD expected", "money", 10), ("Cash USD counted", "money", 10), ("Cash USD difference", "money", 10),
             ("Cash ZWG expected", "money", 10), ("Cash ZWG counted", "money", 10), ("Cash ZWG difference", "money", 10),
             ("Cash ZAR expected", "money", 10), ("Cash ZAR counted", "money", 10), ("Cash ZAR difference", "money", 10),
             ("EcoCash USD", "money", 10), ("EcoCash ZWG", "money", 10), ("InnBucks USD", "money", 10),
             ("Card USD", "money", 10), ("Bank transfer USD", "money", 10), ("Kept change USD (kept today)", "money", 10),
             ("Kept change USD (used today)", "money", 10), ("Sales", "int", 6), ("Returns", "int", 7),
             ("Closed at", "time", 7), ("Note", None, 22)]
H_FDAYS = [("Phone", None, 7), ("ZIMRA device ID", None, 9), ("Fiscal day no", None, 8), ("Date", "date", 11),
           ("Opened at", "time", 8), ("Closed at", "time", 8), ("Receipts", "int", 8), ("Credit notes", "int", 8),
           ("Total USD", "money", 10), ("Total ZWG", "money", 11), ("Total ZAR", "money", 10),
           ("VAT USD", "money", 9), ("VAT ZWG", "money", 10), ("VAT ZAR", "money", 9), ("Status", None, 8),
           ("Note", None, 28)]
H_LEDGER = [("Row ID", None, 18), ("Date", "date", 12), ("Time", "time", 7), ("Phone", None, 7), ("Who", None, 13),
            ("Location", None, 9), ("Type", None, 14), ("Product ID", None, 9), ("Product", None, 22),
            ("Qty", "int", 6), (f"Unit cost ({PC})", "money", 9), (f"Stock value ({PC})", "money", 10),
            ("Cost currency", None, 8), ("Supplier ID", None, 10), ("Supplier", None, 20), ("Reference", None, 18), ("Note", None, 30)]
H_MONEY = [("Row ID", None, 18), ("Date", "date", 12), ("Time", "time", 7), ("Phone", None, 7), ("Who", None, 13),
           ("Location", None, 9), ("Type", None, 18), ("Currency", None, 8), ("Cash amount", "money", 10),
           (f"Cash amount ({PC})", "money", 11), ("From till", None, 8), ("Contact ID", None, 10), ("Contact", None, 22), ("Balance change", "money", 10),
           ("Reference", None, 20), ("Note", None, 34)]
H_ACTIVITY = [("Row ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7), ("Who", None, 13),
              ("Role", None, 8), ("Action", None, 22), ("Details", None, 60), ("Reference", None, 18),
              ("Approved by", None, 13)]
H_COUNTS = [("Count ID", None, 20), ("Date", "date", 11), ("Location", None, 9), ("Counted by", None, 13),
            ("Product ID", None, 9), ("Product", None, 22), ("Expected", "int", 9), ("Counted", "int", 9),
            ("Difference", "int", 9), (f"Unit cost ({PC})", "money", 9), (f"Value difference ({PC})", "money", 11),
            ("Status", None, 8), ("Approved by", None, 13)]
H_CALLBACKS = [("Received at", "datetime", 16), ("Provider", None, 9), ("Reference", None, 12), ("Amount", "money", 10),
               ("Currency", None, 8), ("Provider status", None, 9), ("Signature valid", None, 9),
               ("Matched sale", None, 18), ("Result", None, 30), ("Note", None, 30)]
H_RATES = [("Date", "date", 12), ("Time", "time", 7), ("Applies", None, 9),
           *((f"{other} per 1 {PC}", "rate", 10) for other in OTHER_CURRENCIES), ("Set by", None, 13),
           ("Source", None, 26), ("Note", None, 20)]
H_PRODUCTS = [("Product ID", None, 9), ("Name", None, 24), ("Category", None, 11), ("Unit", None, 7),
              ("Barcode", None, 14), ("Photo", None, 22), (f"Price ({PC})", "money", 9), (f"Cost ({PC})", "money", 9), ("Tax", None, 18), ("HS code", None, 10),
              ("Low-stock level", "int", 9), ("Active", None, 7), ("Added on", "date", 11), ("Note", None, 30)]

H_PURCHASES = [("Purchase ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7),
               ("Location", None, 9), ("Supplier ID", None, 10), ("Supplier", None, 22), ("Supplier invoice no", None, 12),
               ("Products", "int", 8), ("Currency", None, 8), ("Total", "money", 10), ("VAT", "money", 9),
               ("Paid how", None, 13), ("Payment status", None, 10), ("Paid on", "date", 11),
               ("Invoice photo", None, 34), ("Received by", None, 13), ("Note", None, 26)]
H_QUOTES = [("Quote ID", None, 18), ("Date", "date", 11), ("Time", "time", 7), ("Phone", None, 7), ("Seller", None, 13),
            ("Customer ID", None, 10), ("Customer", None, 22), ("Valid until", "date", 11), ("Currency", None, 8),
            ("Items", None, 60), ("Total", "money", 10), ("Status", None, 10), ("Sale ID", None, 18),
            ("Shared by", None, 10), ("Note", None, 30)]


H_MONTHS = [("Year", "int", 6), ("Month", None, 9), ("Status", None, 8), ("Sales", "int", 7),
            (f"Sales incl VAT ({PC})", "money", 12), (f"VAT ({PC})", "money", 10), (f"Sales before VAT ({PC})", "money", 12),
            (f"Cost of goods sold ({PC})", "money", 12), (f"Gross profit ({PC})", "money", 12),
            ("Output VAT USD", "money", 10), ("Output VAT ZWG", "money", 10), ("Output VAT ZAR", "money", 10),
            ("Money in USD", "money", 11), ("Money in ZWG", "money", 11), ("Money in ZAR", "money", 11),
            ("Written by", None, 26)]
