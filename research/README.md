<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Research archive

The raw material Dura's design grew from, kept so anyone can trace the
reasoning. **Nothing here is current guidance.** It's unreviewed AI output and
early thinking, and much of it was later corrected. For the current design,
read the [handbook](../handbook/README.md).

| File | What it is | Assessed and superseded by |
|---|---|---|
| [`2026-10-27-first-brainstorm.md`](2026-10-27-first-brainstorm.md) | The first AI brainstorm: offline engine, direct ZIMRA, Sheets as a free dashboard, market view | [`notes/01`](../notes/01-assessment.md), which corrects it point by point |
| [`gemini/01-apps-script-and-files.md`](gemini/01-apps-script-and-files.md) | Gemini, 29 October: Apps Script as a payment back end, file organisation, onboarding and updates | [`notes/06`](../notes/06-apps-script-gateway-assessment.md) and [`notes/12`](../notes/12-hub-test-mode-files-migration.md) |
| [`gemini/02-flutter-onboarding-and-scripts.md`](gemini/02-flutter-onboarding-and-scripts.md) | Gemini follow-ups: Flutter packages, with or without Apps Script, onboarding, rollover, sample scripts | [Decision 0001](../handbook/decisions/0001-foundation.md) and [decision 0003](../handbook/decisions/0003-records-journal-and-views.md) |
| [`codex-product-brief.md`](codex-product-brief.md) | Codex, 2 November: a full prose description of the intended product, including council levies, settlement and shift handover | Folded into the [vision](../handbook/product/01-vision.md) and [capability map](../handbook/product/02-capabilities.md) |

## Rules for this folder

- **Don't copy code from it.** Several samples are known to be unsafe, such as
  service-account keys in the app, unsigned web-app endpoints, and files found
  by name. See [`notes/06`](../notes/06-apps-script-gateway-assessment.md).
- **Remove personal details** (emails, phone numbers, account names) before
  adding a transcript.
- **Add a row above** for each new file, saying what assessed or superseded it.
