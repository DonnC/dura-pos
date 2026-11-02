---
name: dura-records
description: Design or change Dura POS event journals, Google Sheets layouts, Excel exports and file lifecycle policies with readable sample data and reconciliation. Use for Dura record formats, not generic spreadsheet work.
---
<!-- Maintained by the Dura POS contributors. -->

# Dura records and file lifecycle

Read the records policy in handbook/engineering/03-records-and-sheets.md; before
activation use cdx/engineering. Consult approved workbook templates and the small
compatibility contract in schema/PLAN.md. Python is the core template authoring
tool; evolve samples/generate_samples.py into cohesive modules. Generate clean
and mock-shop variants from the same definitions for every workbook type. Keep
layout/formula authoring out of Flutter; distinguish template-only changes from
domain-contract changes. Bring visual workbook edits back into Python definitions.
Use the available spreadsheet skill when actually creating/editing
workbooks and follow its rendering/verification requirements.

Every file/tab/column change includes a sample preview, dictionary, writer,
creation stage, authority, version, retention and recovery/migration behaviour.
Show currencies, units, signs and completeness. New examples are fictitious and
must add up across sales, payments, stock, shifts and accounting. Clean templates
retain formulas/reference lists but no demo records. Label mock files DEMO, use
fixed fixture dates and prevent demo artifacts from provisioning live businesses.

Treat accepted immutable events as history and Sheets as inputs/views. Define
how proposed owner edits are validated; no silent last-write-wins for money.
Keep provider settlement, shift cash-up/handover and fiscal closing distinct.

Use standard Excel-compatible formulas and readable fallback values. Pivots and
Google-only features cannot be essential to understanding an offline export.
Verify calculations independently, inspect renders, and report the actual
Google Sheets/Excel/LibreOffice versions checked. Structural parsing is not
recalculation proof. Preserve owner-created sheets in migrations.

Do not delete journals as part of cache cleanup or restore old fiscal counters.
Update templates/contract/checks together as applicable; pin template versions,
preserve owner additions and preview upgrades to existing copies. Mark
design-only previews honestly. Include late events, month/year boundaries,
missing devices, duplicate batches and damaged-view reconstruction as applicable.
