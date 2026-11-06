<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Uniform conventions

The same rules apply in every part of the repository, whatever the language.
Language-specific detail stays in that component's README.
[Decision 0006](../decisions/0006-backend-folder-and-uniform-conventions.md)
records why.

## Components

| Component | Language | Verify from its folder |
|---|---|---|
| `client/` | Dart and Flutter | `dart run melos run verify` |
| `backend/hub/` | JavaScript on Apps Script V8 | `npm run verify` (type check, then tests) |
| `backend/templates/` | Python 3 | `python -m dura_templates verify` |

Each component has:

- **a `README.md`** that says what it is, how to set it up, how to run it,
  and how to verify it;
- **one verify command,** which CI runs;
- **a pinned toolchain:**
  - `client/.flutter-version` and `pubspec.lock`;
  - `backend/hub/package.json` with a lockfile, and a Node version;
  - `backend/templates/requirements.txt`.

## Names

| Thing | Rule | Examples |
|---|---|---|
| Folders | lower case; `-` between words | `backend/hub`, `release-notes` |
| Dart packages | `snake_case`, as Dart requires | `dura_core` |
| Source files, every language | `snake_case` | `cash_sale.dart`, `excel_compat.py`, `journal_put.js` |
| Test files | `*_test.<ext>` | `money_test.dart`, `journal_put_test.js`, `excel_compat_test.py` |
| Notes | `NN-topic.md` | `15-apps-script-route.md` |
| Decisions | `NNNN-topic.md` | `0006-backend-folder-and-uniform-conventions.md` |
| Workbook files and tabs | Plain English, for people | `My Shop`, `2026-11 November`, `Stock Movements` |
| IDs in records | `<device>-<kind><yymmdd>-<seq>`: the date in the business time zone, the sequence per device, kind and day, at least 4 digits; `T-` prefix in test mode (note 04) | `P1-S261103-0031`, `P2-E261103-0611`, `T-P1-S261103-0031` |
| Business IDs | Name slug, setup date, 4 random hex | `chipos-corner-shop-261103-a1b2` |
| Secrets and codes | Random hex, never readable or dated | pairing codes, device secrets |

## Files

- **Header:** every original handwritten file starts with the copyright,
  AUTHORS, MIT and SPDX header, in the language's comment syntax. The
  canonical text is in `client/tool/source_header.dart`. Generated files,
  JSON and lockfiles are exempt.
- **Size:** at most 500 lines per handwritten source or test file, with one
  responsibility per file.
  - The old exception, `generate_samples.py`, is now the `dura_templates`
    package (decision 0007).
- **Line length:**
  - Dart is formatted to 80 columns;
  - other code stays near 100;
  - prose wraps near 80.
- **Comments** explain contracts and reasons, not what the code plainly does.

## Shared rules

- **Money:** exact decimals in every language, never floating point.
  - Dart uses `Money`.
  - Python uses `Decimal`.
  - The hub keeps amounts as decimal strings and never does arithmetic on
    them as numbers.
  - JSON carries amounts as strings.
- **Currencies are never added together,** in code, sheets or reports.
- **Time:** stored with its UTC offset. Periods use the business time zone.
- **Secrets** never appear in logs, tests, fixtures, sheets, exports or issues.
- **Tests use fictional data and fake services.** CI never needs a real
  Google account, payment key or ZIMRA credential.
- **Each component's changes go in the root `CHANGELOG.md`.**
