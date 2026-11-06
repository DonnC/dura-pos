---
name: dura-release
description: Prepare or verify Dura POS changelogs, release metadata, monthly dependency groups and CI gates. Use for Dura release engineering; publishing still requires user authorisation.
---
# Dura release engineering

## Read first

- `handbook/engineering/05-delivery.md` and
  `handbook/decisions/0004-repository-layout-and-pr-checks.md`.
- `.github/workflows/main.yml`, `release.json` and `client/tool/release.dart`.
  These are the active configuration; don't describe planned automation as
  installed.

## Rules

- **Paths:**
  - release tooling runs from `client/`;
  - `release.json`, `release-notes/`, `CHANGELOG.md`, `AUTHORS` and `LICENSE`
    stay at the root, and the release script finds them through the parent
    directory;
  - CI artifact paths are repository-relative (`client/apps/dura/...`).
- **Changelog:** every meaningful change gets a human-facing entry under
  *Unreleased*.
- **A release-intent commit aligns:**
  - SemVer and the build number;
  - the app manifest;
  - reviewed notes;
  - schema versions;
  - checksums.

  There's one authoritative product version; Melos doesn't bump private
  packages on its own. Document migrations, backups, downgrade limits and
  checks not performed.
- **CI:**
  - verification runs on pull requests and on pushes to `main`;
  - the release job runs only on a push to `main`;
  - failed tests prevent publication;
  - artifacts match the exact commit checked;
  - no suite passes as an empty filter or with `|| true`.
- **Goldens** are updated only with visual review.
- **Dependabot:** monthly groups, bounded PR counts, no auto-merge. Security
  alerts aren't held back to the monthly schedule.
- **Keep the licence and third-party notices.**

## Done when

- All reviewable files and local verification are ready within the
  authorised scope.
- **Don't tag, publish, push or deploy just because this skill was invoked.**
  With explicit authorisation, verify the tag target and ownership, and the
  artifact hashes. Stop rather than overwrite a conflicting published release.
