<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Changelog

## Unreleased — 0.1.0-dev.1 foundation

### Added: photos, exports and the last sheet gaps

- **`attachment.put`** saves product and supplier-invoice photos where the
  sample shows them, and a retry doesn't make a second file.
- **`export.request`,** owner only, saves an Excel copy of a workbook or one tab
  as CSV to `Exports/`. CSV text can't run as a formula in Excel.
- **Summary breakdowns now work in a real shop.** Templates reserve guarded
  rows, the contract says where, and the hub writes the labels, best seller
  first. The month template gains the items-sold chart.
- **`Balances`** gets a row per contact and currency from the Money Ledger.
- **`Payment Callbacks` and `Months` are hub-only** in the contract.
- **Validation:** 124 hub tests, 16 template tests; all 102 sample files match
  their fingerprints.

### Added: payments in the hub

- **Paynow mobile checkout** (EcoCash, OneMoney, InnBucks, O'mari) with the
  shop's own keys, set per currency from the owner's phone and never returned.
- **Paid comes only from Paynow's status check,** with its hash verified and
  the amount matched. A callback is logged and only prompts a check.
- **A charge is never repeated.** The reference is claimed before Paynow is
  called, and a lost reply stays `unknown`.
- **`Payment Callbacks`** gets a row per update, rejected ones included, and
  only the hub can write it.
- **Providers sit behind one adapter contract,** ready for ZB Smile&Pay.
- **The customer's number isn't kept** after the prompt.
- **Not yet tried against Paynow's sandbox.**
- **Validation:** 115 hub tests; seven deliberate breaks of the hash, amount,
  ownership and claim checks each failed a test.

### Added: daily operation in the hub

- **`changes.pull`** gives phones master data by field ID, in one Sheets read.
  Bad rows are skipped and listed, and a phone already up to date gets a short
  reply.
- **The `Stock` tab** gets a row per active product and location, with the
  generator's own formulas (now in `contract.json`), and old rows are blanked.
- **Timers:** views catch up every 15 minutes. A daily pass makes next month's
  file from the 25th, moves `Data year` on and keeps the `Months` tab current,
  so `Reports` works across months. A failing step doesn't stop the others.
- **`status`** reports hub version, view lag and each phone's progress, with no
  secrets.
- **`Months` is hub-only:** a phone's rows for it are skipped.
- **Validation:** 85 hub tests, 14 template tests; all 102 sample files match
  their fingerprints.

### Added: Sheets views in the hub

- **Journal rows now reach the workbooks.** Events carry rows keyed by stable
  field IDs; the hub finds columns by heading, so a moved column keeps working.
- **`dist/contract.json`** names each table and field; `templates` also
  generates `backend/hub/src/view_contract.js`, so a new column needs no hub
  change.
- **Exactly once without reading the sheet:** rows go to explicit positions,
  and the pointers move only after every write succeeded, so a retry
  overwrites the same rows.
- **A view failure never fails an upload.** The batch stays queued.
- **Late sales** reach their own month, creating that file if it's missing.
- **Tabs grow** before they run out of rows.
- **Validation:** 69 hub tests, 12 template tests; the view tests were seen
  failing first.

### Added: the hub fills in new files after converting them

- **`setup.run` now writes** My Shop's business name, hub version and data
  year, and the month's first day into `Summary!E1`. So the Summary, Reports
  and day rows work from the first open.
- **Quota:** one Sheets `batchUpdate` per file, and none on a repeat. A failed
  write resumes without recreating any file.
- **`dist/manifest.json` now names the cells to fill.** A hub test requires the
  hub's addresses to match, and a template test checks each address's label.
- **Narrower permission:** the hub's manifest drops the `spreadsheets` scope,
  which covered all the owner's spreadsheets. `drive.file` is enough for files
  the hub created, per the Sheets API reference. Not yet proven on a real
  account.
- **Validation:** 59 hub tests, the six new ones seen failing first; the type
  check is clean.

### Added: clean templates, one set per pricing currency

- **Decision 0008:** `python -m dura_templates templates` builds
  `dist/<USD|ZWG|ZAR>/My Shop.xlsx` and `Month.xlsx`, plus `manifest.json`
  with each file's SHA-256.
- **What a template contains:**
  - every heading, formula, dropdown, colour rule, chart and Read Me;
  - starter Lists and note 10's Settings defaults;
  - the pricing currency accepted;
  - no rows, and no sample identity.
- **The same writers build the sample and the templates:**
  - `My Shop`'s writer lays out content it's given;
  - the month file has a template mode, whose Summary takes its month from
    `Summary!E1` with guarded day formulas.
- **Headings follow the pricing currency,** e.g. `Price (ZWG)` and `USD per 1
  ZWG`. The currency is set per process from `DURA_PRICING_CURRENCY`.
- **Templates are byte-reproducible:** zip times and creation stamps are
  fixed. `dist/` is committed, and Git never converts it.
- **10 template tests,** run by `verify`, cover:
  - one set per currency, and the manifest's hashes;
  - identical rebuilds;
  - no sample names in any cell;
  - empty data tabs, currency headings, dropdowns;
  - the month's period cell;
  - Excel compatibility;
  - the committed `dist/` matching a fresh build.

  They were written after the code. Two mutations confirmed they fail when
  they should.
- **Hub:** `setup.run` now requires `pricingCurrency` (USD, ZWG or ZAR, with
  no default), uses that currency's templates, and records the currency in
  `business.json`. The template manifest is per currency. 53 hub tests pass.
- **The sample is unchanged:** all 102 files still match by fingerprint.

### Changed: the workbook generator is a package with a CLI

- **Decision 0007:** the 2,499-line `generate_samples.py` is now the
  `dura_templates` package, in modules of under 500 lines each:
  - `sample/`: the fictional shop and its simulation;
  - `workbook/`: styles, tables, headings, dropdowns;
  - `files/`: one module per file type;
  - `checks/`.

  Every public function has a docstring.
- **One command line, `python -m dura_templates`:**
  - `sample [--out]`;
  - `check`, `excel` and `verify`;
  - `formulas`;
  - `fingerprint --write` and `--compare`.

  CI, the VS Code tasks and the docs use it.
- **New `fingerprint` command:** proves a code change is or isn't a layout
  change, by hashing every file except each workbook's timestamp part. The
  split was proven with it: all 102 generated files match the old script's
  output.
- **`backend/templates/README.md` rewritten:**
  - why the generator works this way;
  - every file and tab it creates;
  - the simulated year's timeline;
  - the archive and the test shop;
  - the code map;
  - how to change the layout safely.

### Fixed

- **`check` (formerly `check_samples.py`) exited with code 0 even when it
  found problems.** It now exits 1, so CI can fail.
- **`sample --out` refuses a folder** that holds files the generator didn't
  make. It checks before simulating, so a mistake costs two seconds, not 90.
- **`__pycache__/` folders** are now ignored by Git.

### Added: shop setup in the hub, and fewer quota calls

- **New owner-only `setup.run` action (protocol updated).** It creates:
  - `Dura POS/<shop>/`;
  - `My Shop`;
  - `Journal/`;
  - the year folder;
  - this month's workbook, e.g. `2026-11 November`, in the business time
    zone;
  - `business.json`, with no secrets.
- **How setup behaves:**
  - workbooks are converted from `.xlsx` templates, downloaded in one
    parallel fetch and checked against pinned SHA-256 hashes;
  - it's resumable: a repeat creates nothing, and a part-failed run picks up
    from the first missing file.
- **The file registry** is kept in Script Properties as Drive IDs, so files
  are never found by name. Journal batches now go to the registered
  `Journal` folder.
- **Fewer quota calls:**
  - Script Properties are read once per request, and again only after taking
    the lock;
  - related values are written with one `setProperties`;
  - Drive returns only file IDs.
- **Readable, dated IDs** are written into the conventions:
  `<device>-<kind><yymmdd>-<seq>`, e.g. `P1-S261103-0031`, following
  note 04. Business IDs read like `chipos-corner-shop-261103-a1b2`.
- **Validation:**
  - 12 new tests, all seen failing first;
  - one test that passed with no implementation was tightened;
  - 52 hub tests pass, and the type check is clean.
- **Checked against the current official docs:** the Apps Script Drive v3
  advanced service, Properties, `UrlFetchApp` and the best-practices page.

### Added: VS Code workspace setup

- **`.vscode/`:**
  - recommended extensions: Dart, Flutter, Python, debugpy, YAML, GitHub
    Actions;
  - shared editor settings that follow the conventions: Dart formatted to
    80 columns on save, no reformatting of the tab-indented generator,
    build output hidden;
  - tasks for each component's verify command, plus *Verify everything*;
  - debug configurations for the app, the hub's tests and the generator.
- **Python virtual environments** are ignored by Git.
- **CONTRIBUTING** explains the setup.

### Added: the Shop Hub's first behaviours

- **`backend/hub/PROTOCOL.md`, version 1:**
  - the JSON envelope;
  - HMAC-SHA256 signing over canonical JSON;
  - the six error categories;
  - the `pair`, `pairing.create`, `device.revoke` and `journal.put` actions;
  - the planned actions.
- **The hub, in plain JavaScript:**
  - signed requests, rejecting bad signatures, stale clocks, replays, unknown
    or removed phones, and malformed envelopes;
  - pairing:
    - a one-time install code pairs the owner's phone, within 15 minutes;
    - one-time 10-minute codes pair seller phones;
    - codes are stored only as hashes;
  - the owner can remove a phone;
  - journal batches are accepted in order per phone, under the script lock:
    - duplicates are acknowledged without being stored twice;
    - gaps ask for the missing batch;
    - a failed write acknowledges nothing;
  - batches are stored as JSON files through the Drive advanced service;
  - unexpected errors are reported without details.
- **Tooling:** pinned clasp 3.4.1, TypeScript 5.9.3 (type checking only) and
  the Apps Script types. The manifest has the V8 runtime, the scopes, the
  Drive advanced service, and the web app running as the owner.
- **CI:** a new `hub` job runs `npm ci` and `npm run verify`. npm joins the
  monthly Dependabot groups.
- **Validation:**
  - 40 tests, first failing on unimplemented stubs, now passing;
  - the test client is written independently from `PROTOCOL.md`;
  - the type check covers all 10 source files, and a probe file with errors
    was caught.

### Changed: `backend/` folder, Excel-compatible templates, uniform conventions

- **Decision 0006:**
  - the hub moves to `backend/hub/`;
  - the generator, its checks, the template plan and the sample shop move to
    `backend/templates/`, with the sample under `sample/Dura POS/`;
  - the HS code list is in `data/`;
  - all moves were made with `git mv`.
- **The hub will be written in JavaScript on Apps Script V8,** with no build
  step:
  - JSDoc types checked by `tsc --checkJs`;
  - tests on Node's built-in runner, with fake Google services;
  - `clasp` for pushing to test accounts.
- **New `check_excel.py`:** fails on any function outside an allowlist that
  works in both Google Sheets and Excel 2019 or later. The current sample
  passes; a fixture using `ARRAYFORMULA` fails.
- **New `requirements.txt`** pins openpyxl 3.1.5 and Pillow 13.0.0.
- **New `handbook/engineering/09-conventions.md`:**
  - one README and one verify command per component;
  - `snake_case` files and `*_test` tests;
  - the same header in every language;
  - shared rules for money, time and secrets.
- **CI:** a new `templates` job checks the committed sample, regenerates it,
  and checks again. Release now waits for it. pip joins the monthly
  Dependabot groups.

### Fixed

- **`check_samples.py` failed on Windows.** It read the HS code list without
  stating an encoding; it now reads it as UTF-8.
- **The generator and checks found the HS code list relative to the
  repository layout.** They now find it relative to their own file.

### Design decisions: the Shop Hub is the backend

- **Note 15 researches the Apps Script route:**
  - install from the app;
  - files and the registry;
  - QR pairing and signed requests;
  - sync;
  - payments;
  - security;
  - Gmail quotas;
  - spikes.
- **Decision 0005:**
  - everything that reaches Google goes through the shop's own Apps Script
    hub, so usage counts against the shop's account;
  - Dura's Google Cloud project is used only to install and update the hub;
  - phones pair by QR and hold no Google token;
  - the hub is the only view writer, and creates workbooks from the
    templates.
- **The Flutter app reaches any backend through one port in `dura_core`.**
  The hub is its first adapter, in `dura_hub`.
- **Replaced:** points 4 and 5 of decision 0003.
- **Updated to match:** the README, vision, glossary, capability map,
  architecture, security policy and `CLAUDE.md`.

### Added: exact money and cash sales (phase 2, first slice)

- **New `dura_core` types:** `Currency`, `Money`, `Quantity` and
  `ExchangeRate`. They use exact decimals (the `decimal` package), never
  `double`, and round half away from zero to the currency's scale.
  - Money in different currencies can't be added, subtracted or compared.
  - An entered amount with more decimal places than its currency allows is
    rejected, never rounded.
- **`SaleLine`, `CashSale` and `CashPayment`:**
  - a line keeps the name and price it was sold at, and is rounded per line;
  - a sale needs at least one line, all in one currency;
  - cash short of the total, or in another currency, is refused;
  - change and the amount applied to the sale are recorded separately from
    cash received.
- **Out of scope for this slice:** paying in another currency, split
  payments, storage and UI.
- **Validation:** 16 new tests, first failing on unimplemented skeletons;
  `dart run melos run verify` passed with 47 tests.

### Documentation and project structure

- **New `handbook/product/` pages:**
  - the vision: the goal, users, promise, business model, non-goals and
    reasons;
  - the capability map: every feature with its status and phase;
  - the experience principles: the five-second rule, states, language, look
    and targets;
  - a glossary.
- **New `handbook/README.md`** maps every document, sets the reading order
  when documents disagree, and lists what changed since the Kotlin-era notes.
- **Decision 0003:**
  - the uploaded journal is the shared history, and Sheets are views and
    checked inputs;
  - one view writer at a time;
  - workbooks are template-first;
  - there's no destructive year-end clearing in the first release.
- **Template packaging:** the generated `.xlsx` templates are committed and
  bundled with the app. The app uploads them to the shop's Drive as Google
  Sheets, so app contributors don't need Python (decision 0003,
  `schema/PLAN.md`).
- **Decision 0004:**
  - the repository layout and research archive;
  - CI verification on pull requests.
- **Rewrites:**
  - `README.md` for a public launch;
  - `CONTRIBUTING.md` for first-time contributors;
  - `AGENTS.md`, `CLAUDE.md` and all seven project skills, now structured,
    deduplicated and pointing at current paths.
- **New files:** `CODE_OF_CONDUCT.md`, `SUPPORT.md`, and an issue-template
  `config.yml` that turns off blank issues and links to security and support.
  `SECURITY.md` now lists high-impact areas.
- **`cdx/` dissolved:**
  - the records design, mobile concept, prototype and branding moved to
    `handbook/design/`;
  - the staged copies of the skills, handbook and GitHub files were deleted,
    as their active versions exist.
- **Research moved to `research/`, with an index:**
  - the first brainstorm;
  - the Gemini transcripts (part 2 recovered from the HTML export);
  - the Codex product brief.

  The 1 MB Gemini HTML export, which embedded a personal email address, was
  removed from the tree. It remains in Git history.
- **`notes/README.md`** says which parts of each note are still current.
- **Corrected stale handbook statements:** the GPL licence, `cdx` paths, and
  main-only CI.

### Compatibility

- No app behaviour, data format or workbook layout changed.
- The CI workflow now also runs verification on pull requests. The release job
  is skipped there.

### Changed

- Move the Flutter workspace, packages, tooling and tests into client/; keep
  research, samples, handbook, GitHub configuration and release metadata at root.
- Apply MIT to original project work and add AUTHORS plus consistent copyright,
  licence and SPDX headers. Preserve third-party notices and earlier Git history.
- Restored the owner's original CLAUDE.md and prohibited contributor edits to it.
- Split widgets, theme tokens, provider objects and data contracts into focused
  files; added scoped router/error-handler cleanup and closed startup database I/O.
- Use bundled Roboto through google_fonts with runtime fetching disabled.
- Replace Flutter launcher placeholders with the approved silo/phone dollar mark
  and reproducible legacy/adaptive Android resources.
- Use rotation_log for file rotation and ZIP creation behind Dura's redaction
  adapter. File counts, byte caps and ZIP retention are startup configuration;
  diagnostic copy reflects the active policy.
- Add an injectable owner-triggered issue-report operation that automatically
  archives and attaches diagnostics; future report screens/transport remain pending.

### Added

- Flutter Android shell with Pub workspaces, Melos tasks and a single client lockfile.
- Core contracts, Drift-backed non-secret preferences and reusable themed controls.
- On-device operational logs defaulting to ten 5 MiB files, bounded ZIP exports and
  confirmation before sharing from diagnostic settings.
- Unit/persistence/rotation/redaction/widget tests and shared-control visual baselines.
- Seven project-specific skills, architecture/records/roadmap policies in handbook,
  contribution templates, main-only CI and monthly grouped dependency updates.

### Design decisions

- Fiscalisation is optional per business and deferred; no fiscal plugin is installed.
- Python remains the core template generator, producing clean and mock-shop
  workbook pairs from shared definitions. The app copies approved templates;
  a small contract maps app-used fields. Existing copies receive deliberate
  upgrades that preserve owner additions.
- Native business records, sync, sales, authentication and gateways remain planned.

### Validation

- See handbook/engineering/08-foundation-validation.md for executed checks and limits.
- Publication is disabled; this is not a live-trading release or certification claim.
