<!-- Maintained by the Dura POS contributors. -->
# Template-first business files and compatibility contract

The Python generator is the core authoring tool for approved workbook templates
and mock-shop examples. Evolve the existing samples/generate_samples.py entry
point into small modules rather than introducing a competing generator. Keep
column definitions, formulas and styling in clearly owned configuration/builders
so a minor workbook change does not require Flutter changes.

For every workbook type in the file registry, generate two versions from the
same layout definition:

| Output | Data preview | Purpose |
|---|---|---|
| Clean My Shop | Product ID / Product / Currency / Price; no product rows | New business template |
| Mock My Shop | PR001 / Bread loaf / USD / 1.00 | Explore a fictional shop |
| Clean monthly workbook | Sale ID / Currency / Net charge; no sale rows | New period template |
| Mock monthly workbook | DEMO-S001 / USD / 2.00 | Explore linked sales, stock and payments |

Clean versions retain formulas, dropdown reference lists, formatting, charts,
field identifiers and Read Me guidance, but no mock identities or transactions.
Mock versions are prominently labelled DEMO and use one deterministic reconciled
shop fixture across all files. Record their fixed sample period; never describe
a fixed fixture date as "today". Mock workbooks must not provision a live shop.
Other planned files, such as manifests and journals, need matching clean starter
forms where meaningful and readable mock examples; do not invent empty payment,
fiscal or accounting events merely to fill files.

Review generated workbooks visually in Sheets/Excel. Changes explored there must
be brought back into the Python source/configuration and regenerated before
approval; do not maintain a second independent master by hand. The app copies
the appropriate approved
template into the business account, sets identity/period metadata and populates
data ranges. Do not recreate formatting, reports and formulas in Dart code.

Python template definitions own layout, formulas, validation, charts and guidance;
approved generated workbooks are the app's provisioning artifacts. A small versioned
contract owns stable table/field identifiers, types, required fields, writable
ranges and supported versions. Column letters and human-readable labels are not
field identities. The records phase must prove that mappings survive supported
column moves; avoid duplicating the whole workbook layout in a code schema.

| Change | Where maintained | App change? |
|---|---|---|
| Widen Product name; change header colour | Python template definition | No |
| Correct a Summary formula | Python definition, with expected-total fixture | Usually no |
| Move Net applied from G to H | Definition and mapping using stable payment.net_applied | No, once mapping support is proven |
| Add an optional owner-only Notes column | Python template definition | No |
| Change how Net applied is calculated or interpreted | Contract and domain rules | Yes, with tests/migration |

Template versions are immutable approved snapshots, not a mutable public URL
that can silently change a business's files. Pin versions and distribute them
through an owner-accessible route without requiring public business data. Decide
the exact template packaging/copy mechanism during the records implementation.

New businesses/months use the compatible approved version. Existing workbooks
retain their version until an explicit, backed-up, resumable upgrade is applied.
Do not overwrite owner sheets or custom formulas. A template update alone does
not repair existing copies; offer a targeted report update or replacement report
tab with a preview. If a required mapping is missing, pause workbook writes and
explain the repair while sales remain local.

The initial app does not create Drive/Sheets files. It only creates a local
preferences database and diagnostic files described in the handbook.

Preview of the planned workbook data:

| File | Tab | Column | Example | Authority |
|---|---|---|---|---|
| My Shop | Products | Product | Bread loaf | Validated owner input |
| My Shop | Products | Price currency | USD chosen by this example owner | Validated owner input |
| November | Payments | Net applied | USD 2.00 | Derived from accepted events |
| November | Cash-up Counts | Difference | USD -1.00 | Counted minus expected |

Every new layout needs a dictionary, sample rows, independent reconciliation,
render inspection and actual Google Sheets/Excel portability evidence. The
existing samples directory is the starting point, not proof that the current
generator already implements clean/mock output pairs or the revised contracts.
