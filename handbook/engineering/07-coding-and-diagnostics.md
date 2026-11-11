# Coding conventions and on-device diagnostics

Handwritten source/test files are capped at 500 lines. Dart format uses 80
columns. Keep other handwritten lines near 100 columns except indivisible URLs,
identifiers and structured data. Generated code, original research and lockfiles
are not manually split to satisfy the source limit.

When logic is roughly 60% shared, review its common responsibility and extract
that cohesive unit. This is a DRY trigger, not a synthetic metric enforced by
copying or coupling unrelated flows. Prefer fewer purposeful classes/enums.

Constants belong to their owning policy/domain package: DiagnosticPolicy,
theme tokens, application copy/routes and build metadata. No colours outside
theme tokens in application/widget code; widgets read ColorScheme/TextTheme.
Do not put every constant in one unrelated global file. Test fixture literals
are intentionally local so examples remain readable.

Handwritten source code uses the copyright/AUTHORS/MIT/SPDX header in
client/tool/source_header.dart: // for Dart, JavaScript and Kotlin, # for
Python. Docs, config and resources don't carry it. New files use the current year; retain existing
copyright years and third-party notices. Metadata/frontmatter/prologs may precede
the first comment. JSON, lockfiles, binaries and generated code are exempt.
Use concise Dartdoc on public contracts, invariants and non-obvious behaviour;
avoid restating obvious statements or inventing individual contributor names.

Do not edit CLAUDE.md; the owner maintains it. Use one widget, model or service
per file, retaining a necessary widget/State pair together. Prefer stateless
widgets; use state for actual asynchronous/lifecycle needs. Dispose owned routers,
controllers, subscriptions, timers and database handles. Do not dispose resources
owned by a caller. Check mounted after awaits; test completion after unmount.

Typography uses google_fonts 8.2.1 and bundled Roboto Regular/Medium/Bold with
runtime fetching disabled. Version 9's TextTheme uses material_ui and does not
match the scaffold's Flutter Material TextTheme; qualify that migration separately.
Visual tests load the same fonts as the app. Keep intentional baseline PNGs in
version control; ignore actual/failure/diff renders. They are not branding assets.

## Actual log layout

```text
application-support/
  diagnostics/
    dura.log
    dura-1793606400000000.log
  diagnostics-exports/
    support-TIMESTAMP-SEQUENCE.zip
  usage/
    usage.log
  dura-foundation.sqlite
```

Example log record:

```json
{"timestamp":"2026-11-02T08:00:00.000Z","event":"app.started","fields":{"status":"ready"}}
```

Only named operational events and allowlisted fields are accepted. Event/code/
trace values have a restricted identifier format. Unknown fields and free-form
messages are discarded. Never put tokens, PINs, customer names, amounts, payment
payloads or private keys into identifier fields just because a regex accepts them.
Global handlers log safe exception types, not exception text or account paths.
Each error also carries its source (`flutter_error` or `uncaught_error`), up to
12 frames from `safeFrames` as `function (package/file.dart:line)`, the screen's
tracker ID and the last 20 screens from `Breadcrumbs`. `safeRecord` checks every
frame and step again, so a message or a `file:` path can't be written. Release
builds made with `--split-debug-info` have no symbols, so their frames are empty.

Usage records are a second `RotatingDiagnostics` writer in `usage/`, with the
`usage` prefix, five files of 1 MiB, and `analyticsRecord` as its allowlist. Only
names in `AnalyticsEvents` and `AnalyticsFields` are kept; anything else becomes
`analytics.unknown` or is dropped. Recording is on unless the owner switches it
off in Problem reports (`analytics.recording` = `off`). Writes never throw to the
caller. See [decision 0012](../decisions/0012-counter-design-and-ui-foundation.md).

Rotation happens before an append would exceed the cap. Only managed diagnostic
filenames are eligible for pruning. rotation_log 0.1.2 provides size rotation and
ZIP creation; Dura's adapter provides redaction and serialized access. The package
counts archived files separately: set maxArchivedFiles to policy.maxFiles minus
one, reserving one active file. Limits are injected, defaulting to ten files of
5 MiB and two export ZIPs. Change startup arguments without editing logger logic:

```sh
flutter run --dart-define=DURA_LOG_MAX_FILES=6 --dart-define=DURA_LOG_MAX_FILE_BYTES=2097152 --dart-define=DURA_LOG_MAX_EXPORT_FILES=1
```

Bootstrap also accepts a DiagnosticPolicy argument. Diagnostic UI text derives
from that active policy. A lower count prunes old archives at initialization;
the next write also removes managed files above a newly lowered byte limit.
These are expendable diagnostics, never business journals. Avoid the package's
raw exception/error helpers: they can include private messages and paths.

ZIP creation shares the writer's queue and
streams in an isolate, so it captures complete records without blocking UI CPU.
An archive failure is reported, not recorded as export success. Logger write
failures reach the caller; the queue can accept subsequent work after recovery.

Diagnostics settings display filenames/sizes and the retention policy. Prepare
the ZIP, confirm sharing, then open the platform share sheet. Cancelling does not
send anything. Sharing does not imply the recipient received the file. There is
no background upload, developer telemetry endpoint or full business backup here.

For the future Report an issue screen, the owner chooses to submit a report and
reportIssue automatically prepares and attaches the ZIP through an injected
transport. Do not require a second manual ZIP preparation step. Archive failure
stops submission and exposes retry; sending without logs must be a clear owner
choice. A transport error remains a failure, not a delivered-report message.
Only this coordinator exists now; no issue screen, recipient or upload is wired.

The first scaffold has one process-owned log writer. Before adding background
workers or other processes, implement a shared writer broker/locking design and
test it. Export runs in an isolate against a queue-held snapshot and does not
initialize another writer. The provider owner closes the logger at disposal.
Archives live outside the rotating log directory; by default two ZIPs add
temporary storage beyond the default 50 MiB log cap. Deletion/export privacy UX may evolve
with real shop feedback, but must keep bounded retention and explicit sharing.
