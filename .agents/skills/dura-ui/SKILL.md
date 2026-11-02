---
name: dura-ui
description: Create or modify Dura POS Flutter screens and reusable components while preserving controller contracts, accessibility and reviewed visual baselines. Use for Dura UI implementation and visual regressions.
---
<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->
# Dura UI contributions

Read current architecture/testing policies in handbook/engineering or, before
activation, cdx/engineering. Use the real shared dura_ui components and theme;
the Flutter app and packages live under client/. Run tests from that workspace.
do not scatter new text-field, dropdown or confirmation-dialog implementations.
Extend focused components through composition rather than a giant field API.

Put each widget/component in its own file; keep necessary widget/State pairs
together. Prefer stateless/consumer widgets where no local lifecycle is needed.
Use google_fonts in the central theme with bundled assets and runtime fetching
disabled for offline operation. Use approved silo/phone branding for launcher
assets, not generated Flutter placeholders or a new unapproved logo direction.
Dispose owned resources; test asynchronous completion after unmount where relevant.

Screens consume feature state and explicit commands. Keep money, permission,
payment initiation and fiscal issuance out of build methods. Do not place a
network operation in a provider read just to drive a loading spinner.

Write interaction/semantic tests and use the existing golden harness. Cover the
affected narrow-width, large-text, dark/light and error/offline state. Readable
data previews and currency labels are mandatory where records are shown. No
demo sign-in/payment success may masquerade as a real integration.

Update baselines only after inspecting before/after/diff and explaining intended
changes. Do not accept every golden automatically. Keep only deliberate
reference PNGs in version control: comparison tests need
these baselines. Failure/actual/diff screenshots remain ignored CI artifacts.
Do not confuse golden baselines with product branding or store assets. Keep
fakes deterministic and
avoid live services, real customer data and credentials in screenshots. Report
exact visual/behaviour checks and any untested physical-device behaviour.
