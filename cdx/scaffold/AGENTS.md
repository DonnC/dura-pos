# Dura POS project instructions

Use the engineering contract and roadmap before implementation. Before scaffold
activation they live in cdx/engineering; after activation use docs/engineering.

- Flutter/Pub workspace + Melos, Riverpod, Drift and typed native fiscal adapter.
- Core imports no UI, database or external API packages. Reuse shared UI parts.
- For meaningful behaviour: acceptance example, red test, green implementation,
  refactor, relevant regressions, docs/previews and changelog.
- Never treat provider state or a widget's state as durable financial evidence.
- Preserve money/currency precision and original rates, tax/cost facts and IDs.
- Use contract tests for replaceable implementations and reviewed golden diffs
  for UI changes. Never silently accept all goldens.
- Every file/tab/schema change needs sample data, dictionary and migration tests.
- Follow the roadmap; record justified architecture changes and completion proof.
- No production credentials/private records in tests, logs, screenshots or issues.
- Do not export fiscal keys or restore old fiscal counters.
- Do not add AI attribution or claim certification not obtained.
- Commit/push only when authorised; main-only CI and explicit release-intent
  policy do not authorise publication from an ordinary coding request.
- Preserve the existing licence, user edits and unrelated work.
