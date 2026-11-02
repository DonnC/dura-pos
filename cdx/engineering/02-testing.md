# TDD, visual tests and quality gates

## Red → green → refactor

For every meaningful behaviour change:

1. State an observable acceptance example and expected result.
2. Add a focused test and run it. Record that it fails for the intended missing
   behaviour, not a broken import, missing SDK or unavailable external service.
3. Implement the smallest correct change. Run the focused tests until green.
4. Refactor while green; run the appropriate affected contract/regression suite.
5. Update schema examples, previews, documentation and changelog as applicable.

For a defect, reproduce it in a regression test before fixing it. Tests assert
outcomes and invariants, not private method order. Do not generate implementation
first and call the later tests TDD. Record the red/green evidence in the PR.

## Test layers

| Layer | Required examples |
|---|---|
| Core unit/invariant | Decimal rounding, split tender, change, refunds, rate snapshots, supported balanced accounting entries |
| Repository contracts | Rollback, duplicates, transaction boundaries, stream results, isolation by business/mode |
| Drift migration | Real old-schema fixtures upgraded without lost IDs, money or pending work |
| Workflow/recovery | Kill/restart at payment, fiscal and persistence boundaries; resume without repeat side effects |
| Sync | Lost acknowledgement, duplicate batch, out-of-order delivery, gaps, stale edits, quota/auth failures, late upload |
| Provider/hub contracts | Forged callback rejected, uncertain payment preserved, credentials redacted, repeated initiation reconciled |
| Widget | Input, validation, quantity correction, PIN locking, route/role visibility, keyboard navigation |
| Golden | Actual reusable widgets and important screen states, deterministic sample data |
| Integration | Product → sale → restart → cash-up → export, with real local storage |
| Android instrumented | Keystore, fzimra simulator, process restart, native bridge and device-specific behaviour |
| Workbook | Accounting totals, journal equivalence, formulas, charts, export opening and recalculation |

Fake payment and fiscal services are default in tests. Sandbox/live checks are
explicitly separated. CI never requires merchant or production fiscal credentials.
Fakes must run against the same contracts as real adapters.

## Visual app testing

Use Flutter test's matchesGoldenFile with a local harness. Pin Flutter, runner
image, fonts/assets, locale, time zone, device-pixel ratio, clock and sample data.
Use one canonical Linux environment for baselines. Contributors on other OSes
generate/review in that environment rather than introducing platform noise.

Start at phone widths 320 and 390 logical pixels; add a desktop layout when
desktop starts. Cover light/dark mode, long names, empty/error/loading/pending
states, large text at 200%, keyboard/insets and accessible contrast. The test
matrix should use selected high-value combinations, not every permutation.

Screens: onboarding currency choice, product picker/basket, cash change, pending
payment, saved receipt, offline status, cash count difference, handover acceptance,
record/export preview. Components: money field, dropdown, dialog, PIN input,
primary/disabled button, record/status rows.

Goldens compare appearance; semantic and interaction assertions separately prove
usability. A correctly coloured button that charges twice still fails acceptance.
Tests should verify labelled tap targets, screen-reader semantics and no overflow.

Baseline update procedure: explain intended visual change, attach before/after/diff
images, inspect actual renders, and run the behaviour tests. Do not auto-accept
goldens in CI or use a wide pixel tolerance to hide errors.

## Test fixtures and diagnostics

Use fictitious but consistent Zimbabwe shop examples; do not hardcode a universal
USD pricing default. Freeze rates explicitly and label them as fictional. Keep
snapshot data small enough for reviewers to inspect. Store supported old event,
database and workbook fixtures with their versions.

Fakes for clock, ID generator, randomness and transport allow failure injection.
Use testable result/error types: validation, permission, authentication-required,
retryable-unavailable, unknown-external-outcome and integrity-conflict.

## Gates and coverage

All core money/permission/posting invariants and critical recovery paths must be
tested. Start with a ratcheted core coverage floor of 90% non-generated lines;
publish the report and separately enumerate critical-path tests. Coverage alone
does not prove correctness and must not replace behavioural evidence. Exclude
generated files openly. Other packages report coverage and establish baselines
in the scaffold phase; do not invent current percentages.

Local checks run before merge because the requested CI runs only on main.
On main run format, analysis, generated-file drift, dependency-boundary checks,
unit/contract/widget/golden tests, schema/sample checks, and Android recovery
integration tests before release. Failure produces diagnostics and no release.
This catches a failed merge after it reaches main; it is not a pre-merge CI gate.

No current Flutter test suite is claimed by this document. The existing HTML
mockup checks are prototype checks, not app integration or Flutter golden tests.
