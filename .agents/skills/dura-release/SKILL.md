---
name: dura-release
description: Prepare or verify Dura POS changelogs, release metadata, monthly dependency groups and main-only CI gates. Use for Dura release engineering; publishing still requires user authorisation.
---
<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->
# Dura release engineering

Read handbook/engineering/05-delivery.md and the activation checklist. Before
activation, read cdx/engineering and cdx/scaffold/ACTIVATION.md. Do not report
templates as installed automation.
Run Dart/Flutter release tooling from client/. Repository-wide release.json,
release-notes, CHANGELOG, AUTHORS and LICENSE remain at the root; the release
script resolves those paths through the parent directory. CI run steps use
client/ and artifact paths are repository-relative client/apps/dura paths.

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
