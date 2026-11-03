# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""The command line: `python -m dura_templates <command>`.

Each command does one job and exits non-zero when it fails, so CI can run
them as they are. Commands import the generator only when they need it:
building the sample simulates eleven months of trading, which takes about a
minute and a half.
"""

from __future__ import annotations

import argparse
import runpy
import sys
from pathlib import Path

import os
import shutil
import subprocess

from dura_templates.paths import DEFAULT_SAMPLE_ROOT, DEFAULT_TEMPLATES_DIR


def _sample(args: argparse.Namespace) -> int:
    from dura_templates.build import build_sample
    counts = build_sample(Path(args.out) if args.out else None)
    from dura_templates.paths import output_root
    summary = ", ".join(f"{n} {name}" for name, n in counts.items())
    print(f"Wrote {output_root()}: {summary}.")
    return 0


def _templates(args: argparse.Namespace) -> int:
    """Builds every currency's templates, each in its own process (the pricing
    currency is fixed per process), then writes the manifest.
    """
    from dura_templates.profile import CURRENCIES
    out = Path(args.out).resolve() if args.out else DEFAULT_TEMPLATES_DIR
    known = set(CURRENCIES) | {"manifest.json"}
    if out.exists():
        unknown = [p.name for p in out.iterdir() if p.name not in known]
        if unknown:
            raise SystemExit(f"Refusing to clear {out}: it holds {', '.join(sorted(unknown)[:3])}.")
        shutil.rmtree(out)
    for code in CURRENCIES:
        env = {**os.environ, "DURA_PRICING_CURRENCY": code}
        done = subprocess.run([sys.executable, "-m", "dura_templates", "template-one", "--out", str(out)], env=env)
        if done.returncode:
            return done.returncode
    from dura_templates.files.templates import write_manifest
    from dura_templates.workbook.styles import LAYOUT_VERSION
    manifest = write_manifest(out, LAYOUT_VERSION)
    print(f"Wrote templates for {', '.join(CURRENCIES)} and {manifest}.")
    return 0


def _template_one(args: argparse.Namespace) -> int:
    from dura_templates.files.templates import build_templates
    for path in build_templates(Path(args.out)):
        print(f"  {path}")
    return 0


def _run_check(module: str, root: Path) -> int:
    """Runs a check module as a script, with the folder as its argument."""
    saved = sys.argv
    sys.argv = [module, str(root)]
    try:
        runpy.run_module(module, run_name="__main__")
    except SystemExit as stop:
        return int(stop.code or 0)
    finally:
        sys.argv = saved
    return 0


def _check(args: argparse.Namespace) -> int:
    return _run_check("dura_templates.checks.sample_totals", Path(args.folder))


def _excel(args: argparse.Namespace) -> int:
    from dura_templates.checks.excel_compat import main
    return main(args.folder)


def _formulas(args: argparse.Namespace) -> int:
    return _run_check("dura_templates.checks.formula_headings", Path(args.folder))


def _verify(args: argparse.Namespace) -> int:
    """The sample reconciles and is Excel-compatible, then the template tests
    pass (including that the committed dist/ matches a fresh build).
    """
    folder = Path(args.folder)
    for name, run in (("check", _check), ("excel", _excel)):
        code = run(argparse.Namespace(folder=folder))
        if code:
            print(f"{name} failed.")
            return code
    from dura_templates.paths import TEMPLATES_DIR
    tests = subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "*_test.py"],
                           cwd=TEMPLATES_DIR)
    if tests.returncode:
        print("template tests failed.")
    return tests.returncode


def _fingerprint(args: argparse.Namespace) -> int:
    from dura_templates import fingerprint
    current = fingerprint.folder_fingerprints(Path(args.folder))
    if args.write:
        fingerprint.save(current, Path(args.write))
        print(f"Saved fingerprints of {len(current)} files to {args.write}.")
    if args.compare:
        differences = fingerprint.compare(current, fingerprint.load(Path(args.compare)))
        if differences:
            print("\n".join(differences))
            print(f"{len(differences)} files differ from {args.compare}.")
            return 1
        print(f"All {len(current)} files match {args.compare}.")
    if not args.write and not args.compare:
        print(f"{len(current)} files fingerprinted. Use --write or --compare.")
    return 0


def parser() -> argparse.ArgumentParser:
    """The argument parser: one sub-command per job."""
    root = argparse.ArgumentParser(
        prog="python -m dura_templates",
        description="Build and check the workbooks Dura creates in a shop's Google Drive.")
    commands = root.add_subparsers(dest="command", required=True, metavar="command")

    def folder_arg(command: argparse.ArgumentParser) -> None:
        command.add_argument("folder", nargs="?", default=str(DEFAULT_SAMPLE_ROOT),
                             help="a generated 'Dura POS' folder (default: the sample)")

    sample = commands.add_parser("sample", help="build the fictional sample shop")
    sample.add_argument("--out", help="write to this folder instead of sample/Dura POS")
    sample.set_defaults(run=_sample)

    templates = commands.add_parser("templates", help="build the clean templates for every pricing currency")
    templates.add_argument("--out", help="write to this folder instead of dist/")
    templates.set_defaults(run=_templates)
    one = commands.add_parser("template-one", help=argparse.SUPPRESS)
    one.add_argument("--out", required=True)
    one.set_defaults(run=_template_one)

    for name, run, text in (
        ("check", _check, "check the sample's numbers reconcile across every file"),
        ("excel", _excel, "check every formula uses only Excel-compatible functions"),
        ("formulas", _formulas, "report which heading each cross-tab formula reads"),
        ("verify", _verify, "run check and excel, as CI does"),
    ):
        command = commands.add_parser(name, help=text)
        folder_arg(command)
        command.set_defaults(run=run)

    prints = commands.add_parser(
        "fingerprint", help="fingerprint generated files, to prove a change is layout-neutral")
    folder_arg(prints)
    prints.add_argument("--write", metavar="FILE", help="save the fingerprints as JSON")
    prints.add_argument("--compare", metavar="FILE", help="compare against saved fingerprints")
    prints.set_defaults(run=_fingerprint)
    return root


def main(argv: list[str] | None = None) -> int:
    """Runs one command and returns its exit code."""
    args = parser().parse_args(argv)
    return args.run(args)
