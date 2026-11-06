---
name: dura-ui
description: Create or modify Dura POS Flutter screens and reusable components while preserving controller contracts, accessibility and reviewed visual baselines. Use for Dura UI implementation and visual regressions.
---
# Dura UI contributions

## Read first

- `handbook/product/03-experience-principles.md`, including its UI
  pull-request checklist.
- `handbook/engineering/01-architecture.md` (UI kit) and `02-testing.md`
  (visual tests).
- The existing `dura_ui` components and theme in `client/packages/dura_ui`.

## Rules

- **Reuse before creating.** Don't scatter new text fields, dropdowns or
  dialogs. Extend focused components by composition, not by building one
  giant configurable field.
- **Screens consume feature state and explicit commands.**
  - Money, permissions, payment initiation and fiscal issuance stay out of
    `build`.
  - No network call inside a provider read just to drive a spinner.
- **Fonts and icons:** `google_fonts` through the central theme, with bundled
  fonts and runtime fetching disabled. Launcher assets use the approved
  branding only.
- **Tests:** write interaction and semantic tests, and use the existing
  golden harness. Cover the affected narrow width, large text, dark and light
  mode, and the error and offline states.
- **Records shown on screen** need readable data previews and currency labels.
- **No fake success:** no demo sign-in or payment that masquerades as a real
  integration.
- **Goldens:**
  - update baselines only after inspecting the before, after and diff, and
    explain the change;
  - keep only deliberate baseline PNGs in Git;
  - failure, actual and diff images stay ignored CI artifacts;
  - goldens aren't branding or store assets.
- **Screenshots and fixtures:** deterministic fakes; no live services, real
  customer data or credentials.

## Done when

- The visual and behaviour checks that ran are reported, plus any physical
  device behaviour that wasn't tested.
