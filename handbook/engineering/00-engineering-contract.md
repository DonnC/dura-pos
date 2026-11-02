<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Dura POS engineering contract

2 November 2026. Agreed product direction translated into engineering rules.
This is the active entry point for the Flutter foundation. Skills, Pub/Melos
workspace, local preferences, diagnostics and shared UI are implemented. Product
sales/sync/payment features remain planned. For the product goal, users and
UX standard, read `../product/` first; `../README.md` maps every document.

## Decisions

| Area | Decision |
|---|---|
| Workspace | Flutter/Dart Pub workspace in client/, with Melos and one client lockfile |
| UI state / wiring | Riverpod; persisted business facts live in the database |
| Local data | Drift/SQLite; replaces Room in earlier Kotlin-first notes |
| Shared core | Pure Dart calculation, permissions, accounting and workflow rules |
| Fiscal integration | Optional per business; deferred, no SDK/plugin in the foundation |
| UI components | Small shared `dura_ui` package, used by features |
| Development | Behaviour-first TDD, contract tests, widget tests, goldens and integration tests |
| Records | Immutable uploaded event journal plus readable, rebuildable Sheets/Excel views |
| Staff device option | Dedicated business phone/account with app PINs and optional owner-managed device/app locks |
| CI | Verify on pull requests and pushes to main; release only from main after all gates pass (decision 0004) |
| Dependency updates | Monthly grouped routine updates; no automatic merging |
| Release policy | Meaningful changes update the changelog; release-intent main commits carry a new version and reviewed notes |
| Branding | Unified tapered silo/phone; dollar sign inside screen; not a USD-only product |

The owner can still select the pricing currency. The dollar logo is a payment
symbol and must not introduce a currency default into onboarding.

## Documents to follow

- [Architecture and contributor boundaries](01-architecture.md)
- [TDD, visual tests and quality gates](02-testing.md)
- [Files, Sheets, Excel and lifecycle policy](03-records-and-sheets.md)
- [Cashier/device security and diagnostics](04-security-and-diagnostics.md)
- [Versioning, CI and dependency updates](05-delivery.md)
- [Roadmap and completion evidence](06-roadmap.md)
- [Coding and diagnostic limits](07-coding-and-diagnostics.md)
- [Foundation decision](../decisions/0001-foundation.md)
- [Records decision](../decisions/0003-records-journal-and-views.md)
- Project skill sources: `../../.agents/skills/`.

These documents supersede earlier suggestions where explicitly different: native
Kotlin UI, Room as the app database, multi-writer direct Sheets appends, late
recovery work, or automatic destructive year-end clearing (see decision 0003).
`../design/records-file-design.md` remains the detailed file-preview reference;
the lifecycle clarifications here take precedence.

## Change discipline

Work one roadmap slice at a time. Record the acceptance behaviour, failing test,
minimal implementation, green checks, docs/schema changes and changelog entry.
Do not move a gate to Done until its evidence exists. Documentation is a
specification, not proof that a capability is implemented.

Architecture may evolve through a recorded decision with rationale, compatibility
effects, tests and migration steps. Following the roadmap rigorously does not
mean preserving a demonstrated mistake. Do not silently diverge from it.

The owner authorised the initial local foundation commit. That does not authorise
a remote push, deployment, account configuration, GitHub release or Play upload.
Preserve the licence and unrelated changes. Do not claim certification not obtained.

## Source checks

Checked 2 November 2026:

- [Pub workspaces](https://dart.dev/tools/pub/workspaces)
- [Melos setup](https://melos.invertase.dev/getting-started)
- [Melos configuration](https://melos.invertase.dev/configuration/overview)
- [Flutter architecture](https://docs.flutter.dev/app-architecture/guide)
- [Flutter testing](https://docs.flutter.dev/testing/overview)
- [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
