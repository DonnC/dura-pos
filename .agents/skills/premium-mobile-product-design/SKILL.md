---
name: premium-mobile-product-design
description: Design or review Dura POS mobile journeys, Flutter or Android screens, theme tokens, accessibility and visual consistency. Use for mobile UX and visual implementation, complementing engineering rules.
---
<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->
# Mobile product design and UX

Use existing Dura research, user journeys and mockup before repeating discovery.
Primary users are small-shop owners/cashiers on practical Android devices with
interrupted connectivity. Distinguish research evidence from hypotheses. Never
invent user interviews, competitor findings or accessibility compliance.

For a major screen define purpose, entry/exit, hierarchy, main action, required
input and recovery. Cover loading, empty, populated, offline, error, disabled and
interrupted states. Do not redesign screens when only engineering setup is asked.

Prefer familiar mobile navigation, readable currency/unit labels, reachable
actions and progressive disclosure. Do not decorate with generic gradients,
glass panels, gratuitous cards/shadows or animations that delay selling.

Use dura_ui theme tokens via ColorScheme/TextTheme/extensions. Centralise brand,
status, spacing, radius and motion definitions; no arbitrary widget colours.
Compose reusable fields, dropdowns, dialogs and status components. Keep business
calculations and permission enforcement behind established controller contracts.
Use google_fonts through the shared theme, with bundled fonts for first-launch
offline use. Reuse the owner's approved mark when exporting launcher assets;
do not silently substitute stock Flutter icons or redesign the approved identity.

Account for SafeArea, keyboard/insets, 320px phones, large text, semantic labels,
focus order, colour-independent feedback and reduced motion. A compiling screen
is not visual verification. Inspect an actual render and meaningful golden diffs;
test interaction separately. Report unverified device/accessibility conditions.

For audits rank findings by user impact and prefer focused fixes. Preserve product
identity: evergreen, restrained grain-gold, tapered silo/phone mark. The dollar
symbol is not a currency default. Apply flutter-product-engineering for code
quality/performance; use dura-ui for project visual-test and reuse conventions.
