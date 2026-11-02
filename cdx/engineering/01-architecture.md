# Architecture and contributor boundaries

## Workspace

Use native Pub workspaces for dependency resolution, one committed root
`pubspec.lock`, and Melos installed as a root development dependency. Use
`dart run melos ...` so contributor and CI task versions come from that lockfile.
Current Melos configuration belongs under `melos:` in the root pubspec; do not
copy an older melos.yaml-only layout without checking the selected version.

Pin one validated Flutter release for local work, CI and golden generation.
Exact SDK and package versions are selected at scaffold time after proving the
Android/fzimra toolchain, not guessed in planning files.

```text
dura-pos/
  pubspec.yaml                 workspace + Melos task definitions
  pubspec.lock                 one dependency resolution
  .flutter-version             exact tested SDK release
  apps/dura/                   Flutter composition root and feature screens
  packages/dura_core/          pure Dart domain + application contracts
  packages/dura_data/          Drift, sync, repository and network adapters
  packages/dura_ui/            tokens, accessible reusable components
  packages/dura_fiscal/        Flutter API, Pigeon bindings, Android adapter
  hub/                         future business-owned Apps Script
  schema/                      business-file and event specifications
  samples/                     realistic deterministic example business
  docs/                        activated engineering policies and decisions
  .agents/skills/              activated project skill sources
  .github/                     activated workflow and contribution templates
```

No second Flutter app until its distinct use case justifies one. The same app
can adapt to phone and desktop widths. Initially generate Android only. Web
owner viewing and desktop selling have different capability/recovery gates.

## Dependencies and direction

```text
apps/dura → dura_ui
apps/dura → dura_core
apps/dura → dura_data → dura_core
apps/dura → dura_fiscal → dura_core
```

`dura_core` must not import Flutter, Riverpod, Drift, Google APIs or a native
plugin. UI components must not import concrete repositories. Cross-feature
operations use core contracts, not another screen's controller.

Place a use-case class around meaningful orchestration, such as CompleteSale,
SubmitCashUp or MatchProviderSettlement. Do not create a one-method abstraction
for every trivial getter. Data adapters implement the core ports. Keep the
business transaction boundary inside the operation/repository, not a widget.

The three settlement concepts remain separate: provider reconciliation, shift
cash-up/handover, and fiscal-day closure.

## Contributor replacement pattern

| Change | Replace/modify | Prove |
|---|---|---|
| New product-picker layout | Feature view using existing controller contract | Widget/semantic tests and reviewed golden |
| Another local store implementation | Repository adapter | Same reusable repository contract suite |
| Another payment gateway | Hub provider adapter | Initiation/unknown outcome/refund/status contract tests |
| Another receipt printer | Printer adapter | Formatting and printer-capability tests |
| Different fiscal platform | Fiscal adapter | Fiscal contract + platform recovery tests |
| New pricing rule | Core rule | Failing business examples first; update historical-rule policy |

An adapter must preserve semantics, not merely match method names. Timeouts,
idempotency, supported currencies, cancellation, and recoverability are part of
the contract. Unsupported functionality is explicit, never a fake success.

## Riverpod and durable state

Use widget state for search/expanded controls; Riverpod Notifier/AsyncNotifier
for feature coordination; database streams for persisted records. A draft basket
and checkout intent become durable before any external side effect. Provider
disposal or a business switch cannot delete them.

Scope dependencies by business ID, live/practice mode and database instance.
On account/role changes, invalidate affected caches and close the old UI session;
preserve queued business work. Background workers bootstrap the same coordinators
without requiring a widget tree or an active UI provider.

Reading a provider must not charge a customer or issue a receipt. Explicit
commands persist their operation identity first. Disable duplicate taps for UX;
use durable constraints and reconciliation for correctness.

## Data and background work

Drift replaces Room for app data. fzimra retains its separate native storage.
Business events and outbox records commit together. Foreground/background sync
share a coordinator with database-backed work ownership. An expired worker may
not acknowledge another worker's work; use ownership checks/fencing in the
implementation. Apps Script locks only coordinate cooperating script writers.

Single-owner mode uses direct owner Google access. Hub mode mediates paired
staff devices and is the sole shared-view writer. Switching modes requires a
documented writer handover; no automatic dual-writer failover in the first release.

## Money and versioned rules

Use Money, Currency, Quantity and ExchangeRate types with exact decimal storage,
explicit scale and rounding. JSON and native bridge amounts use decimal strings.
Never route money through double. Preserve original prices, costs, tax/rate
versions and required fiscal payloads. Version event schemas, projection rules,
local migrations and hub protocol independently of the app release.

Do not recalculate historical receipts using changed rules. Revised reporting
logic requires a defined projection version and reconciliation against recorded
facts. Financial statements are limited to complete captured data.

## UI kit

Use Flutter Material primitives through focused reusable components:
DuraTextField, MoneyField, QuantityField, CurrencyPicker, DuraDropdown,
ConfirmationDialog, OwnerApprovalDialog, DuraPrimaryButton, EmptyState,
ErrorState, SyncStatus and RecordPreview. Centralise spacing, type, colour,
currency formatting, semantics, focus order and validation presentation.

Do not build one giant configuration-driven field that hides native behaviour.
Expose composition slots and controller/callback contracts. Never make the UI
kit calculate tax, enforce credit limits or directly approve a refund.

## Initial packages and validation

Use Riverpod, go_router, Drift, http, exact-decimal support and typed Pigeon
bindings; use platform abstractions for secure storage, Google authorisation and
background scheduling. Select printer/scanner/export packages by device and
format tests, licence and maintenance. Google desktop auth and web storage need
separate verification. Do not add abandoned golden_toolkit; use Flutter's own
golden APIs and a small local harness.
