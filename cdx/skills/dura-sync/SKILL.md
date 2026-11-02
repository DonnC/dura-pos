---
name: dura-sync
description: Implement or assess Dura POS offline sync, journal acknowledgements, shared-view writers and recovery under retries or partial failure. Use for Dura sync/reconciliation changes, not ordinary screen styling.
---

# Dura sync and recovery

Read the current engineering contract, architecture, records and security
policies under docs/engineering, or cdx/engineering before activation. Confirm
single-owner versus hub mode and the active shared-view writer before editing.

Persist operation identity, complete event and outbox within defined local
transaction boundaries. Batches are sealed with stable IDs/content. A timed-out
request is not proof of failure. Verify durable upload before acknowledging;
keep view completion, payment verification and fiscal acceptance separate.

Use per-origin sequencing/installation identities, durable download checkpoints
and explicit gap handling. Do not order facts solely by device clock. Reuse
current contracts for safe retries; never blanket-retry financial side effects.

Start with failure-injection tests for the changed boundary: accepted upload with
lost response, duplicate delivery, partial projection, restart/restore, stale
permission or master-data edit, concurrent stock/count, or late shift event.
Reconcile old and new views without changing historical prices or rates.

Expose pending count, oldest pending work and per-device completeness in plain
language. Offline shared stock and credit cannot promise a real-time global
limit. No silent dual-writer failover or destructive history cleanup. Report
which guarantees are demonstrated and which remain hypotheses.
