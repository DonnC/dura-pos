---
name: dura-records
description: Design or change Dura POS event journals, Google Sheets layouts, Excel exports and file lifecycle policies with readable sample data and reconciliation. Use for Dura record formats, not generic spreadsheet work.
---
<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->
# Dura records and file lifecycle

## Read first

- `handbook/decisions/0003-records-journal-and-views.md`: the journal is the
  history, and Sheets are views and checked inputs.
- `handbook/engineering/03-records-and-sheets.md` and
  `handbook/design/records-file-design.md`, with its file previews.
- `backend/templates/README.md` (template-first, Excel compatibility, the contract) and
  `notes/04-data-files.md` (the current sample layout).
- `backend/templates/generate_samples.py`, the executable spec, and its
  checks, including `check_excel.py`. Use the spreadsheet
  skill, if one is available, when creating or editing workbooks.

## Rules

- **Authoring:** Python authors the layout, formulas, validation, charts and
  guidance. Grow `generate_samples.py` into modules; don't start a competing
  generator. Keep layout out of Flutter.
- **Template-only versus contract changes:** a wider column or a new owner
  notes column is a template change. A changed meaning is a contract change,
  with tests and a migration.
- **Clean and demo pairs:** generate both for every workbook type. Clean
  templates keep their formulas and lists but no records. Demo files are
  labelled DEMO, use fixed dates, and must never provision a live shop.
  Changes explored in Sheets or Excel go back into Python.
- **Every file, tab or column change states:**
  - a sample preview and dictionary entry;
  - its writer, creation stage and authority;
  - its version and retention;
  - its migration and restore behaviour.

  Show currencies, units, signs and completeness. Examples are fictitious and
  must add up across sales, payments, stock, shifts and accounting.
- **History:**
  - accepted events are immutable;
  - owner edits are proposals, validated before they're accepted, with no
    silent last-write-wins for money;
  - provider settlement, shift cash-up and fiscal closing stay distinct.
- **People-first sheets:**
  - a Read Me;
  - colour-coded tabs labelled in words;
  - `Lists` dropdowns and date validation;
  - red negatives;
  - formulas that never cross files or name a year.
- **Portability:** Excel-compatible formulas, with readable fallback values.
  Pivots and Google-only functions can't be essential to an export. Report
  the actual Sheets, Excel or LibreOffice versions checked; structural
  parsing isn't proof of recalculation.
- **Never:**
  - delete journals as cache cleanup;
  - restore old fiscal counters;
  - overwrite owner-created sheets in a migration.

## Done when

- The generator, templates, contract and checks are updated together, and
  regenerated.
- `check_samples.py` and `check_formulas.py` pass.
- Late events, month and year boundaries, a missing device, a duplicate batch
  and rebuilding a damaged view are covered, where they apply.
- Design-only previews are labelled honestly.
