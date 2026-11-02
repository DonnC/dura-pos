<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

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
cd client
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
| `client/apps/dura` | Android Flutter bootstrap, routing and diagnostic settings |
| `client/packages/dura_core` | Platform-independent contracts and storage policy |
| `client/packages/dura_data` | Drift preferences, rotating logs and ZIP archive adapter |
| `client/packages/dura_ui` | Semantic theme tokens and reusable controls |
| `handbook` | Active architecture, tests, roadmap, records and decisions |
| `.agents/skills` | Seven project-specific engineering/design workflows |
| `hub` | Future Apps Script plan; nothing deployed |
| `schema` | Workbook template and compatibility plan; implementation later |
| `cdx` | Historical research, mockup and staged templates |

See [the engineering contract](handbook/engineering/00-engineering-contract.md)
and [roadmap](handbook/engineering/06-roadmap.md). `docs` is reserved for future use.

## Local diagnostics

Diagnostics use `rotation_log`, defaulting to **10 files × 5 MiB**, including the
active file. Configure `DURA_LOG_MAX_FILES`, `DURA_LOG_MAX_FILE_BYTES` and
`DURA_LOG_MAX_EXPORT_FILES` with Flutter `--dart-define`, or inject a
`DiagnosticPolicy` into bootstrap. Only allowlisted operational
metadata is recorded. Support ZIPs are prepared off the UI isolate; at most two
temporary ZIPs are retained in addition to logs. The app previews file metadata
and asks before manual sharing. The report operation automatically archives and
attaches logs when an owner chooses to report an issue; its future screen and
transport are not implemented. No background upload or business backup is implied.

Shared typography uses `google_fonts` and bundled Roboto for offline startup.
Each widget/model/service has a focused source file. Approved branding supplies
the Android launcher; regenerate its sizes with
`cd client` then `dart run tool/generate_launcher_icons.dart`. Golden PNGs are small visual-test
reference fixtures; failure screenshots are ignored and retained only as CI artifacts.

## Contributing and releases

Follow [CONTRIBUTING](CONTRIBUTING.md) and [AGENTS](AGENTS.md). Meaningful changes
use behaviour-first tests and update [CHANGELOG](CHANGELOG.md). Main-only CI runs
the current checks and Android debug build. Publication is disabled initially;
future signed releases need explicit version intent and signing configuration.

Original Dura POS work uses the [MIT licence](LICENSE); third-party licences
remain applicable. See [AUTHORS](AUTHORS) and [third-party notices](THIRD_PARTY_NOTICES.md). Do not post credentials or
private business records in issues; see [SECURITY](SECURITY.md).
