<!-- Maintained by the Dura POS contributors. -->
# Dura POS contributor instructions

Start with `handbook/engineering/00-engineering-contract.md` and the roadmap.
Historical design work lives under `cdx/`; `docs/` is reserved for future use.

- Apply `.agents/skills/flutter-product-engineering/SKILL.md` for Flutter work
  and the complementary `premium-mobile-product-design` skill for mobile UX.
- Apply the relevant `dura-tdd`, `dura-ui`, `dura-records`, `dura-sync` or
  `dura-release` skill for those project workflows.
- Use Pub workspaces/Melos, Riverpod, exact domain types and replaceable adapters.
  Business logic does not belong in widgets. Fiscalisation is optional and later.
- Write an acceptance test, observe its intended failure, implement, then refactor
  green. Do not claim unexecuted tests or measurements.
- Handwritten source/test files: at most 500 lines; format Dart to 80 columns.
  Keep other handwritten lines near 100 columns, except unavoidable URLs/strings.
- When logic is about 60% shared, extract its cohesive common responsibility;
  do not force unrelated business rules into a generic abstraction.
- Centralise constants by owning package/domain. Colours come from theme tokens.
  Avoid unnecessary enums, classes, dependencies and speculative layers.
- Comment public contracts and non-obvious invariants professionally. Begin each
  handwritten comment-capable file with a Dura POS contributor acknowledgement;
  never invent individual attribution. Generated files/JSON/lockfiles are exempt.
- Local-first; persist before side effects. Cache deliberately and bound storage.
  Diagnostic logs: max 10 files of 5 MiB each, redacted, local, explicit ZIP sharing.
- Every file/tab/schema change includes sample data and migration/restore effects.
- Preserve user changes and licence. No AI attribution. No credentials/private
  business data in logs, tests, issues or screenshots.
- Commit only within the user's authorised scope. Never push, publish or deploy
  without authorisation. Main-only CI does not itself authorise publication.
