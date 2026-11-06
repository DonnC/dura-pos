---
name: dura-records
description: Design or change Dura POS event journals, Google Sheets layouts, Excel exports and file lifecycle policies with readable sample data and reconciliation. Use for Dura record formats, not generic spreadsheet work.
---
# Dura records and file lifecycle

## Read first

- `handbook/decisions/0003-records-journal-and-views.md`: the journal is the
  history, and Sheets are views and checked inputs.
- `handbook/engineering/03-records-and-sheets.md` and
  `handbook/design/records-file-design.md`, with its file previews.
- `backend/templates/README.md` (template-first, Excel compatibility, the contract) and
  `notes/04-data-files.md` (the current sample layout).
- The `dura-templates` skill: `backend/templates/dura_templates/` is the
  executable spec, run through its CLI (`python -m dura_templates`).

## Rules

- **Authoring:** Python authors the layout, formulas, validation, charts and
  guidance. Extend the `dura_templates` package (one module per kind of file);
  don't start a competing generator. Keep layout out of Flutter.
- **Template-only versus contract changes:** a wider column or a new owner
  notes column is a template change. A changed meaning is a contract change,
  with tests and a migration.
- **Sample and clean templates:** every workbook type has both, from the same
  writers. Clean templates exist per pricing currency, with formulas and lists
  but no records, and are the only files the hub provisions a shop from. Changes
  explored in Sheets or Excel go back into Python.
- **Who writes what:** the hub is the only view writer. Most rows come from
  journal events, and the hub makes `Stock`, `Balances`, `Months` and the Summary
  labels itself. A new table says which of these it is.
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
- `python -m dura_templates verify` passes, and `fingerprint --compare` lists
  only the files you meant to change.
- Late events, month and year boundaries, a missing device, a duplicate batch
  and rebuilding a damaged view are covered, where they apply.
- Design-only previews are labelled honestly.
