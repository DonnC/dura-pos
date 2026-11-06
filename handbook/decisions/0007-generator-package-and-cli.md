# Decision 0007: the workbook generator is a package with a CLI

Status: Accepted
Date: 3 November 2026
Roadmap slice: 3 (owner records)

## Problem and evidence

The generator was one 2,499-line script, `generate_samples.py`:

- the simulation ran as module-level code when the script loaded;
- the writers read shared module-level collections;
- three separate check scripts sat beside it.

It broke the 500-line rule (decision 0006 recorded the exception), and was
hard to review or extend.

While it was being moved, two more problems came to light:

- **`check_samples.py` exited with code 0 even when it printed "PROBLEMS:",**
  so CI's templates job could not fail on a broken sample.
- **The script deleted its fixed output folder unconditionally.** An output
  option would have made that dangerous.

## Decision

1. **`backend/templates/dura_templates/` is a package,** with one module per
   responsibility. Every module is under 500 lines:
   - `sample/`: the fictional shop and its simulated trading;
   - `workbook/`: styles, tables, headings, dropdowns;
   - `files/`: one module per kind of file;
   - `checks/`: the three checks;
   - `build.py`: the fixed order of work;
   - `cli.py`: the commands.
2. **One entry point:** `python -m dura_templates`, with these commands:
   - `sample [--out]`;
   - `check`, `excel` and `verify`;
   - `formulas`;
   - `fingerprint --write` and `--compare`.

   The old scripts are removed.
3. **Refactors are proven by fingerprints.** `fingerprint` hashes every
   generated file, skipping only the timestamp part of each `.xlsx`. A change
   that isn't meant to alter the layout must compare equal.
4. **`check` exits 1 on any problem,** so CI fails on a broken sample.
5. **`sample --out` refuses a folder** that holds anything the generator
   didn't make, and checks this before the 90-second simulation.

## Compatibility and migration

- **How the split was made:** statements moved verbatim. A one-off tool
  computed each module's imports from Python's symbol tables, and reported no
  unresolved names and no circular imports.
- **Indentation:** tabs became 4 spaces, matching the rest of the repository.
- **Order of work kept:** the simulation was wrapped in functions, called in
  the original order, so random numbers are drawn exactly as before.
- **The proof:** every one of the 102 generated files matched the old
  script's output by fingerprint, with openpyxl 3.1.5 and Python 3.11.
- **The committed sample** was written by an older openpyxl, whose XML
  differs only in spacing. It passes `verify`, and is regenerated when the
  layout next changes.
- **References updated:** CI, the VS Code tasks and debug configuration,
  `CLAUDE.md`, the READMEs, the conventions, the glossary and the records
  skill.
- **This replaces** decision 0006's file names for the checks and its size
  exception.

## Acceptance and reversal

- `python -m dura_templates verify` passes on the committed sample and on a
  fresh build.
- A deliberately corrupted total makes `check` exit 1.
- `sample --out` into a folder holding another file stops in about two
  seconds, and leaves the file.
- **Remaining warnings:** pyflakes reports three issues carried over from the
  original script (two unused local variables and an f-string without
  placeholders). They're left until a layout change can show, by
  fingerprint, that removing them changes nothing.

To reverse, restore `generate_samples.py` from Git history. There's no reason
to.
