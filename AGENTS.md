<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Dura POS contributor instructions

Start with `handbook/engineering/00-engineering-contract.md` and the roadmap.
Historical design work lives under `cdx/`; `docs/` is reserved for future use.
All Flutter apps, packages, Dart tooling, tests and dependency files live in
`client/`. Run Flutter/Melos commands there. Keep shared policies, samples,
research, Apps Script planning and GitHub configuration at repository root.

- Apply `.agents/skills/flutter-product-engineering/SKILL.md` for Flutter work
  and the complementary `premium-mobile-product-design` skill for mobile UX.
- Apply the relevant `dura-tdd`, `dura-ui`, `dura-records`, `dura-sync` or
  `dura-release` skill for those project workflows.
- Use Pub workspaces/Melos, Riverpod, exact domain types and replaceable adapters.
  Business logic does not belong in widgets. Fiscalisation is optional and later.
- Write an acceptance test, observe its intended failure, implement, then refactor
  green. Do not claim unexecuted tests or measurements.
- Handwritten source/test files: at most 500 lines; format Dart to 80 columns.
  Keep other handwritten lines near 100 columns, except unavoidable URLs/strings.
- When logic is about 60% shared, extract its cohesive common responsibility;
  do not force unrelated business rules into a generic abstraction.
- Centralise constants by owning package/domain. Colours come from theme tokens.
  Avoid unnecessary enums, classes, dependencies and speculative layers.
- Do not edit CLAUDE.md. It is maintained by the owner.
- One responsibility and one widget, data class or service per source file.
  Keep necessary widget/State pairs together; document other unavoidable exceptions.
  Prefer StatelessWidget/ConsumerWidget; use state only for real lifecycle needs.
- Use google_fonts through the shared theme with bundled offline font assets.
  Use approved branding assets for launcher icons; never ship Flutter placeholders.
- Dispose owned controllers, subscriptions, timers, routers and database handles.
  Use provider disposal, mounted checks and bounded caches; test relevant teardown.
- Begin original handwritten files with the DonnC & contributors copyright,
  AUTHORS reference, MIT licence reference and SPDX identifier shown in
  `client/tool/source_header.dart`, using the language's comment syntax. Use the
  current year for new work; preserve earlier years and third-party notices.
  Generated files/JSON/lockfiles are exempt. Comment contracts and invariants;
  never invent individual attribution or edit the owner's CLAUDE.md.
- Local-first; persist before side effects. Cache deliberately and bound storage.
  Diagnostic limits are injected configuration, defaulting to 10 files of 5 MiB.
  Do not repeat those values in UI copy; derive it from the active policy.
  Logs are redacted/local, with explicit ZIP sharing and bounded archive retention.
- Every file/tab/schema change includes sample data and migration/restore effects.
- Preserve user changes and licence. No AI attribution. No credentials/private
  business data in logs, tests, issues or screenshots.
- Commit only within the user's authorised scope. Never push, publish or deploy
  without authorisation. Main-only CI does not itself authorise publication.
