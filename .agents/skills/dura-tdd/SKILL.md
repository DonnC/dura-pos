---
name: dura-tdd
description: Implement or fix Dura POS business behaviour through TDD, durable workflow boundaries and reusable adapter contracts. Use for Dura feature or regression work, not unrelated repositories.
---
<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->
# Dura behaviour changes

## Read first

- `handbook/engineering/00-engineering-contract.md`, `01-architecture.md`
  and `02-testing.md`.
- The current roadmap slice in `06-roadmap.md`, and the capability map. Don't
  infer that a feature is built from the notes.

## Steps

1. **State one observable example** with fictional shop data. For example:
   "two loaves at USD 1.00, cash USD 5.00, change USD 3.00".
2. **Write the test and run it.** Confirm it fails for the intended reason.
   A missing tool, SDK or import isn't the intended failure.
3. **Implement the minimum,** and run the focused tests until they pass.
4. **Refactor while green.** Run the affected regression suites and adapter
   contract suites.
5. **Update what the change affects:**
   - schemas and data previews;
   - migrations;
   - roadmap evidence;
   - the changelog.

## Rules

- **Checkout and sync changes** include these cases, where they apply:
  - the durable transaction boundary;
  - an unknown external outcome;
  - a retry;
  - a duplicate;
  - a process restart.
- **Preserve recorded facts:** original money, rate, tax and cost facts, and
  the isolation between live, test and practice data.
- **Shared rules stay in pure Dart** (`dura_core`). A UI or platform change
  must not fork a business rule.
- **Use the package's real test targets.** Don't claim helpers or suites that
  don't exist.

## Done when

- The red and green evidence is recorded for the PR.
- Only tests that were actually run are reported as passing, and remaining
  limits are stated.
- Nothing is committed, pushed or published without the user's authorisation.
