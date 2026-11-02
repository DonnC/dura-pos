---
name: dura-release
description: Prepare or verify Dura POS changelogs, release metadata, monthly dependency groups and main-only CI gates. Use for Dura release engineering; publishing still requires user authorisation.
---
<!-- Maintained by the Dura POS contributors. -->

# Dura release engineering

Read handbook/engineering/05-delivery.md and the activation checklist. Before
activation, read cdx/engineering and cdx/scaffold/ACTIVATION.md. Do not report
templates as installed automation.

Meaningful changes require human-facing Unreleased entries. A release-intent
commit aligns SemVer/build, app manifest, reviewed notes, schema versions and
checksums. One product version is authoritative; Melos does not independently
bump private packages. Document migrations, backups, downgrade limits and checks
not performed. Preserve existing licence and third-party notices.

Verify CI has only push-to-main triggers, failed tests prevent publication and
artifacts match the exact checked commit. Native/visual/schema/recovery targets
must exist and execute, not pass as empty filters. Update goldens only with
visual review. Monthly dependency groups have bounded PR counts and no auto-merge;
security alerts are not suppressed to the monthly routine schedule.

Prepare all reviewable files and local verification within the authorised scope.
Do not tag, publish, push or deploy merely because this skill was invoked. On
explicit publication authorisation, verify target/tag ownership and artifact
hashes; stop on a conflicting published release rather than overwrite it.
