---
name: flutter-product-engineering
description: Engineer, review, debug and test Dura POS Flutter code with local-first persistence, bounded diagnostics, modular contracts and measured performance. Use for architecture, implementation and refactoring.
---
<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->
# Flutter product engineering

## Read first

- `AGENTS.md`, which holds the repository-wide rules: file size, one class
  per file, headers, constants, disposal, no AI attribution. They aren't
  repeated here.
- `handbook/engineering/01-architecture.md` and `07-coding-and-diagnostics.md`.
- The existing code, contracts and dependencies you'll touch. Make the
  smallest coherent change.

## Rules

- **Workspace:** `client/` holds every app, package, tool and test. Run
  Flutter and Melos from there. Keep Riverpod, Pub workspaces and Melos, and a
  pure-Dart `dura_core` (no Flutter, Drift or plugin imports).
- **Behaviour changes:** follow `dura-tdd`.
- **State:**
  - widget state for transient UI;
  - Riverpod for coordination;
  - database streams for persisted records.

  A draft sale or a checkout intent is persisted before any side effect.
  Never start a payment or fiscal call from `build` or a provider read.
- **Feature boundaries match real complexity.** Don't create a use case or
  entity for every getter.
- **Resources:**
  - use `ref.onDispose` for provider-owned resources;
  - release failed startup resources;
  - don't dispose caller-owned resources;
  - bound caches and listeners;
  - test unmount and teardown where it matters.

  Don't claim zero leaks without profiling.
- **Performance:**
  - lazy lists, focused selection, `const` widgets;
  - heavy work (archives, replay) off the UI isolate.

  Measure before claiming a gain.
- **Networking:**
  - timeouts, cancellation and typed errors;
  - authentication sent only to its intended host;
  - retries only under an idempotency contract.

  Never blanket-retry a payment or fiscal call.
- **Diagnostics:** use `rotation_log` behind the redacting adapter, with an
  injected `DiagnosticPolicy`. UI text is derived from the policy. Never log
  tokens, PINs, keys, transaction payloads or personal data.

## Done when

- `dart run melos run verify` passes, and you've read the final diff.
- The handbook, schema previews and changelog are updated if behaviour or
  contracts changed.
- You've reported exactly which checks ran, and what remains unverified.
