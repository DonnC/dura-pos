<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Contributing to Dura POS

Thank you for helping. Dura is for vendors who can't afford for their POS to
lose a sale, miscount their change, or lock up their records. Every rule below
protects one of those.

## 1. Understand the project (about 30 minutes)

1. Read the [README](README.md).
2. Read the four product pages in the [handbook](handbook/README.md): vision,
   capabilities, experience principles, glossary.
3. Skim the [roadmap](handbook/engineering/06-roadmap.md) to see what's next.
4. For code, read the [engineering contract](handbook/engineering/00-engineering-contract.md)
   and [architecture](handbook/engineering/01-architecture.md).

If two documents disagree, the handbook's [reading order](handbook/README.md#when-documents-disagree)
says which wins.

## 2. Ways to help

| You are | You could |
|---|---|
| A Flutter or Dart developer | Pick a Phase 2 roadmap task; add tests; improve `dura_ui` components |
| A designer | Review a screen against the [experience principles](handbook/product/03-experience-principles.md); improve the [prototype](handbook/design/prototype/) |
| Good with spreadsheets or accounting | Review the [sample shop](backend/templates/) and the [records policy](handbook/engineering/03-records-and-sheets.md); check that the numbers add up |
| A Shona or Ndebele speaker | Help with plain-language wording and translations |
| Close to vendors or shops | Run the five-vendor usability test; tell us what they actually need |
| Familiar with ZIMRA or Zimbabwean payments | Check designs against the spec; help answer [`notes/02`](notes/02-questions-for-zimra.md) |

## 3. Before you start work

- **Open or find an issue first** for anything bigger than a small fix, and
  agree the scope. Use the issue templates, with fictional data only.
- **Don't reopen the settled choices:**
  - no Dura-hosted cloud;
  - the shop's own Google account and keys;
  - free core with consulting revenue;
  - small shops, about ten phones at most;
  - MIT licence.

  They're explained in the [vision](handbook/product/01-vision.md).
- **A change to architecture needs a decision record** in
  [`handbook/decisions/`](handbook/decisions/0000-template.md).

## 4. Set up

```sh
cd client
flutter pub get
dart run melos bootstrap
dart run melos run verify
```

For the hub, run `npm ci` in `backend/hub`. For the templates, create a
virtual environment in `backend/templates` (`python -m venv .venv`), then run
`python -m pip install -r requirements.txt` there.

**In VS Code:**

- Open the repository root, and install the recommended extensions when
  asked.
- **Terminal → Run Task** has each component's verify command, plus
  *Verify everything*.
- The Run and Debug panel can start the app, debug the hub's tests, or debug
  the generator.
- Python tasks use the interpreter you select with *Python: Select
  Interpreter*.

Use the Flutter version in `client/.flutter-version`. All Flutter and Melos
commands run from `client/`. The hub and the workbook generator live in
`backend/`; each component's README says how to run and verify it, and the
shared rules are in [conventions](handbook/engineering/09-conventions.md).

## 5. How we work

**Test first, for behaviour:**

1. State an example with fictional shop data, e.g. "two loaves at USD 1.00,
   paid with USD 5.00, gives USD 3.00 change".
2. Write a test, run it, and see it fail for the right reason.
3. Make it pass with the smallest change, then refactor while green.
4. For a bug, write the failing regression test before fixing it.

Put the red and green evidence in the pull request. The full method is in
[testing](handbook/engineering/02-testing.md).

**Keep these guarantees:**

- **Local first:** save before any network call, payment or fiscal call.
- **Exact money:** decimal types only, never `double`. Every amount carries a
  currency, and currencies are never added together.
- **Live, test and practice data never mix.**
- **External outcomes stay honest:**
  - unknown is a state;
  - a payment is confirmed only by a check;
  - nothing retries a charge blindly.
- **Business rules live in `dura_core`,** not in widgets. Swap adapters
  through their contracts.
- **A file, tab or column change** includes sample rows, the dictionary, and
  migration and restore effects. Change the generator, regenerate, and run
  both sample checks.

**Code style:**

- At most 500 lines per handwritten file.
- Format Dart to 80 columns.
- One widget, model or service per file.
- Colours come from theme tokens; constants belong to their owning package.
- New handwritten files start with the copyright, AUTHORS, MIT and SPDX
  header in [`client/tool/source_header.dart`](client/tool/source_header.dart),
  in the file's comment syntax. Generated files, JSON and lockfiles are exempt.
- Comment contracts and the "why", not the obvious.

`dart run melos run check` enforces the header, size, boundary and colour
rules. The full rules are in [coding](handbook/engineering/07-coding-and-diagnostics.md).

**UI changes:**

- Follow the [experience principles](handbook/product/03-experience-principles.md)
  and their checklist.
- Review golden images by eye before updating them, and attach before and
  after images to the PR. Never accept goldens automatically.

**Drift changes:** run `dart run melos run generate` and commit the generated
output.

## 6. Pull requests

- **Branch from `develop`,** and target `develop`.
- **Fill in the PR template:**
  - the shop workflow affected;
  - the TDD evidence;
  - record and compatibility effects;
  - the checks you actually ran.
- **Run `dart run melos run verify` locally.** CI runs the same checks on your
  PR, but a green CI run doesn't replace saying what you tested.
- **Add a line to [CHANGELOG](CHANGELOG.md)** under *Unreleased* for any
  meaningful change.
- **Use conventional commit prefixes** where they fit: `feat`, `fix`, `docs`,
  `test`, `refactor`, `build`, `chore`.

## 7. Safety

- Use fictional data and fake services in tests, screenshots and issues.
- Never post PINs, merchant keys, ZIMRA keys, tokens or real customer records.
- Security problems go through [SECURITY](SECURITY.md), not public issues.
- Don't claim ZIMRA certification, or any performance or accessibility result
  that hasn't been measured.

## Licence

By contributing, you agree that your contribution is licensed under the
[MIT licence](LICENSE). Third-party notices are kept. Agreed contributors are
listed in [AUTHORS](AUTHORS).
