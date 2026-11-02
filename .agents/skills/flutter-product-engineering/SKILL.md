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

Read AGENTS.md and the current handbook before changes. Inspect existing code,
contracts and dependencies; make the smallest coherent change. Preserve Riverpod,
Pub workspaces/Melos and the pure Dart core. Adapt feature boundaries to actual
complexity; do not manufacture entities/use cases for every getter.
The Flutter workspace is client/: apps, packages, Dart tooling, tests, SDK pin,
pubspec and lockfile belong there. Run Flutter/Melos from client. Root-level
samples, research, handbook, Apps Script plans and GitHub files stay universal.

For meaningful behaviour use dura-tdd: acceptance example, intended failing test,
minimal implementation, green checks and refactor. Separate transient widget
state from persisted transactions. Model async/empty/error/offline states and
cancel/dispose work appropriately. Never initiate payment from a build/provider read.

Handwritten source and tests must stay within 500 lines. Dart formatting uses 80
columns; avoid unnecessarily long prose/config lines. Split by cohesive purpose.
About 60% similar logic is a review/extraction trigger, not permission to couple
unrelated rules. Keep constants in their owning package's named constants/tokens,
not anonymous literals or one global dumping ground. Use theme-derived colours.
Introduce enums/classes only when they clarify an actual invariant or API.

Do not edit the owner's CLAUDE.md. Use one responsibility and one widget, data
class or service per handwritten source file. Necessary widget/State pairs may
share a file; explain any other unavoidable exception. Barrel exports may group
exports, not implementations. Prefer StatelessWidget/ConsumerWidget unless
mutable state or a real resource lifecycle requires a stateful widget.

Prevent leaks: close owned database handles, dispose routers/controllers/focus
nodes, cancel timers/subscriptions and wire provider cleanup with ref.onDispose.
Do not dispose caller-owned resources. Check mounted after awaits, release failed
startup resources and avoid unbounded caches or repeated listener registration.
Exercise meaningful navigation/unmount/disposal cases; do not claim zero leaks
without runtime profiling evidence.

Use the DonnC & contributors copyright/MIT header in client/tool/source_header.dart
for original handwritten files, adapting comment syntax. Include AUTHORS and
root LICENSE references and SPDX-License-Identifier: MIT. Use the current year
for new work; retain older copyright years and third-party licence notices.
Generated code, binary assets, JSON and lockfiles are exempt. Never replace the
owner's CLAUDE.md. Use Dartdoc for public contracts and short comments
for why/invariants; do not narrate obvious code or fabricate contributor names.

Keep persistence local-first; never use memory/provider caches as durable evidence.
Use lazy lists, focused state selection, bounded image/data caches and const
widgets where useful. Move heavy archive/replay work off the UI isolate. Profile
before claiming performance gains; report measurements or state unmeasured.

Networking requires timeouts, cancellation, typed errors, safe authentication and
idempotency-specific retries. Diagnostics use rotation_log behind the shared
redacting adapter and an injected policy (defaults: 10 files, 5 MiB each).
Count the active file inside the cap; package archive retention excludes it.
Configure file and archive retention via startup arguments; derive UI limits
from that policy. No tokens, PINs, private keys, transaction payloads or personal
data. An owner-triggered issue report automatically prepares
and attaches the diagnostic ZIP through reportIssue and an injected transport.
Archive failures require visible recovery, never silent incomplete submission.
No unsolicited upload; report delivery must not be claimed from preparation alone.

Run format, analysis and meaningful tests; inspect the final diff. Update handbook,
schemas/previews and changelog when behaviour/contracts change. Report executed
checks and limitations honestly. Fiscalisation is not in the initial scaffold.
