---
name: flutter-product-engineering
description: Engineer, review, debug and test Dura POS Flutter code with local-first persistence, bounded diagnostics, modular contracts and measured performance. Use for architecture, implementation and refactoring.
---
<!-- Maintained by the Dura POS contributors. -->
# Flutter product engineering

Read AGENTS.md and the current handbook before changes. Inspect existing code,
contracts and dependencies; make the smallest coherent change. Preserve Riverpod,
Pub workspaces/Melos and the pure Dart core. Adapt feature boundaries to actual
complexity; do not manufacture entities/use cases for every getter.

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

Start comment-capable handwritten files with `Maintained by the Dura POS
contributors.` using the language's comment form. Generated code, binary assets,
JSON and lockfiles are exempt. Use Dartdoc for public contracts and short comments
for why/invariants; do not narrate obvious code or fabricate contributor names.

Keep persistence local-first; never use memory/provider caches as durable evidence.
Use lazy lists, focused state selection, bounded image/data caches and const
widgets where useful. Move heavy archive/replay work off the UI isolate. Profile
before claiming performance gains; report measurements or state unmeasured.

Networking requires timeouts, cancellation, typed errors, safe authentication and
idempotency-specific retries. Diagnostics use the shared redacted on-device logger,
10 rotating files capped at 5 MiB each. No tokens, PINs, private keys, transaction
payloads or personal data. Preview before explicit share/export; no auto-upload.

Run format, analysis and meaningful tests; inspect the final diff. Update handbook,
schemas/previews and changelog when behaviour/contracts change. Report executed
checks and limitations honestly. Fiscalisation is not in the initial scaffold.
