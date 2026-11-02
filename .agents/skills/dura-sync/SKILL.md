---
name: dura-sync
description: Implement or assess Dura POS offline sync, journal acknowledgements, shared-view writers and recovery under retries or partial failure. Use for Dura sync/reconciliation changes, not ordinary screen styling.
---
<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->
# Dura sync and recovery

## Read first

- `handbook/decisions/0003-records-journal-and-views.md`.
- `handbook/engineering/01-architecture.md` (data and background work),
  `03-records-and-sheets.md` and `04-security-and-diagnostics.md`.
- Confirm the mode first: is it single-owner or hub mode, and which device is
  the active view writer?

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
- **Never:** silent dual-writer failover, or destructive cleanup of history.

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
