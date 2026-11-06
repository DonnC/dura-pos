# Instructions for AI coding assistants

These apply to any AI agent working in this repository. Human contributors
follow [CONTRIBUTING](CONTRIBUTING.md), which says the same in more detail.

## Orient first

- Read [`handbook/README.md`](handbook/README.md): it maps every document and
  says which wins when they disagree. Then read the product vision and the
  engineering contract.
- `notes/` is design reasoning from the Kotlin era. `research/` is historical.
  Neither is current where a decision record differs.
- **Don't infer that a feature exists from a document.** Check the code and
  the [capability map](handbook/product/02-capabilities.md).
- **`docs/` is reserved** for the owner's future use.

## Where things go

- **All Flutter code** (apps, packages, Dart tooling, tests, the SDK pin,
  pubspec and lockfile) lives in `client/`. Run Flutter and Melos commands
  from there.
- **The Shop Hub and the workbook generator** live in `backend/` (`hub/`,
  `templates/`). Shared reference data is in `data/`. Policies, research and
  GitHub configuration stay at the root.
- **Follow [`handbook/engineering/09-conventions.md`](handbook/engineering/09-conventions.md)**
  in every language: names, headers, tests, sizes, money and secrets.
- **New design notes** go in `notes/` as `NN-topic.md`. New decisions go in
  `handbook/decisions/`.

## Skills

Project workflows live in [`.agents/skills/`](.agents/skills/). Apply:

- **`flutter-product-engineering`** for any Flutter work;
- **`premium-mobile-product-design`** for mobile UX;
- **`dura-project`** for the goal, architecture, status and plan;
- **`dura-hub`** for `backend/hub`, and **`dura-templates`** for the generator;
- **`dura-tdd`, `dura-ui`, `dura-records`, `dura-sync` or `dura-release`**
  for those workflows.

Write skills only there. `python .agents/sync_skills.py` adds a pointer for each
one in `.claude/skills/`, and `--check` also fails on a path a skill names that
no longer exists.

## Rules

- **Architecture:**
  - Pub workspaces and Melos, Riverpod, exact domain types, replaceable
    adapters;
  - no business logic in widgets;
  - `dura_core` stays pure Dart;
  - fiscalisation is optional and later.
- **TDD:** write an acceptance test, see it fail for the intended reason,
  implement, then refactor green. Never claim a test, measurement or check
  that wasn't run.
- **Size:** handwritten source and test files are at most 500 lines. Dart is
  formatted to 80 columns; other lines stay near 100.
- **One thing per file:** one widget, data class or service. Keep a needed
  widget and State pair together. Prefer StatelessWidget and ConsumerWidget.
- **Shared code:** when logic is about 60% shared, extract the cohesive common
  part. Don't force unrelated rules into one abstraction, and avoid speculative
  layers, enums and dependencies.
- **Constants and theme:**
  - constants belong to their owning package or domain;
  - colours come from theme tokens;
  - fonts come from `google_fonts` with bundled assets;
  - launcher icons use the approved branding.
- **Resources:** dispose owned controllers, subscriptions, timers, routers and
  database handles. Check `mounted` after awaits.
- **Headers:** handwritten source code (`.dart`, `.js`, `.py`, `.kt`, `.kts`)
  starts with the copyright, AUTHORS, MIT and SPDX header in
  `client/tool/source_header.dart`, in the language's comment syntax.
  - Use the current year for new work, and keep earlier years and third-party
    notices.
  - Docs, config, templates and resources don't carry it, nor do generated
    files, JSON and lockfiles.
- **Local first:** persist before side effects, and bound caches and storage.
  Diagnostic limits are injected configuration; UI copy derives them from the
  active policy.
- **Records:** every file, tab or schema change includes sample data and its
  migration and restore effects. Regenerate the sample and run both checks.
- **Privacy:** no credentials or private business data in logs, tests, issues
  or screenshots.
- **Attribution:** no AI attribution (Co-Authored-By trailers or similar) in
  commits, PRs or files. Never invent individual contributors.
- **`CLAUDE.md`** is maintained by the owner. Change it only when the owner
  asks, and keep it consistent with this file.
- **Scope:** commit only within the user's authorised scope. Never push,
  publish, deploy or tag without explicit authorisation. CI on `main` doesn't
  authorise publication.
