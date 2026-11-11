---
name: dura-responsive-design
description: Design and verify Dura POS responsive HTML prototypes in cdx, including mobile/tablet layouts, role views, report charts, state coverage and design handoff. Use for design-only work; Flutter implementation belongs to dura-ui.
---

# Dura responsive prototype design

Read the current task and `handbook/design/prototype/cdx/status.md` first.
Use `premium-mobile-product-design` for product UX principles. The executable
reference is `handbook/design/prototype/cdx/-cdx-counter.html`; inspect its active
scripts and current routes instead of rebuilding a parallel mockup.

- Keep prototype work in cdx unless the user authorises another scope. Current
  design permission does not authorise app/backend changes or Figma conversion.
- Start from the cashier serving a waiting customer and the owner checking the
  business. Preserve the four destination positions and the approved Shop Sign
  identity. Use existing controls and theme tokens.
- Mobile uses a readable column and reachable main action. Tablet can expose
  useful order context or chart/detail panes; it must not grant extra access.
  Large text returns to one pane when needed. Resize the current form without
  losing typed values or changing its totals.
- Follow `handbook/design/prototype/cdx/-cdx-language-roles.md` for words, compact
  header, mode markers and Owner/Cashier boundaries.
- Charts answer a specific business question. Use known records, labelled
  currencies, honest missing-data states and accessible figures beside charts.
  Fixtures must reconcile; never infer a cashier from a device's identity.
- Add each new route, state, dialog and completion to
  `handbook/design/prototype/cdx/-cdx-coverage-cases.js`. Update source checks
  when an intentional new surface is added, not to conceal a missing example.
- Verify relevant interactions separately from layout. Check 320/390/768/1024
  px, light/dark and enlarged text; inspect actual mobile/tablet renders and
  scrolled content. State what physical-device/accessibility checks remain open.
- Use the focused cdx checks, then the existing regression suite for shared
  changes. Keep source files below 500 lines; add the repository source header.
  Update status.md with finished work, next work and decisions made independently.

Figma is the final handoff after design coverage and walkthrough are complete.
The current catalog is `handbook/design/prototype/cdx/-cdx-coverage.html`.
Do not call a conversion complete without checking actual Figma renders.
