<!-- Maintained by the Dura POS contributors. -->
# Decision 0001: local-first Flutter foundation

Status: Accepted for the initial scaffold
Date: 2 November 2026

## Decision

Use Flutter 3.47.9 / Dart 3.13.7, native Pub workspaces and Melos 8.10.0 with
one root lockfile. Start with Android and three small shared packages: core,
data and UI. Do not create an empty fiscal plugin: fiscalisation is optional
per business and will be implemented in a later phase.

Use handbook for engineering information. Reserve docs for the owner's future
purpose. Install the seven project skills under .agents/skills and route them
from AGENTS.md. Keep historical research/prototypes under cdx.

Drift stores local non-secret preferences initially. Financial tables, sync,
cashier authentication and sales are not yet implemented. Riverpod wires a
replaceable DiagnosticStore and native sharing callback; widgets do not own
filesystem/archive logic. This gives a real small adapter example rather than
an empty architecture with every future feature represented by folders.

## Bounded diagnostics

One bootstrap-owned writer records allowlisted metadata in JSONL. At most ten
files, each at most 5 MiB. Archives are streamed on a worker isolate while the
writer queue is held; at most two temporary ZIPs are retained. Sharing requires
explicit confirmation. This bounds log storage to 50 MiB; temporary archives
can require additional space. Logs are not encrypted archives; share only with
trusted recipients. Background/multi-isolate logging needs a broker before use.

## Workbook template decision (revised)

Python remains the core authoring tool, starting from samples/generate_samples.py.
Generate every workbook type as both a clean template and a reconciled mock-shop
example from shared definitions. Review the outputs in Sheets/Excel and bring
changes back into Python. The app copies approved, versioned templates rather
than constructing their presentation in Dart. A small compatibility contract identifies
app-used tables/fields and writable ranges independently of column positions.
See schema/PLAN.md for examples and upgrade boundaries. Existing copies require
deliberate, resumable upgrades that preserve owner additions. Provisioning is a
later slice, not a hidden bootstrap network requirement.

## Verification and limits

Record actual commands/results in the foundation validation log. Initial goldens
use pinned Windows/Flutter/Roboto test rendering with Android platform behaviour;
CI uses Windows to match the available baseline environment. Linux visual
baselines require separate reviewed qualification, not assumed equivalence.

Main-only CI runs current tests, generated-code drift and a debug Android build.
No emulator/native fiscal suite is claimed. Publication is disabled in the initial
release manifest. A later enabled release requires signing secrets, increasing
version/build, reviewed notes, passing checks and a unique tag. No Play upload.
