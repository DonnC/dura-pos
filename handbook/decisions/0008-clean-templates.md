<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Decision 0008: clean templates, one set per pricing currency

Status: Accepted
Date: 3 November 2026
Roadmap slice: 3 (owner records)

## Problem and evidence

The hub creates a new shop's files from templates (decisions 0003 and 0005),
but the generator could only build the sample shop:

- **The writers read the sample's data directly.** That covered products,
  staff, contacts, settings, ledgers, and the Lists tab's locations and
  supplier terms.
- **Headings carry the pricing currency,** e.g. `Price (USD)` and `ZWG per 1
  USD`. The owner chooses that currency (note 12 §7), so one template can't
  serve every shop.
- **The month Summary was built for one month.** It had a row per day of
  that month, and breakdown rows only for values in its data.
- **openpyxl writes the save time** into each file and each zip entry, so
  hashes changed on every build.

## Decision

1. **One template set per pricing currency.** `python -m dura_templates
   templates` builds `dist/<USD|ZWG|ZAR>/My Shop.xlsx` and `Month.xlsx`.
   - The headings are right from the start, so the hub needs no extra calls
     to rename columns.
   - The pricing currency is fixed per process (`profile.py`), so each set
     builds in its own.
2. **The same writers build the sample and the templates.**
   - `write_my_shop` lays out content it's given: the sample's, or a clean
     shop's.
   - `write_month` has a template mode. The layout can't drift between the
     two.
3. **What a clean template contains:**
   - every heading, formula, dropdown, colour rule, chart and Read Me;
   - starter Lists, Settings defaults from note 10, the three currencies with
     the pricing one accepted, and one cash method per currency;
   - no rows, and no sample identity.
4. **The month template is period-neutral.** Its Summary reads the month from
   `Summary!E1`:
   - 31 day rows are formulas, blank for days the month doesn't have;
   - every count is guarded, so a blank day never counts empty cells.
5. **The hub fills a few cells after converting:**
   - My Shop's `Settings` identity rows and `Data year`;
   - the month's `Summary!E1`.
6. **Templates are byte-reproducible.**
   - `normalise` fixes zip times and creation stamps, so `manifest.json`'s
     SHA-256 hashes are stable.
   - `dist/` is committed.
   - The template tests rebuild it and require the committed files to match.
7. **Setup requires the pricing currency.** `setup.run` takes
   `pricingCurrency`, with no default. The hub's manifest holds one template
   set per currency.

## Compatibility and migration

- **The sample is unchanged.** All 102 sample files still match the original
  script's output by fingerprint, after every step of this change.
- **The hub protocol changes within version 1,** since nothing is deployed:
  `setup.run` gains a required field.
- **Known gaps,** for the slices that build views:
  - the hub didn't yet write the identity and period cells, and now does;
  - My Shop's Stock rows were missing, and the hub now writes them;
  - the Summary breakdowns by location, phone, seller, payment method and
    product, and My Shop's Balances rows, fill only when the hub builds them.
    The sample's writer computes those labels from data.
- **The URLs in the hub's template manifest are empty** until templates are
  published in a release.

## Acceptance and reversal

- 10 template tests pass. Two mutations showed they can fail:
  - the identity scan finds the sample's names when pointed at the sample;
  - without `normalise`, two builds differ.
- `excel` passes on all six templates.
- 53 hub tests pass, including a ZWG shop getting ZWG templates and setup
  refusing a missing or unknown currency.
- **To reverse,** build one set and have the hub rename headings after
  conversion. That costs a Sheets call per file, per shop.
