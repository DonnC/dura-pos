# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Daily exchange rates (made up): ZWG and ZAR per 1 USD.

Built when this module is first imported, drawing from `rng` before the
simulation does, exactly as the original single-file generator did.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal as D
from dura_templates.money import round_to
from dura_templates.sample.business import PC, price_cost
from dura_templates.sample.period import START, TODAY, rng


RATES: dict[date, tuple[D, D]] = {}
_zwg, _zar = 26.70, 17.80
d = START
while d <= TODAY:
    _zwg *= 1 + rng.gauss(0.00012, 0.0012)
    _zar *= 1 + rng.gauss(0, 0.004)
    RATES[d] = (D(str(round(_zwg, 2))), D(str(round(_zar, 2))))
    d += timedelta(days=1)


def unit_price(pid: str, day: date, cur: str) -> D:
    """The product's price in `cur` on `day`: USD as set, ZWG and ZAR at the day's
    rate, rounded to 0.50.
    """
    usd, _ = price_cost(pid, day)
    if cur == "USD":
        return usd
    zwg, zar = RATES[day]
    return round_to(usd * (zwg if cur == "ZWG" else zar), D("0.5"))


def rate_for(cur: str, day: date) -> D:
    """Units of `cur` per 1 unit of the pricing currency on `day`."""
    if cur == PC:
        return D(1)
    zwg, zar = RATES[day]
    return {"ZWG": zwg, "ZAR": zar}[cur]
