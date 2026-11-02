<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Roadmap and completion evidence

The foundation slice of phase 1 is implemented; see the validation log for exact
checks. Full phase 1 awaits clean-checkout/GitHub execution evidence. Other phases
remain planned. Fiscalisation is optional and deferred, not a dependency of the
initial setup. HTML concepts/sample workbooks are design inputs.

| Phase | Scope | Required evidence before completion |
|---|---|---|
| 0: Contract and toolchain | Confirm package boundaries, exact SDKs, schemas, fiscal bridge, Drive retry and hub-install spikes | Recorded decisions; runnable failure/retry demonstrations; unresolved constraints listed |
| 1: Workspace and quality | Pub workspace/Melos, Riverpod composition, Drift, reusable UI, test harness, CI/release activation | Clean bootstrap on fresh checkout; failing/green example; sample golden; pull-request and main workflows verified on GitHub |
| 2: One-phone practice sale | Product, currency choice, durable draft, cash checkout, accounting, restart | Exact totals and postings; no duplicate completion; process-restart test; readable local record preview |
| 3: Owner records and exit | Direct Drive journal, views, owner input validation, backup/restore, Excel/CSV/archive | Lost-response deduplication; damaged-view rebuild; independent reconstruction; Sheets/Excel checks |
| 4: Cashier and shifts | Profiles/PINs, dedicated device guidance, roles, float, cash-up, handover | Offline auth limitations visible; requested/approved actions tracked; variance and late-event tests |
| 5: Fiscalisation | Typed fzimra adapter, test registration, receipt payloads, fiscal-day handling | Simulator and ZIMRA test flow; native restart/Keystore tests; documented live approval prerequisites |
| 6: Hub, staff sync and payments | Business-owned hub, pairing, writer handover, Paynow then Smile&Pay, wallet/provider settlement | Callback/poll verification; interrupted checkout recovery; same-ref rechecks; two-till gap/conflict tests |
| 7: Inventory/reporting/pilot | Purchases, costs, adjustments, debtor/creditor features, owner reports, migrations | Consistent fixture; cost/unknown-data honesty; supervised pilot cash-up/recovery/export evidence |
| 8: Wider platforms | Desktop owner view then selling; web owner view; iOS only if justified | Capability-specific storage/auth/hardware/fiscal and large-layout tests, not just successful compilation |

At every slice: acceptance example → red test → minimal change → green →
refactor → docs/schema/previews/changelog → review. Commit/push only when
authorised. Record completion evidence and outstanding limitations in this table
or its linked phase log. No fixed calendar promises before observing a pilot.

## First backlog

- Defer fiscal bridge/toolchain work until the optional fiscal phase.
- Define Money/Quantity/Rate and one cash sale fixture with exact rounding.
- Define transaction identity, sealed batch, acknowledgement and checkpoint.
- Demonstrate same-ID journal retry and a partially written view recovery.
- Prove owner-controlled phone and hub-mediated staff modes without dual writers.
- Establish a plain Excel-compatible workbook summary before adding pivots.
- Establish restore boundaries between business data and fiscal device state.
- Maintain the pinned SDK/root lockfile; activate new targets only with tests.
