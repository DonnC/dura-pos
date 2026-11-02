<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Changelog

## Unreleased — 0.1.0-dev.1 foundation

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
