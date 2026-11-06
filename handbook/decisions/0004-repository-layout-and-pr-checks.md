# Decision 0004: one map for the docs, a research archive, and PR checks

Status: Accepted
Date: 2 November 2026
Roadmap slice: 1 (workspace and quality)

## Problem and evidence

Before going public, the repository had three overlapping layers and no single
entry point:

- **`notes/`** (Kotlin era) and **`CLAUDE.md`** said to start at
  `notes/10-build-plan.md`.
- **`handbook/`** (Flutter era) and **`AGENTS.md`** said to start at the
  engineering contract.
- **`cdx/`** held a third copy:
  - staged versions of the handbook, skills and GitHub files;
  - the records design and the mobile concept.
- **The repository root** held raw research:
  - a 1 MB Gemini HTML export that embedded a personal email address;
  - its partial markdown copy;
  - the first brainstorm.

The records model, workbook creation, year-end clearing and the platform
differed between layers (see [0003](0003-records-journal-and-views.md)).

CI ran only on push to `main`, so pull requests from contributors had no
automated checks.

## Decision

**Layout:**

| Location | Holds | Authority |
|---|---|---|
| `README.md` | What Dura is, status, how to start | Front door |
| `handbook/product/` | Vision, capabilities, experience principles, glossary | Current |
| `handbook/engineering/` | Engineering rules: architecture, tests, records, security, delivery, roadmap | Current |
| `handbook/decisions/` | Numbered decisions, including where they replace a note | Current; each says what it supersedes |
| `handbook/design/` | Records file design, mobile concept and prototype, branding | Current design references |
| `notes/` | Numbered design notes from the research phase | Reasoning; current where no later decision differs |
| `research/` | Raw AI conversations and briefs | Historical only |
| `samples/`, `schema/`, `hub/`, `reference/` | Executable spec, workbook contract, hub plan, ZIMRA reference data | As documented in each |
| `client/` | All Flutter code, packages, tooling and tests | Code |

**When documents disagree, read them in this order:**

1. the code and its tests, for what exists;
2. `handbook/decisions/`, newest first;
3. the rest of `handbook/`;
4. `notes/12`, then `notes/10`, then the other notes;
5. `research/`.

`handbook/README.md` keeps the full map.

**Research:**

- **`cdx/` is dissolved:**
  - the records design, mobile concept, prototype and branding moved to
    `handbook/design/`;
  - the staged copies of the skills, handbook and GitHub files were deleted,
    because their active versions exist;
  - the Codex product brief moved to `research/`.
- **The Gemini HTML export is removed from the tree.** Its two conversations
  are kept as markdown in `research/gemini/`, without personal details.
  - It stays in Git history (commit `e72640b`).
  - Purging it from history needs a deliberate rewrite and force-push, which
    is the owner's decision.

**Pull-request checks:**

- The verify job also runs on pull requests, with read-only permissions.
- The release job runs only on a push to `main`.
- Concurrent runs are grouped by branch, and superseded pull-request runs are
  cancelled.
- Publishing still needs explicit release intent in `release.json`.

**`docs/` stays reserved** for the owner's future use, such as a website or
user guide.

## Compatibility and migration

- Links in the notes, handbook, skills, `AGENTS.md`, `CLAUDE.md` and the
  branding provenance were updated to the new paths.
- `check_blueprint.py` validated only the old `cdx` staging copies, and was
  removed with them.
- The two Gemini files were renamed by `git mv`, so their history follows.

## Acceptance and reversal

- `dart run melos run verify` passes after the move.
- No link in the handbook, README or skills points into `cdx/`.
- The first pull request after this change shows the verify job running and
  the release job skipped.

To reverse the PR checks, remove the `pull_request` trigger. The layout can be
revised by a later decision.
