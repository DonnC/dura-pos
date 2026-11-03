# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The sample's period and its two random streams.

The seeds are fixed, so every run produces the same shop. `rng` drives
sales and rates; `crng` drives customers, kept change and quotes. Changing
the order in which they're drawn changes every number in the sample.
"""

from __future__ import annotations

import random
from datetime import date


START = date(2025, 12, 1)
TODAY = date(2026, 10, 28)
rng = random.Random(2026)

crng = random.Random(77)  # its own stream for customers, kept change and quotes
