<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Workbook generator

`dura_templates` is a Python package and command-line tool. It builds every
workbook Dura creates in a shop's Google Drive, and checks that they're
right. It builds two things from the same writers:

- **the sample shop**, a complete fictional business with every file, tab,
  column, dropdown, colour rule, formula and chart;
- **the clean templates** the Shop Hub converts into a new shop's files, one
  set per pricing currency, in `dist/`.
The sample is the executable specification of the records. The app and the
Shop Hub must produce files that match it.

## Quick start

You'll need Python 3.11 or later.

```sh
cd backend/templates
python -m venv .venv
.venv/Scripts/activate            # Windows; on macOS or Linux: source .venv/bin/activate
python -m pip install -r requirements.txt

python -m dura_templates sample      # build sample/Dura POS/ (about 90 seconds)
python -m dura_templates templates   # build dist/ (a few seconds)
python -m dura_templates verify      # the sample reconciles, formulas work in Excel, template tests pass
```

| Command | What it does |
|---|---|
| `sample [--out DIR]` | Simulates the shop's trading and writes the sample to `sample/Dura POS/`, or `DIR`. It clears the output folder first, but refuses if the folder holds anything it didn't make |
| `templates [--out DIR]` | Builds the clean templates for USD, ZWG and ZAR into `dist/`, or `DIR`, and writes `manifest.json` with each file's SHA-256 |
| `check [FOLDER]` | Reads the workbooks back and checks they add up across sales, payments, stock, cash-ups, balances, fiscal numbering and HS codes. Exits 1 on any problem |
| `excel [FOLDER]` | Fails if any formula uses a function outside the Excel-compatible allowlist |
| `verify [FOLDER]` | `check`, then `excel`, then the template tests in `tests/`. This is what CI runs |
| `formulas [FOLDER]` | Prints which column heading each cross-tab formula reads, for review |
| `fingerprint [FOLDER] --write F` or `--compare F` | Fingerprints every generated file, to prove a code change did or didn't change the output |

`FOLDER` defaults to the committed `sample/Dura POS/`.

## Why it's built this way

- **Workbooks are written in Python, not in the app or the hub.** One place
  owns the layout, formulas, validation and charts, so a column or colour
  change needs no Flutter or Apps Script change. The hub converts the
  generated `.xlsx` templates into Google Sheets
  ([decision 0003](../../handbook/decisions/0003-records-journal-and-views.md),
  [decision 0005](../../handbook/decisions/0005-shop-hub-as-the-backend.md)).
- **The sample is simulated, not typed in.** Eleven months of trading are
  generated day by day: sales, returns, stock, cash-ups, invoices, quotes and
  fiscal days. As a result:
  - every number has a cause;
  - the checks can prove the files reconcile with each other, which hand-made
    examples never do.
- **Fixed random seeds.** Every run produces the same shop, so a change shows
  up as a difference, and reviews compare like with like.
- **Fingerprints, not eyes, for refactors.** openpyxl stamps each file with
  the time it was written. `fingerprint` hashes everything else, so
  "nothing changed" can be proven. This package was split out of a single
  2,500-line script that way: all 102 files matched the old script's output.
- **Excel compatibility is enforced.** Owners and accountants open these
  files in Excel too, so `excel` rejects Google-only functions
  ([decision 0006](../../handbook/decisions/0006-backend-folder-and-uniform-conventions.md)).

## What it creates

```text
sample/Dura POS/
├── Chipo's Corner Shop/
│   ├── My Shop.xlsx
│   ├── Product photos/                  P001.jpg … one placeholder per product
│   ├── 2025/
│   │   ├── 2025-12 December.xlsx
│   │   ├── Ledger 2025.xlsx             the closed year's archive
│   │   └── Supplier invoices/           photos, named by purchase ID
│   └── 2026/
│       ├── 2026-01 January.xlsx … 2026-10 October.xlsx
│       ├── 2026-11 November.xlsx        ready-made and empty, as the hub makes it on the 25th
│       └── Supplier invoices/
└── Chipo's Corner Shop (TEST)/          test mode: separate files, T- IDs
    ├── My Shop.xlsx
    └── 2026/2026-10 October.xlsx
```

That's 102 files: 16 workbooks and 86 photos.

| File | Tabs | Who writes it |
|---|---|---|
| **My Shop** (one per shop, permanent) | Read Me, Products, Lists, Stock, Locations, Phones, Staff, Contacts, Taxes, HS Codes, Currencies, Payment Methods, Settings, Exchange Rates, Stock Ledger, Money Ledger, Stock Counts, Purchases, Payment Callbacks, Balances, Months, Reports, Files, Summary | The owner edits the green input tabs; phones add ledger rows; reports are formulas |
| **Month file**, e.g. `2026-10 October` | Read Me, Sales, Items Sold, Payments, Cash-ups, Fiscal Days, Quotes, Activity, Summary | Phones add rows; Summary is formulas and charts |
| **Ledger 2025** (the archive) | Read Me, Stock Ledger 2025, Money Ledger 2025, Stock Counts 2025, Purchases 2025, Exchange Rates 2025, Months 2025, Closing Stock 2025 | Written once at year end, then read-only |

**Every workbook follows the same rules:**

- a Read Me first, with the colour key;
- tabs coloured by who writes them;
- dropdowns from `Lists`, and date pickers;
- negative numbers in red;
- status colours;
- no formula that crosses files or names a year.

## What happens when (the simulated year)

The sample runs from **1 December 2025** to **28 October 2026**, its "today",
part-way through the day. Along the way it switches on each feature, so every
tab has realistic rows:

| Date | What happens |
|---|---|
| 1 Dec 2025 | Shop set up on P1 and P2 at the Main shop; 25 products imported; opening stock counted; seller Rudo added |
| 1 Jan 2026 | Year end: closing stock of 2025 becomes opening stock of 2026 |
| 2 Jan 2026 | Year-end archive: the 2025 ledgers are copied to `2025/Ledger 2025` |
| 1 Feb | Kept change switched on |
| 16 to 27 Feb | ZIMRA test device, test fiscal day, sample documents, approval; live devices registered |
| 1 Mar | Fiscalisation on for P1 and P2; quotes start |
| 30 Mar to 1 Apr | P3 joins at the new Mbare Musika stall, with seller Farai; P3 fiscalised |
| 12 Apr | Two customer records merged |
| 2 to 4 May | Paynow sandbox, then live (EcoCash, InnBucks) |
| 19 to 20 May | P2's screen breaks; P4 is restored from P2's backup, with a new fiscal device |
| 3 Jun | The clinic canteen starts buying on account |
| 12 to 13 Jun | Seller Rudo leaves; Tendai joins |
| Jun to Aug | Price changes and a new product, from the app and from sheet edits, including a skipped bad row |
| 15 Aug | Shop Hub installed: Paynow keys move off the phones; callbacks start |
| 14 Sep | A forged payment callback is rejected |
| 25 Oct | The hub creates `2026-11 November` |
| 27 Oct | Test mode on and off, training a seller in the sandbox |
| 28 Oct | Today: phones synced up to about 14:00, so later rows aren't in Drive yet |

**Every day:**

1. the owner sets the rate;
2. stock is restocked and moved;
3. invoices are settled and quotes made;
4. each phone sells, with the occasional return;
5. each phone cashes up;
6. on Mondays the shop banks;
7. at month end there are stock counts.

**Rows appear in Drive only once their phone has synced,** as they would.

## The clean templates

```text
dist/
├── manifest.json        each template's file and SHA-256, and the cells the hub fills
├── USD/
│   ├── My Shop.xlsx
│   └── Month.xlsx
├── ZWG/  (the same two files)
└── ZAR/  (the same two files)
```

- **One set per pricing currency.** Headings carry the currency, as in
  `Price (ZWG)` and `USD per 1 ZWG`, and the owner chooses it, so each shop
  gets the set for its own currency
  ([decision 0008](../../handbook/decisions/0008-clean-templates.md)).
- **What's in them:**
  - every heading, formula, dropdown, colour rule, chart and Read Me the
    sample has;
  - starter Lists: common categories and units, `Any` location, standard
    supplier terms;
  - Settings defaults from note 10: daily rate, ask when a rate is missing,
    owner-only rates, fiscalisation off;
  - the three currencies, with the pricing one accepted;
  - a cash method per currency.
- **What's not in them:** rows, or anything from the sample shop. A test scans
  every cell for the sample's names.
- **What the hub fills in after converting,** at the addresses `manifest.json`
  names (a hub test checks they match):
  - My Shop's business name, hub version and `Data year`, in `Settings`;
  - the month's `Summary!E1`, the month's first day. The Summary's 31 day
    rows work out their dates from that cell, and stay blank for days the
    month doesn't have.
- **Reproducible.** Each file's zip times and creation stamps are fixed, so a
  rebuild gives the same bytes, and `manifest.json`'s hashes stay valid. The
  committed `dist/` must match a fresh build: a test checks it. Rebuild with
  `templates` whenever the layout changes.

## The archive and the year end

The sample follows the layout of note 12: live ledgers in `My Shop`, and a
`Data year` setting. At the year end, the generator shows what Dura records:

- `Ledger 2025.xlsx` in the `2025/` folder holds the year's stock and money
  ledgers, stock counts, purchases, rates, month totals and closing stock;
- 2026 starts with `Opening` rows that carry the closing stock forward.

Decision 0003 changes this for the first release: there's no destructive
clearing, and the journal keeps everything. The sample moves to the
handbook's layout in the records phase.

## The test shop

`Chipo's Corner Shop (TEST)` is a separate folder with its own `My Shop` and
month file:

- every ID starts with `T-`;
- the Read Me says it's practice data;
- `check` proves that no test ID appears in a live file, and the reverse.

## How the code is organised

```text
dura_templates/
├── cli.py, __main__.py   the commands
├── build.py              the order of work: simulate, then write each file
├── paths.py              input data and the output roots (--out)
├── profile.py            the pricing currency the layout is built for (one per process)
├── money.py              exact two-decimal rounding and splitting
├── fingerprint.py        content hashes of generated files
├── sample/               the fictional shop and its simulated trading
│   ├── period.py         START, TODAY and the two seeded random streams
│   ├── business.py       the shop: settings, products, prices, staff, customers, suppliers
│   ├── rates.py          daily exchange rates, and prices in other currencies
│   ├── records.py        the rows produced, IDs, Activity and ledger helpers
│   ├── stock.py          demand, purchases, restocking, moves, low-stock alerts
│   ├── sales.py          baskets, payments, change, returns, fiscal fields
│   ├── accounts.py       invoices on account and quotes
│   ├── day_end.py        cash-ups, fiscal days, stock counts
│   ├── events.py         one-off events, logged before the daily run
│   └── simulate.py       the day-by-day loop
├── workbook/             how a workbook looks
│   ├── styles.py         fonts, number formats, colours, layout version
│   ├── tables.py         tables, column lookup by heading, the Read Me tab
│   ├── headers.py        every tab's columns
│   └── lists.py          the Lists tab, dropdowns, date pickers, status colours
├── files/                one module per kind of file
│   ├── month_file.py     the monthly workbook and its Summary
│   ├── my_shop.py        My Shop's layout, for any content
│   ├── my_shop_content.py  the sample's My Shop content
│   ├── reports.py        My Shop's Months, Reports and Files tabs
│   ├── archive.py        Ledger 2025
│   ├── photos.py         placeholder photos
│   ├── test_shop.py      the (TEST) shop
│   └── templates.py      clean templates: content, reproducible bytes, manifest
└── checks/
    ├── sample_totals.py  everything reconciles (used by `check`)
    ├── excel_compat.py   the function allowlist (used by `excel`)
    └── formula_headings.py  the formula report (used by `formulas`)

tests/templates_test.py   what a clean template must be (run by `verify`)
dist/                     the committed clean templates
```

**How data flows:**

- `sample/` fills module-level collections in `records.py`, such as
  `sales_m["2026-10"]`. Then `files/` reads them and writes workbooks, using
  `workbook/` for the look.
- Data moves in one direction only: `workbook/` never imports `files/`, and
  `sample/` never imports either.
- The simulation runs once per process. Each CLI command is its own process.

## Changing the layout safely

1. **Before changing anything,** save the current output:

   ```sh
   python -m dura_templates fingerprint --write before.json
   ```

2. **Change the code,** then run `python -m dura_templates sample`.
3. **Check the result:** run `python -m dura_templates verify`, then
   `python -m dura_templates fingerprint --compare before.json`.
4. **Read the comparison:**
   - only the files you meant to change should be listed;
   - a refactor should list none.
5. **Open the changed workbooks** in Google Sheets and Excel.
6. **Commit the regenerated sample** with the code change. Don't commit a
   regeneration that changed nothing: the timestamps alone make new bytes.

**Fingerprints only match with the same openpyxl version.** A different
version writes the XML slightly differently. `requirements.txt` pins it.

## Excel compatibility

Every template must calculate the same in Google Sheets and in Excel 2019 or
Microsoft 365:

- **Functions:** only those in `checks/excel_compat.py`. Google-only
  functions are refused, such as `QUERY`, `ARRAYFORMULA`, `FILTER` and
  `IMPORTRANGE`. `MAXIFS` and `MINIFS` need Excel 2019 or later.
- **No formula crosses files or names a year.** No macros, scripts or custom
  functions.
- **Pivots and charts are extras,** never the only way to read a number.

## Templates and the compatibility contract

**Packaging and versions:**

- **Publishing:** clean templates are published with each Dura release, with
  their SHA-256 hashes. The hub pins a release, checks each hash, and
  converts the file into the shop's Drive.
- **Versions are immutable snapshots.** Existing workbooks keep their version
  until an explicit, backed-up upgrade runs. Owner sheets and custom formulas
  are never overwritten.
- **App code finds columns by stable field IDs** (`payment.net_applied`),
  never by letter, so a template change rarely needs an app change:

| Change | Where | App change? |
|---|---|---|
| Widen a column; change a colour | This generator | No |
| Correct a Summary formula | This generator, with a test of the expected total | Usually no |
| Move a column | This generator, and the field-ID map | No, once the mapping is proven |
| Change what a column means | The contract and the domain rules | Yes, with tests and a migration |

Every new layout needs a dictionary, sample rows, a passing `check`, a look
in Sheets and Excel, and a note of which versions were checked.
