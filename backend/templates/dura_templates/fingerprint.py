# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Content fingerprints of a generated folder, to prove a change is (or isn't)
a layout change.

openpyxl stamps every workbook with its creation time in docProps/core.xml,
so the same layout gives different bytes on each run. This hashes every other
part of each .xlsx, and every other file whole. Two runs of an unchanged
generator, with the same openpyxl version, give the same fingerprints; a
refactor must too.
"""

from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path


def file_fingerprint(path: Path) -> str:
    """SHA-256 of a file; for .xlsx, of every part except the timestamped core.xml."""
    if path.suffix == ".xlsx":
        digest = hashlib.sha256()
        with zipfile.ZipFile(path) as archive:
            for name in sorted(archive.namelist()):
                if name == "docProps/core.xml":
                    continue
                digest.update(name.encode())
                digest.update(archive.read(name))
        return digest.hexdigest()
    return hashlib.sha256(path.read_bytes()).hexdigest()


def folder_fingerprints(root: Path) -> dict[str, str]:
    """Relative path (with /) to fingerprint, for every file under `root`."""
    return {
        p.relative_to(root).as_posix(): file_fingerprint(p)
        for p in sorted(root.rglob("*")) if p.is_file()
    }


def compare(current: dict[str, str], expected: dict[str, str]) -> list[str]:
    """Plain-words differences between two fingerprint sets."""
    lines = []
    for name in sorted(set(current) | set(expected)):
        if name not in expected:
            lines.append(f"new file: {name}")
        elif name not in current:
            lines.append(f"missing file: {name}")
        elif current[name] != expected[name]:
            lines.append(f"changed: {name}")
    return lines


def save(fingerprints: dict[str, str], path: Path) -> None:
    """Writes fingerprints as sorted JSON, so diffs between saves are readable."""
    path.write_text(json.dumps(fingerprints, indent=1, sort_keys=True) + "\n", encoding="utf-8")


def load(path: Path) -> dict[str, str]:
    """Reads fingerprints saved by `save`."""
    return json.loads(path.read_text(encoding="utf-8"))
