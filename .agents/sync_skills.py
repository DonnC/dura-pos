# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Keeps the project skills usable and honest.

`.agents/skills/` is the one place skills are written. Claude Code looks in
`.claude/skills/`, so this writes a short pointer there for each skill.

With `--check` it changes nothing and fails if a pointer is out of date, or if
a skill names a repository path that no longer exists, which is how a skill
quietly stops being factual.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / ".agents" / "skills"
POINTERS = ROOT / ".claude" / "skills"
PATH_ROOTS = ("backend/", "client/", "handbook/", "notes/", "research/", "data/", ".agents/", ".github/")


def frontmatter(text: str) -> tuple[str, str]:
    name = re.search(r"^name: (.+)$", text, re.M).group(1).strip()
    description = re.search(r"^description: (.+)$", text, re.M).group(1).strip()
    return name, description


def pointer(name: str, description: str) -> str:
    return (f"---\nname: {name}\ndescription: {description}\n---\n\n"
            f"Read `.agents/skills/{name}/SKILL.md` and follow it.\n")


def missing_paths(skill: Path) -> list[str]:
    """Backticked repository paths in a skill that don't exist."""
    found = []
    for path in sorted(re.findall(r"`([^`\s]+)`", skill.read_text(encoding="utf-8"))):
        path = path.split("#")[0].rstrip(".,;:")
        if path.startswith(PATH_ROOTS) and "<" not in path and "*" not in path and not (ROOT / path).exists():
            found.append(f"{skill.parent.name}: {path}")
    return found


def main() -> int:
    check = "--check" in sys.argv
    problems = []
    names = []
    for skill in sorted(SKILLS.glob("*/SKILL.md")):
        name, description = frontmatter(skill.read_text(encoding="utf-8"))
        names.append(name)
        if name != skill.parent.name:
            problems.append(f"{skill.parent.name}: the name says {name}")
        problems += missing_paths(skill)
        target = POINTERS / name / "SKILL.md"
        wanted = pointer(name, description)
        current = target.read_text(encoding="utf-8") if target.exists() else None
        if current != wanted:
            if check:
                problems.append(f"{name}: run python .agents/sync_skills.py")
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(wanted, encoding="utf-8", newline="\n")
    if POINTERS.exists():
        for extra in sorted(p.name for p in POINTERS.iterdir() if p.name not in names):
            problems.append(f"{extra}: a pointer with no skill")
    for problem in problems:
        print(problem)
    print(f"{len(names)} skills, {len(problems)} problems.")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
