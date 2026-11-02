# Contributing to Dura POS

Dura serves small businesses through local-first operations, owner-controlled
records and usable exports. Keep those commitments when proposing improvements.

Before application scaffold activation, consult cdx/engineering. After activation,
use docs/engineering and the root roadmap. Do not assume a documented feature
already exists. Preserve the repository's existing licence.

## Development workflow

Use the pinned Flutter SDK and root Pub workspace. Run `flutter pub get`, then
`dart run melos bootstrap`. No per-package lockfiles or unreviewed global tool
versions. The exact runnable setup commands are confirmed at scaffold activation.

Agree a small acceptance example. Write/run a failing behaviour test; implement
the minimum; refactor green. Run the relevant contracts, migrations, widgets,
goldens and recovery tests. `dart run melos run verify` is the intended common
entrypoint once implemented. Do not claim this command works before activation.

Replace adapters through their contracts. UI-only changes reuse controllers and
core rules. Update sample rows, dictionary and schema/migrations when records
change. Preview every new file/tab design. Add a changelog entry for meaningful
changes. Supply red/green evidence and visual diffs in the PR.

CI runs only on pushes to main. Run local checks before merging; do not rely on
a PR status that does not exist. Do not auto-merge dependency updates.

No production fiscal/payment credentials in tests or issues. Public support
examples must be redacted/fictitious. See SECURITY.md for the actual private
reporting channel once configured. Do not claim ZIMRA certification or add AI
attribution trailers.

## Definition of done

Observable behaviour passes its tests; critical failure/restart cases are covered;
applicable visuals are inspected; records/exports reconcile; docs/changelog are
accurate; the roadmap links actual evidence and remaining limitations.
