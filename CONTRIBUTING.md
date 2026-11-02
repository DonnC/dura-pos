<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Contributing

Start with AGENTS.md, the engineering contract and the current roadmap under
handbook. Run Flutter/Melos from client/, using its pinned SDK and single lockfile.
Root-level research, samples and repository-wide policies stay outside client/.
Do not install another state-management or DI system for a local feature.

For meaningful behaviour, write an acceptance test and observe the intended
failure before implementation. Implement minimally, refactor green and run
relevant contracts, widget/golden, persistence and recovery checks. Add regression
tests before bug fixes. Record red/green evidence and actual limitations in the PR.

Run `dart run melos run verify` before merging. Run `dart run melos run generate`
when Drift definitions change; include the generated result. CI runs only after
a main push, so it cannot be relied on as a pre-merge PR check. No auto-merge.

Source/test files are limited to 500 lines; Dart uses 80-column formatting.
Centralise constants by ownership, derive colours from theme, and extract cohesive
shared logic when about 60% similar. Avoid needless classes/enums and abstractions.
Use the copyright/AUTHORS/MIT/SPDX header in client/tool/source_header.dart,
adapted to each language. New files use the current year. Preserve third-party
licence notices and older copyright years. Do not edit the owner's CLAUDE.md.
Generated code/JSON/lockfiles are exempt. Comment contracts and why, not obvious code.

Preserve local-first persistence, exact money, business/mode isolation and known
external-outcome states. Swap adapters through contracts rather than changing UI
rules. A UI-only change does not alter pricing/accounting. New record designs
include previews, dictionaries, versions and migration/restore effects.

Review real golden renders before changing baselines. The initial canonical
environment is Windows with pinned Flutter and test fonts. Never auto-update
goldens in CI or claim unmeasured performance/accessibility compliance.

Use fictitious data, safe diagnostics and fake external services in tests. Never
post PINs, merchant keys, private fiscal keys or customer records. The application
has no live fiscal/payment integrations yet. Do not claim certification.

Update the changelog for meaningful pushes. Commit/push/deploy only when authorised.
Original contributions use the root MIT licence; preserve third-party notices
and update AUTHORS with agreed attribution. No AI attribution trailers.
