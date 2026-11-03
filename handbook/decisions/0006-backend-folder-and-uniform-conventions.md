<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Decision 0006: a `backend/` folder, JavaScript for the hub, Excel-compatible templates

Status: Accepted
Date: 3 November 2026
Roadmap slice: 3 (owner records) and 6 (hub)

## Problem and evidence

The parts that run in, or provision, the shop's Google account were scattered
across four root folders:

- `samples/` held the generator, the checks and the sample shop;
- `schema/` held the template plan;
- `hub/` held the hub plan;
- `reference/`, since renamed `data/` by the owner, held the HS code list.

The hub needed a language. The templates needed a hard rule, and a check, for
Excel compatibility. Conventions differed between the Dart, Python and planned
Apps Script code.

The generator also had two portability bugs: it found the HS list by a path
outside its own folder, and one check opened that file without stating an
encoding, so it failed on Windows.

## Decision

### 1. Layout

| Folder | Holds |
|---|---|
| `client/` | The Flutter app and its packages |
| `backend/hub/` | The Shop Hub: Apps Script source, its protocol and tests |
| `backend/templates/` | The Python generator, its checks, the template plan, and `sample/Dura POS/` |
| `data/` | Reference data shared by the app, the hub and the generator, such as `zimra_hs_codes.csv` |
| `handbook/`, `notes/`, `research/` | As in decision 0004 |

- **Why `backend/`:** it pairs with `client/`. It names the role, not a
  server Dura runs, because Dura runs none.
- **A future non-Google backend** gets its own folder beside `hub/`.
- **This replaces** the `samples/`, `schema/`, `hub/` and `reference/` rows of
  decision 0004.

### 2. The hub is written in JavaScript

The hub uses JavaScript on Apps Script's V8 runtime.

- **No build step.** The code in the repository is the code that runs, and
  it's the code shown in Google's editor and in error traces. With
  TypeScript, both show compiled output.
- **Type checking without compiling:**
  - JSDoc types, with `// @ts-check` in each file;
  - `@types/google-apps-script`;
  - `tsc --noEmit --checkJs` as a check only.
- **Tests run on Node's built-in test runner,** with no test framework. The
  test helper loads the hub's files into one `vm` context, the same shared
  global scope Apps Script gives them, with fake Google services. Tests never
  touch a real account.
- **`clasp` pushes the same files** to a developer's own test account. The
  app's installer uploads the same files to a shop.
- **Node and every npm package are pinned,** and npm is added to the monthly
  Dependabot groups.

### 3. Templates must work in Excel too

- **Targets:** Google Sheets, and Excel 2019 or Microsoft 365. LibreOffice is
  best effort.
- **Functions:** only those in the allowlist in `backend/templates/check_excel.py`.
  - Google-only functions are refused. Examples: `QUERY`, `ARRAYFORMULA`,
    `IMPORTRANGE`, `GOOGLEFINANCE`, `FILTER`.
  - `MAXIFS` and `MINIFS` are allowed, but they need Excel 2019 or later.
- **No formula crosses files or names a year.** No macros, scripts or custom
  functions inside a workbook.
- **Pivots and charts are extras,** never the only way to read a number.
- **The check runs in CI** on the committed sample and on a fresh
  regeneration.

### 4. Uniform conventions

They're set out in
[`../engineering/09-conventions.md`](../engineering/09-conventions.md):

- one `README.md` and one verify command per component;
- `snake_case` file names;
- `*_test.<ext>` test files;
- the same licence header in every language;
- pinned toolchains.

### 5. Onboarding is automated as far as Google allows

The owner's phone does every step that Dura can do. What remains are Google's
own screens:

- the Apps Script API switch;
- the sign-in consent;
- the hub's consent.

The goal is one *Connect Google Drive* tap plus those screens. Spike 1 in
note 15 measures it.

## Compatibility and migration

- Files moved with `git mv`, so their history follows them.
- **Paths:**
  - the generator writes to `backend/templates/sample/Dura POS/`;
  - the generator and `check_samples.py` read `data/zimra_hs_codes.csv`
    relative to their own location;
  - `check_samples.py` reads that file as UTF-8.
- Both existing checks and the new Excel check pass on the committed sample,
  and again after a regeneration from the new folder.
- `generate_samples.py` is 2,499 lines, beyond the 500-line rule. It predates
  that rule. Split it into modules when the templates work starts.

## Acceptance and reversal

- CI's `templates` job installs the pinned requirements, checks the committed
  sample, regenerates it, and checks again. Release depends on it.
- To reverse the folder change, `git mv` the files back. To reverse the
  language choice, do it before the hub has any code.
