<!-- Maintained by the Dura POS contributors. -->
# Versioned business-file schema

Generate Google workbooks, app mappings, sample workbooks and Excel exports from
one versioned schema when the records phase begins. Do not copy a static Excel
file as the hidden authority. A schema records tabs, columns, labels, validation,
formats, compatible formulas, report/chart layout and migrations.

The initial app does not create Drive/Sheets files. It only creates a local
preferences database and diagnostic files described in the handbook.

Preview of the planned schema's meaning:

| File | Tab | Column | Example | Authority |
|---|---|---|---|---|
| My Shop | Products | Product | Bread loaf | Validated owner input |
| My Shop | Products | Price currency | USD chosen by this example owner | Validated owner input |
| November | Payments | Net applied | USD 2.00 | Derived from accepted events |
| November | Cash-up Counts | Difference | USD -1.00 | Counted minus expected |

Every new layout needs a dictionary, sample rows, independent reconciliation,
render inspection and actual Google Sheets/Excel portability evidence. The
existing samples directory is historical design material until migrated.
