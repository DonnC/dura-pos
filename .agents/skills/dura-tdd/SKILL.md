---
name: dura-tdd
description: Implement or fix Dura POS business behaviour through TDD, durable workflow boundaries and reusable adapter contracts. Use for Dura feature or regression work, not unrelated repositories.
---
<!-- Maintained by the Dura POS contributors. -->

# Dura behaviour changes

From repository root, read handbook/engineering/00-engineering-contract.md and the
testing/architecture policies. The handbook is the active policy source.
Read the current roadmap slice; do not infer implemented features from notes.

Describe one observable acceptance example with fictitious shop data. Write/run
its test before implementation; verify the intended red failure. Record evidence
in the PR. Implement minimally, refactor green and run the relevant regression
and adapter contracts. Missing tools are not the intended red failure.

For checkout/sync changes, include the applicable durable transaction, unknown
external outcome, retry, duplicate and process-restart case. Preserve original
money/rate/tax/cost facts and live/practice isolation. Shared rules stay in pure
Dart; UI or platform changes must not fork business rules.

Choose the package's real test targets from the current scaffold. Do not claim
planned Melos helpers work before activation. Update schemas, data previews,
migrations, roadmap evidence and changelog where affected. Report green tests
and outstanding limitations precisely. Do not commit/push or publish unless
authorised by the user.
