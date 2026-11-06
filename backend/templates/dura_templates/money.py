# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Exact money helpers: two-decimal rounding and splitting a total by weights.
"""

from __future__ import annotations

import math
from decimal import Decimal as D, ROUND_HALF_EVEN


CENT = D("0.01")


def q2(x: D) -> D:
    """Rounds to cents, half to even (banker's rounding), as the ledgers store money."""
    return x.quantize(CENT, ROUND_HALF_EVEN)


def round_to(x: D, step: D) -> D:
    """Rounds to the nearest multiple of `step`, e.g. ZWG prices to 0.50."""
    return ((x / step).quantize(D(1), ROUND_HALF_EVEN) * step).quantize(CENT)


def ceil_to(x: D, step: D) -> D:
    """Rounds up to a multiple of `step`, e.g. the next whole dollar handed over."""
    return (D(math.ceil(x / step)) * step).quantize(CENT)


def split_proportionally(total: D, weights: list[D]) -> list[D]:
    """Split a cent amount by weights; parts sum exactly (largest remainder)."""
    cents = int(total * 100)
    wsum = sum(weights)
    if not wsum:
        return [D(0)] * len(weights)
    raw = [D(cents) * w / wsum for w in weights]
    parts = [int(r) for r in raw]
    rest = cents - sum(parts)
    for i in sorted(range(len(raw)), key=lambda i: raw[i] - parts[i], reverse=True)[:rest]:
        parts[i] += 1
    return [D(p) / 100 for p in parts]
