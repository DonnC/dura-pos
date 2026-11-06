---
name: dura-templates
description: Change or check the Dura POS workbook generator in backend/templates: the sample shop, the clean Excel templates per pricing currency, the contract the Shop Hub reads, and the fingerprint and Excel-compatibility checks. Use this for any change under backend/templates, for a new tab, column, formula, dropdown, colour rule or chart, and when a sheet layout has to change, even if the request only mentions "the spreadsheet" or "the Excel file".
---
# The workbook generator

`dura_templates` is the executable spec for every file a shop owns. It builds two
things from the same writers, so they can't drift apart:

- **the sample** (`backend/templates/sample/Dura POS/`): a complete fictional shop,
  to show and check the design;
- **clean templates** (`backend/templates/dist/`): the same workbooks with no rows
  and no sample identity. The hub converts them into a new shop's Google Sheets.

Contributors don't need Python to run a shop: the templates are committed.

## Read first

- `backend/templates/README.md`: why it's built this way, and each command.
- `handbook/decisions/0007-generator-package-and-cli.md` and
  `handbook/decisions/0008-clean-templates.md`.
- `handbook/decisions/0006-backend-folder-and-uniform-conventions.md`: templates
  stay Excel-compatible.
- The `dura-records` skill, for what a layout change must state.

## Where things are

| Path under `dura_templates/` | What it holds |
|---|---|
| `cli.py`, `build.py` | The commands, and what they build |
| `profile.py` | The pricing currency, set per process by `DURA_PRICING_CURRENCY` |
| `workbook/` | Headings, styles, tables, `Lists` |
| `files/my_shop.py`, `files/month_file.py`, `files/reports.py` | The workbooks |
| `files/templates.py` | Clean templates, the manifest and the contract |
| `sample/` | The fictional shop's trading |
| `checks/` | Totals, formula headings and Excel compatibility |

Keep modules small and split by kind of file.

## What the templates promise the hub

`templates` writes `dist/manifest.json`, `dist/contract.json` and the generated
`backend/hub/src/view_contract.js`. They carry:

| Key | Use |
|---|---|
| `tables` | Each table's file, and its fields by stable ID. `Total (USD)` is `total_pricing` |
| `hubOnly` | Tables that phones may not write |
| `stockRow`, `balanceRow` | Row formulas, with `{r}` for the row number |
| `summaryBlocks` | Where a month's Summary reserves rows for labels |
| manifest `cells` | The cells the hub fills at setup |

The hub finds columns by heading, so moving a column is safe. Renaming a heading
changes a field ID, and that is a contract change.

Rows a template can't know (`Stock`, `Balances`, Summary labels) need a function
shared by the sample and the contract, as `stock_row_formulas` is, or reserved
rows guarded so unused ones stay blank.

## Sheet rules

- **Formulas never cross files and never name a year.** Reports read the `Months`
  tab, which the hub writes.
- **Excel-compatible:** the `excel` check rejects functions Excel can't open.
- **Every pricing-currency heading uses `PC`,** never a literal currency. The
  sample's USD is only the sample's choice.
- **Sheets are for people:** a Read Me, tabs coloured by who writes them, dropdowns
  from `Lists`, date validation, red negatives, status dots, charts.
- **Clean templates hold no sample identity.** A test scans for it.

## Changing a layout

Run these from `backend/templates`:

```text
python -m pip install -r requirements.txt
python -m dura_templates fingerprint --write before.json
```

Make the change in the generator, never in a workbook. Then:

```text
python -m dura_templates sample
python -m dura_templates verify
python -m dura_templates fingerprint --compare before.json
python -m dura_templates templates
python -m unittest discover -s tests -p "*_test.py"
```

Regenerating the sample changes file timestamps even when the content is the same.
If the fingerprints match, restore it with `git checkout -- sample`, so a commit
only shows real changes.

`fingerprint --compare` must list only the files you meant to change. For a
refactor, that means none.

If the contract changed, run `npm run verify` in `backend/hub` too, because
`view_contract.js` moved with it. `dist/` is committed and must be byte-for-byte
reproducible; a test rebuilds it to check.

## Done when

The checks above pass, the docs and `CHANGELOG.md` match, and you've said what was
checked. `verify` parses files; it doesn't recalculate them in Google Sheets or
Excel, so don't claim that it does.
