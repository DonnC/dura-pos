# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Where the generator reads from and writes to.

The output root is set once, by the CLI, before anything is built. File
writers ask for it through `output_root()` (and `business_dir()` in
`sample.business`) at the moment they write, so `--out` works everywhere.
"""

from __future__ import annotations

from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parents[1]  # backend/templates
REPO_DIR = TEMPLATES_DIR.parents[1]
HS_CODES_CSV = REPO_DIR / "data" / "zimra_hs_codes.csv"
DEFAULT_SAMPLE_ROOT = TEMPLATES_DIR / "sample" / "Dura POS"
DEFAULT_TEMPLATES_DIR = TEMPLATES_DIR / "dist"  # clean templates, one folder per pricing currency

_output_root = DEFAULT_SAMPLE_ROOT


def output_root() -> Path:
    """The `Dura POS` folder being written, as it would sit in a Google Drive."""
    return _output_root


def set_output_root(path: Path) -> None:
    """Points every writer at `path`. Call before building."""
    global _output_root
    _output_root = Path(path).resolve()
