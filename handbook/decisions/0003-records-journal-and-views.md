<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Decision 0003: a journal for history, Sheets for people

Status: Accepted
Date: 2 November 2026
Roadmap slice: 3 (owner records and exit), with spikes in 0

## Problem and evidence

The design notes and the handbook described two different record models:

- **Notes 03, 04, 10 and 12:** phones append rows straight into Google Sheets,
  and the Sheets are the shared record. A phone reads back the row IDs it sent
  before marking them synced. The year-end archive removes last year's rows.
- **The handbook and the records design:** each phone uploads an append-only
  journal to the owner's Drive, and the Sheets are views built from it.

Why direct rows aren't enough on their own:

- **Sheets `values.append` doesn't enforce unique IDs.** A timed-out request
  may or may not have landed. A retry can add the row twice, and a read-back
  between two phones' appends can race.
- **A partly written batch leaves a tab wrong,** with no independent copy to
  repair it from.
- **Owners can edit any cell.** If the sheet is the only record, one edit can
  silently change history.

## Decision

1. **The journal is the shared history.**
   - Each phone saves events and its outbox in one local transaction.
   - Each phone seals events into immutable, ID-stamped batch files, uploaded
     to the business's Drive folder.
   - Corrections, refunds and later outcomes are new events linked to the
     originals. Nothing in a completed batch is edited.
2. **Sheets are views and input surfaces.**
   - `My Shop` and the monthly workbooks are built from the journal.
   - Green input tabs (products, prices, rates, contacts) are owner proposals.
     They're checked, journalled as accepted changes, and then propagated.
   - Editing a report cell never changes a transaction.
3. **A sale completes on the phone.** Upload, payment confirmation and ZIMRA
   acceptance are later, separate states. Neither Sheets nor the Shop Hub is
   ever needed to finish a cash sale.
> **Points 4 and 5 are replaced by [decision 0005](0005-shop-hub-as-the-backend.md):**
> every upload goes through the Shop Hub, the hub is the only view writer, and
> the hub (not the app) creates workbooks from the templates.

4. **Two ways to upload:**
   - a phone signed in to the shop's Google account uploads its batches
     directly through the Drive API (`drive.file`);
   - a paired staff phone without that account may upload through the Shop
     Hub. This path must be proven (spike 0(e)) before anyone relies on it.
5. **One view writer at a time:**
   - the owner's phone, when there's no hub;
   - the Shop Hub, when it's installed.

   Switching between them is a recorded handover. There is no automatic
   dual-writer failover in the first release.
6. **Workbooks are template-first.**
   - The Python generator (`samples/generate_samples.py`, growing into
     modules) produces approved clean templates, plus a matching demo shop.
   - The generated `.xlsx` templates are committed and bundled with the app.
     Contributors working on the app never need to run Python.
   - The app uploads a bundled template to the shop's Drive and has Drive
     convert it to a Google Sheet. Because Dura uploads it, `drive.file`
     covers it.
   - The app fills it using a small compatibility contract that names fields
     by ID, not column letter.
   - This replaces note 12 §5's "from code, not from a template file". See
     [`schema/PLAN.md`](../../schema/PLAN.md).
7. **No destructive year-end clearing in the first release.** Original
   journals are kept. The year end creates opening positions and groups files
   by year. It does not delete rows. This replaces the "remove last year's
   rows" step in notes 05 and 10.

## What stays from the notes

- The owner's Drive is the only shared store; there's no Dura server.
- One folder per business, with `My Shop` and one workbook per month, named
  like `2026-10 October`, holding Activity as a tab.
- Workbooks are made for people:
  - a Read Me in every file;
  - tabs colour-coded by who writes them;
  - `Lists` dropdowns and date validation;
  - red negatives, status dots and charts.
- Formulas never cross files and never name a year.
- Files are found by stored ID, never by searching Drive by name.
- The pricing currency is the owner's choice; currencies are never added
  together.
- Test mode is separate in every way: a `(TEST)` folder, its own database,
  `T-` IDs, ZIMRA's test environment and payment sandboxes.
- The Shop Hub holds payment keys and runs scheduled work. It never touches
  ZIMRA and is never in the path of a sale.

## Compatibility and migration

- **Nothing is built yet,** so no shop data migrates.
- **The sample shop** in `samples/Dura POS/` still has note 12's layout, with
  ledgers in `My Shop` and a `Data year` setting. It stays the executable spec
  until the records phase moves it to the handbook's layout
  ([`03-records-and-sheets.md`](../engineering/03-records-and-sheets.md)) and
  adds journal examples. Both checks must still pass.
- **More files in Drive:** journal batches, roughly `2 + months + batches +
  backups + attachments + exports`. Batch size is chosen by measurement.

## Acceptance and reversal

Before live piloting, prove each of these with tests or spikes:

1. A cash sale survives the app being killed and restarted.
2. A lost upload response can't double-count the sale, its stock or its cash.
3. A partly updated workbook is detected and rebuilt from the journal.
4. An owner's sheet edit is validated, journalled and reconstructable.
5. A restore onto a new phone doesn't replay fiscal state or duplicate events.
6. An export rebuilds the opening position, transactions, stock and balances.
7. A second phone, signed in to the same account, sees Dura's files under
   `drive.file`.
8. A converted template keeps its dropdowns, colour rules, formulas and
   charts in Google Sheets.

**Reversal:** if the journal proves too costly in files, quota or complexity
for one-phone shops, a later decision may let single-phone mode write views
only. The journal format stays the export and recovery format either way.
