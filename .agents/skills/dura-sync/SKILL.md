---
name: dura-sync
description: Implement or assess Dura POS offline sync, journal acknowledgements, shared-view writers and recovery under retries or partial failure. Use for Dura sync/reconciliation changes, not ordinary screen styling.
---
# Dura sync and recovery

## Read first

- `handbook/decisions/0003-records-journal-and-views.md`.
- `handbook/engineering/01-architecture.md` (data and background work),
  `03-records-and-sheets.md` and `04-security-and-diagnostics.md`.
- `backend/hub/PROTOCOL.md` and the `dura-hub` skill: `journal.put` is the only
  way a phone uploads.
- There's one mode: every phone uploads through the Shop Hub, and the hub is the
  only view writer (decision 0005). Phones never hold a Google token, so never
  design a phone that writes to Drive or Sheets directly.

## What the hub already guarantees

- **A phone numbers its batches from 1.** `journal.put` answers `accepted` with
  the highest number stored, or `gap` with the number it needs.
- **Re-sending a stored batch is safe** and stores nothing twice. Sending that
  number with different content is refused as `integrity_conflict` /
  `batch_reused`.
- **Views catch up on their own:** rows reach Sheets exactly once, by a queue a
  timer drains. Failures stay queued and never fail an upload.
- **`status`** reports each phone's `through`, `viewed` and `lastSeen`, for the
  plain-state rule below.
- **`changes.pull`** moves master data down by version hash.

The phone's side is in `dura_core` (`OutboxUploader`, `sealedEvents`,
`saleEvent`), `dura_data` (`SqliteOutbox`) and `dura_hub`. Nothing runs the uploader
yet: scheduling and download checkpoints come with the selling screens.

## Rules

- **Persist together:** the operation identity, the complete event and its
  outbox entry go in one local transaction.
- **Batches are sealed,** with stable IDs and content.
  - A timed-out request isn't proof of failure.
  - Verify a durable upload before acknowledging it.
- **Keep these outcomes separate:**
  - journal uploaded;
  - view updated;
  - payment verified;
  - fiscal accepted.
- **Ordering:**
  - per-origin sequences and installation identities;
  - durable download checkpoints;
  - explicit gap handling;
  - never order facts by device clock alone.
- **Retries** reuse the existing contracts. Never blanket-retry a financial
  side effect.
- **Old and new views reconcile** without changing historical prices or
  rates.
- **Tell people the state plainly:** pending count, oldest pending work, and
  per-device completeness. Offline shared stock and credit can't promise a
  real-time global limit.
- **Never:** a second view writer, or destructive cleanup of history.

## Start with failure-injection tests

Write the test for the boundary you're changing first. Typical cases:

- an accepted upload whose response was lost;
- duplicate delivery;
- a partial projection;
- a restart or restore;
- a stale permission or master-data edit;
- a concurrent stock count;
- a late shift event.

## Done when

- The guarantees that have been demonstrated are reported apart from those
  that are still hypotheses.
