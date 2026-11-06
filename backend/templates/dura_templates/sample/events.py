# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""One-off events the owner or the hub did (settings, devices, test mode),
written to Activity before the daily simulation runs.
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal as D
from dura_templates.sample.business import CUST, CUSTOMERS, CUSTOMER_MERGED_ON, seller_for
from dura_templates.sample.records import callbacks_y, log


EVENTS = {
    date(2025, 12, 1): [
        (time(6, 5), "P1", "Chipo Moyo", "Shop set up", "Dura installed; shop Google account linked; My Shop created"),
        (time(6, 10), "P1", "Chipo Moyo", "Products imported", "25 products from the My Shop sheet"),
        (time(6, 12), "P1", "Chipo Moyo", "Opening stock", "First stock count entered as opening stock"),
        (time(6, 15), "P2", "Chipo Moyo", "Phone joined", "P2 'Till - Main' signed in with the shop Google account"),
        (time(6, 16), "P1", "Chipo Moyo", "Seller added", "Rudo Chari, app only, PIN set on P2"),
    ],
    date(2026, 1, 2): [
        (time(8, 0), "P1", "Dura", "Year-end archive", "2025 ledgers copied to 2025/Ledger 2025; Stock Ledger started 2026 with closing stock"),
    ],
    date(2026, 2, 16): [(time(9, 0), "P1", "Chipo Moyo", "Fiscalisation", "ZIMRA test device registered on P1 and P2")],
    date(2026, 2, 20): [(time(18, 0), "P1", "Chipo Moyo", "Fiscalisation", "Test fiscal day closed without errors")],
    date(2026, 2, 23): [(time(10, 0), "P1", "Chipo Moyo", "Fiscalisation", "Sample invoice and credit note sent to ZIMRA")],
    date(2026, 2, 27): [(time(11, 0), "P1", "Chipo Moyo", "Fiscalisation", "ZIMRA approved; live devices 21401 and 21402 registered")],
    date(2026, 3, 1): [(time(6, 20), "P1", "Chipo Moyo", "Setting changed", "Fiscalisation turned on for P1 and P2")],
    date(2026, 3, 30): [
        (time(15, 0), "P3", "Chipo Moyo", "Phone joined", "P3 'Mbare stall' signed in with the shop Google account"),
        (time(15, 5), "P1", "Chipo Moyo", "Location added", "Mbare Musika stall"),
        (time(15, 10), "P1", "Chipo Moyo", "Fiscalisation", "Live device 21403 registered for P3"),
    ],
    date(2026, 4, 1): [
        (time(6, 0), "P1", "Chipo Moyo", "Seller added", "Farai Dube, app only, PIN set on P3"),
    ],
    date(2026, 5, 2): [(time(14, 0), "P1", "Chipo Moyo", "Payments", "Paynow keys added in sandbox mode; test payment OK")],
    date(2026, 5, 4): [(time(6, 15), "P1", "Chipo Moyo", "Payments", "Paynow switched to live (EcoCash, InnBucks)")],
    date(2026, 5, 19): [(time(16, 30), "P2", "Chipo Moyo", "Phone retired", "P2 screen broken; last synced 16:25; no unsent receipts")],
    date(2026, 5, 20): [
        (time(6, 0), "P4", "Chipo Moyo", "Phone joined", "P4 'Till - Main' restored from P2's backup"),
        (time(6, 5), "P4", "Chipo Moyo", "Fiscalisation", "New live device 21404 registered for P4; 21402 retired"),
    ],
    date(2026, 6, 1): [(time(6, 10), "P1", "Chipo Moyo", "Price changed", "Cola 500ml: 0.70 to 0.75 USD (sheet edit applied)")],
    date(2026, 6, 12): [(time(19, 50), "P1", "Chipo Moyo", "Seller removed", "Rudo Chari; PIN removed from P4")],
    date(2026, 6, 13): [(time(6, 15), "P1", "Chipo Moyo", "Seller added", "Tendai Ncube, app only, PIN set on P4")],
    date(2026, 7, 4): [(time(21, 0), "P1", "Dura", "Sync: row skipped", "Products row 28 'Peanut butter 375ml' skipped: no price")],
    date(2026, 7, 6): [(time(7, 0), "P1", "Chipo Moyo", "Product added", "Peanut butter 375ml at 2.40 USD (sheet edit applied)")],
    date(2026, 8, 10): [(time(6, 10), "P1", "Chipo Moyo", "Price changed", "Sugar 2kg: 2.80 to 2.95 USD (app)")],
    date(2026, 8, 15): [(time(20, 0), "P1", "Chipo Moyo", "Shop Hub installed",
                         "Apps Script hub in the shop account: Paynow keys moved off the phones, callbacks on, month files by timer")],
    date(2026, 9, 14): [(time(13, 12), "P1", "Dura", "Payment callback rejected", "Signature did not match; no sale changed")],
    date(2026, 10, 1): [(time(6, 5), "P1", "Chipo Moyo", "Setting changed", "Seller discount limit kept at 5%")],
    date(2026, 10, 25): [(time(3, 0), "P1", "Dura", "File created", "Shop Hub created 2026-11 November")],
    date(2026, 10, 27): [(time(5, 40), "P4", "Chipo Moyo", "Test mode on", "Owner PIN; training Tendai on ZB SmilePay (sandbox)"),
                         (time(6, 25), "P4", "Chipo Moyo", "Test mode off", "Back to live; test data stays in the (TEST) folder")],
}



def record_one_off_events() -> None:
    """Writes the one-off events, customer additions and the rejected
    callback. Runs first, so their IDs come before the day's own rows.
    """
    for day, evs in EVENTS.items():
        for t, ph, who, action, details in evs:
            log(day, t, ph, who, action, details)
    for cid, name, *_rest in CUSTOMERS:
        ph, added = cid[:2], CUST[cid][9]
        log(added, time(10, 30), ph, seller_for(ph, added), "Customer added", name, cid)
    log(date(2026, 3, 2), time(9, 40), "P1", "Chipo Moyo", "Customer changed", "Glen View Clinic Canteen: VAT number added", "P1-C0008")
    log(CUSTOMER_MERGED_ON, time(7, 5), "P1", "Chipo Moyo", "Customers merged",
        "P3-C0001 'Mai Tafadzwa' merged into P1-C0006 (same phone number); old sales keep P3-C0001", "P1-C0006")
    callbacks_y[2026].append([datetime(2026, 9, 14, 13, 12, 5), "Paynow", "PN00000000", D("50.00"), "USD", "Paid", "No",
                              "", "Rejected: bad signature", "Unknown reference; nothing recorded"])
