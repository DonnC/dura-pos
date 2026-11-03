# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The pricing currency the layout is built for.

Column headings carry it (`Price (ZWG)`, `USD per 1 ZWG`), and the heading
tables in `workbook.headers` are built when first imported. So it's fixed per
process, read from DURA_PRICING_CURRENCY before anything else is imported.
The sample shop prices in USD, the default. `templates` builds each currency
in its own process.
"""

from __future__ import annotations

import os

CURRENCIES = ("USD", "ZWG", "ZAR")

PC = os.environ.get("DURA_PRICING_CURRENCY", "USD")
if PC not in CURRENCIES:
    raise SystemExit(f"DURA_PRICING_CURRENCY must be one of {', '.join(CURRENCIES)}, not {PC!r}.")

OTHER_CURRENCIES = tuple(c for c in CURRENCIES if c != PC)
