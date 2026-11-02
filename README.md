<!-- Maintained by the Dura POS contributors. -->
# Dura POS

A free, open-source, local-first point of sale for small Zimbabwean businesses,
with owner-controlled records and portable exports as the product direction.

**Status: application foundation, not ready for live trading.** The Android shell
has local preferences, reusable themed controls and bounded on-device diagnostics
with explicit ZIP sharing. Sales, cashier authentication, Drive/Sheets sync,
payments and optional fiscalisation are later roadmap slices.

## Developer quick start

Use Flutter **3.47.9** / Dart **3.13.7**. Android builds require an Android SDK
and Java 17. Run commands from this repository root:

```sh
flutter pub get
dart run melos bootstrap
dart run melos run verify
cd apps/dura
flutter run
```

Choose an Android device when prompted. Only Android is scaffolded; desktop/web
are architectural targets, not tested application builds. No Google account,
merchant credentials or fiscal keys are required for the foundation.

## Workspace

| Location | Responsibility |
|---|---|
| `apps/dura` | Android Flutter bootstrap, routing and diagnostic settings |
| `packages/dura_core` | Platform-independent contracts and storage policy |
| `packages/dura_data` | Drift preferences, rotating logs and ZIP archive adapter |
| `packages/dura_ui` | Semantic theme tokens and reusable controls |
| `handbook` | Active architecture, tests, roadmap, records and decisions |
| `.agents/skills` | Seven project-specific engineering/design workflows |
| `hub` | Future Apps Script plan; nothing deployed |
| `schema` | Workbook template and compatibility plan; implementation later |
| `cdx` | Historical research, mockup and staged templates |

See [the engineering contract](handbook/engineering/00-engineering-contract.md)
and [roadmap](handbook/engineering/06-roadmap.md). `docs` is reserved for future use.

## Local diagnostics

Diagnostics retain at most **10 files × 5 MiB**. Only allowlisted operational
metadata is recorded. Support ZIPs are prepared off the UI isolate; at most two
temporary ZIPs are retained in addition to logs. The app previews file metadata
and asks before sharing. No automatic upload or full business backup is implied.

## Contributing and releases

Follow [CONTRIBUTING](CONTRIBUTING.md) and [AGENTS](AGENTS.md). Meaningful changes
use behaviour-first tests and update [CHANGELOG](CHANGELOG.md). Main-only CI runs
the current checks and Android debug build. Publication is disabled initially;
future signed releases need explicit version intent and signing configuration.

The existing repository [licence](LICENSE) applies. Do not post credentials or
private business records in issues; see [SECURITY](SECURITY.md).
