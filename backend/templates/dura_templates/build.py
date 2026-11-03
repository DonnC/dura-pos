# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Builds the sample shop: simulate the trading, then write every file.

The order matters and is fixed:

1. `sample.rates` builds the daily rates when first imported (drawing from
   `rng` before anything else does).
2. `record_one_off_events` logs the one-off events, so their Activity IDs come
   first on their days.
3. `simulate` trades every day from START to TODAY, filling `sample.records`.
4. The writers turn those records into workbooks, in this order: each month,
   the ready-made next month, My Shop, the 2025 archive, photos, the test
   shop.

The simulation keeps its results in module-level collections, so it runs once
per process. The CLI builds in a fresh process each time.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from dura_templates.paths import output_root, set_output_root

_built = False


def _refuse_foreign_files(root: Path, shop_folders: set[str]) -> None:
    """Stops before any work if `root` holds anything but previous sample output."""
    if root.exists():
        unknown = [p.name for p in root.iterdir() if p.name not in shop_folders]
        if unknown:
            raise SystemExit(
                f"Refusing to clear {root}: it holds files the generator didn't make "
                f"({', '.join(sorted(unknown)[:3])}). Choose an empty or new folder.")


def _clear(root: Path) -> None:
    if root.exists():
        shutil.rmtree(root)
    root.mkdir(parents=True)


def build_sample(out: Path | None = None) -> dict[str, int]:
    """Builds the sample shop into `out` (default `sample/Dura POS`).

    Returns row counts for the summary line.
    """
    global _built
    if _built:
        raise RuntimeError("The sample can be built once per process.")
    _built = True
    if out is not None:
        set_output_root(out)

    # Imported here, after the output root is set and only when building.
    from dura_templates.files.archive import write_archive
    from dura_templates.files.month_file import write_month
    from dura_templates.files.my_shop import write_my_shop
    from dura_templates.files.photos import write_photos
    from dura_templates.files.test_shop import write_test_shop
    from dura_templates.sample import records
    from dura_templates.sample.business import business_dir, test_dir
    from dura_templates.sample.events import record_one_off_events
    from dura_templates.sample.simulate import simulate

    root = output_root()
    _refuse_foreign_files(root, {business_dir().name, test_dir().name})

    record_one_off_events()
    simulate()

    _clear(root)
    for ym in sorted(records.sales_m):
        write_month(ym)
    empty = {k: [] for k in ("sales", "items", "pays", "cashups", "fdays", "quotes", "activity")}
    write_month("2026-11", empty)  # the next month, made ready by the hub on the 25th
    write_my_shop()
    write_archive()
    write_photos()
    write_test_shop()

    def total(collection) -> int:
        return sum(len(rows) for rows in collection.values())

    return {
        "sales": total(records.sales_m),
        "item lines": total(records.items_m),
        "payment rows": total(records.pays_m),
        "stock ledger rows": total(records.stock_ledger_y),
        "money ledger rows": total(records.money_ledger_y),
        "activity rows": total(records.activity_y),
    }
