# Figma conversion assessment

11 November 2026 · Assessment only; no conversion or upload performed.

An editable Figma reconstruction is feasible. A lossless, one-click transfer of
the entire HTML application is not something this session can guarantee.
There is currently no connected Figma editing tool available in this session.
A local importer package could be prepared here, then run in a Figma Design
file to create the editable document. Its appearance must be checked there.

## What a complete design handoff should preserve

- All 100 current base routes, grouped by the shop owner's and cashier's tasks.
- Conditional states: loading, empty, offline, invalid, disabled, interrupted,
  pending, failed, confirmed and owner-access boundaries where designed;
  control focus, selection and pressed/disabled variants.
- Dialogs and overlays: baskets, product scan examples, approvals, help and
  recovery details, including focus/return behaviour in the handoff notes.
- Mobile, tablet portrait and landscape layouts; light, dark and large text.
- The original Shop Sign vectors, product artwork, copy, currency labels,
  type, colours, spacing, controls and status treatments.
- Components, variants and layout constraints, with navigation and prototype
  links between the relevant example states.

The newer [screen/state/dialog catalog](-cdx-coverage.html) accounts for the
current prototype and expands the original 90-screen audit. **The owner has
deferred Figma until design coverage and final review are complete.** Before
calling a future conversion complete, map every approved example/device
combination to its Figma frame or component. Compare actual Figma renders with
the browser reference, including scrolled content below the initial viewport.
Missing frames, unavailable fonts and visual differences must remain explicit.

## The intended delivery

Generate an importer package containing the complete scene data, original
assets, theme/component definitions, prototype connections and coverage report.
Use it to construct native text, vectors, frames and reusable components inside
Figma, then [save the local `.fig` copy from Figma](https://help.figma.com/hc/en-us/articles/8403626871063-Save-a-local-copy-of-files).
Figma documents its native file formats as proprietary; this approach uses
its supported editor APIs. Exact font availability
must be checked in the editor. A collection of screenshots can preserve a
reference appearance, but does not provide that editable design structure.

Figma's [Plugin API](https://developers.figma.com/docs/plugins/) supports
creating and modifying design nodes, with editor-font restrictions. Its
[reaction API](https://developers.figma.com/docs/plugins/api/properties/nodes-reactions/)
supports prototype interactions. This makes a native reconstruction practical;
it does not demonstrate that the current prototype has been converted.

## What requires a different representation

Browser JavaScript, local storage, arbitrary typed inputs, money calculations,
file/camera simulations and the full range of data-driven results do not move
unchanged into a Figma Design prototype. Represent the designed examples with
variants, variables and linked states, and keep the HTML prototype alongside
the Figma file as the executable workflow reference.

This remains an assessment; the owner has explicitly deferred conversion.
No Figma account access, paid converter, plugin installation, publication or
external upload is assumed. A native `.fig` file has not been produced or
verified. The current browser prototype remains the reviewed design reference.
