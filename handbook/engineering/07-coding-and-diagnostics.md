<!-- Maintained by the Dura POS contributors. -->
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

Each handwritten comment-capable file starts with a contributor acknowledgement.
Use `// Maintained by the Dura POS contributors.` in Dart/Kotlin, `# ...` in YAML,
or an HTML/XML comment where appropriate. Metadata/frontmatter/prologs may precede
the first comment. JSON, lockfiles, binaries and generated code are exempt.
Use concise Dartdoc on public contracts, invariants and non-obvious behaviour;
avoid restating obvious statements or inventing individual contributor names.

## Actual log layout

```text
application-support/
  diagnostics/
    dura-00000001.jsonl
    dura-00000002.jsonl
  diagnostics-exports/
    support-TIMESTAMP-SEQUENCE.zip
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

Rotation happens before an append would exceed the cap. Only managed diagnostic
filenames are eligible for pruning. ZIP creation shares the writer's queue and
streams in an isolate, so it captures complete records without blocking UI CPU.
An archive failure is reported, not recorded as export success. Logger write
failures reach the caller; the queue can accept subsequent work after recovery.

Diagnostics settings display filenames/sizes and the retention policy. Prepare
the ZIP, confirm sharing, then open the platform share sheet. Cancelling does not
send anything. Sharing does not imply the recipient received the file. There is
no automatic upload, developer telemetry endpoint or full business backup here.

The first scaffold has one process-owned log writer. Before adding background
workers or other processes, implement a shared writer broker/locking design and
test it. Archives live outside the rotating log directory; up to two ZIPs add
temporary storage beyond the 50 MiB log cap. Deletion/export privacy UX may evolve
with real shop feedback, but must keep bounded retention and explicit sharing.
