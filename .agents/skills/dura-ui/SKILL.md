---
name: dura-ui
description: Create or modify Dura POS Flutter screens and reusable components while preserving controller contracts, accessibility and reviewed visual baselines. Use for Dura UI implementation and visual regressions.
---
<!-- Maintained by the Dura POS contributors. -->

# Dura UI contributions

Read current architecture/testing policies in handbook/engineering or, before
activation, cdx/engineering. Use the real shared dura_ui components and theme;
do not scatter new text-field, dropdown or confirmation-dialog implementations.
Extend focused components through composition rather than a giant field API.

Screens consume feature state and explicit commands. Keep money, permission,
payment initiation and fiscal issuance out of build methods. Do not place a
network operation in a provider read just to drive a loading spinner.

Write interaction/semantic tests and use the existing golden harness. Cover the
affected narrow-width, large-text, dark/light and error/offline state. Readable
data previews and currency labels are mandatory where records are shown. No
demo sign-in/payment success may masquerade as a real integration.

Update baselines only after inspecting before/after/diff and explaining intended
changes. Do not accept every golden automatically. Keep fakes deterministic and
avoid live services, real customer data and credentials in screenshots. Report
exact visual/behaviour checks and any untested physical-device behaviour.
