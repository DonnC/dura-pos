# Dura POS: the files in the owner's Google Drive

28 October 2026. This is the reference for every file and tab Dura keeps in
the owner's Google Drive: where each lives, who writes it, and what it's for.
Archiving and security are in `05-archiving-and-security.md`.

A complete working example sits in `../samples/Dura POS/`. It's a fictional
Harare shop, *Chipo's Corner Shop*, with:

- two locations: the main shop, and a stall at Mbare Musika from April 2026;
- three phones in use and one retired phone;
- three sellers over time;
- fiscalisation from March 2026 and Paynow from May 2026;
- kept change from February 2026;
- a clinic canteen buying on account from June 2026;
- monthly quotes for a school tuck shop;
- three suppliers: a bakery on account, a dairy paid on delivery, and a wholesaler;
- a 2025 year-end archive.

It runs from 1 December 2025 to today. Rebuild it with:

```
python3 ../samples/generate_samples.py   # needs openpyxl
```

Formulas calculate when a file is opened in Excel or Google Sheets, or uploaded
to Drive.

## Where everything lives

**Updated by `12`:**
- one folder per business;
- Activity is a tab in each month's file;
- month files are named `2026-10 October`;
- product photos have their own folder;
- test mode has its own folder.

The sample (`../samples/Dura POS/`) follows this layout, including placeholder
photos and a small `(TEST)` shop.

```
Google Drive (the shop's Google account)
└── Dura POS/
    ├── Chipo's Corner Shop/        one folder per business
    │   ├── My Shop                 the shop's main file, permanent
    │   ├── Product photos/
    │   ├── 2026/                   the current year
    │   │   ├── 2026-01 January     one file per month (sales, payments, cash-ups,
    │   │   ├── …                   fiscal days, quotes, activity, summary)
    │   │   ├── 2026-10 October
    │   │   └── Supplier invoices/
    │   └── 2025/                   a closed year
    │       ├── Ledger 2025         the year's ledgers, stock counts, purchases, rates, closing stock
    │       └── 2025-12 December
    └── Chipo's Corner Shop (TEST)/ test mode: the same layout, separate data

Hidden app data (only Dura can see it): one backup of each phone's database
On each phone only: PINs, the pairing secret, the ZIMRA device key and fiscal state
In the Shop Hub (optional Apps Script): payment keys
```

**Why it's chunked this way:**

- `My Shop` is the one file the owner keeps coming back to.
- Each month is one file: "what happened in October" is one file, small and
  quick to open on a phone.
- The ledgers are split by year, through the archive.
- A formula never reads another file. Every total is worked out inside its
  own file.

## Who writes what

| Mark | Meaning |
|---|---|
| **Owner** | The owner edits it, in the sheet or in the app. Dura checks the edits on the next sync, applies the valid rows, and lists any it skipped in Activity |
| **Phones** | Written by the phones. Rows are added and never rewritten, except status cells on a phone's own rows (fiscal status, payment status). Nothing is deleted |
| **Formulas** | Grey tab, worked out from other tabs in the same file. Don't type in it |
| **Owner's phone** | Written by the owner's phone only, e.g. the year-end archive |

## `My Shop`

The live tabs (`Stock Ledger`, `Money Ledger`, `Stock Counts`, `Purchases`,
`Payment Callbacks`) have no year in their name. The year they hold is
`Settings` → `Data year`, and the Summary reads it from there. Only archives
and file names carry a year, so no formula has to change on 1 January (`05`,
"Every year").

| Tab | Written by | One row per | What it's for |
|---|---|---|---|
| Read Me | — | — | What each tab is, in plain words, with a colour key and "where to look" |
| Products | Owner | product | The price list and product master: name, barcode, a link to its photo (`Product photos/`), one price in the pricing currency (chosen in Settings; `12`), cost, tax, HS code, low-stock level, active. Other currencies' prices come from the day's rates |
| Lists | Owner (green columns) and Dura (grey columns) | choice | The choices behind every dropdown (see "Dropdowns and dates") |
| Stock | Formulas | product per location | Stock on hand, low-stock level, status (🟢 OK / 🟡 Low / 🔴 Out), value at cost, last received. Worked out from this year's Stock Ledger |
| Locations | Owner | location | Shops, branches, stalls or storerooms, each Selling or Storage only (`09`). Usually just one |
| Phones | Phones | phone | Each phone's location, status (Active / Retired), ZIMRA device ID and serial, certificate expiry, current fiscal day, last synced time, app version |
| Staff | Owner | person | Role (Owner / Manager / Seller), app access, which phones, discount limit, refunds, active dates. PINs are never stored here |
| Contacts | Owner and phones | customer or supplier | **Everyone the shop deals with, in one list**, with `Type` Customer, Supplier, or Customer and supplier. Name, phone no, email, TIN, VAT number, address; for customers: usual location, on account, credit limit, payment days; for suppliers: what they supply and their terms. A phone adds a customer at checkout; the owner adds suppliers. A business buyer's details go on its fiscal invoices |
| HS Codes | Dura | HS code in use | The ZIMRA HS codes this shop's products use, with ZIMRA's official wording and how many products use each. The app carries ZIMRA's full list (about 6,600 eight-digit codes, in `../reference/zimra_hs_codes.csv`) and offers a search when a product is added; only the codes in use are written here |
| Taxes | Phones | tax | Copied from ZIMRA's configuration when fiscalisation is on: tax ID, name, percent, code |
| Currencies | Owner | currency | USD, ZWG and ZAR: whether accepted, what each is used for, price rounding |
| Payment Methods | Owner | method | Cash per currency, EcoCash, InnBucks, card, bank transfer, kept change, on account. Each has its ZIMRA money type, provider (e.g. Paynow), sandbox or live, and how payment is confirmed. The keys themselves are never stored here |
| Settings | Owner | setting | Business details, TIN and VAT number, the shop's Google account, the word for a location, discount limit, day close times, kept change, invoices, quotes, sync, backups, receipt footer |
| Exchange Rates | Owner | rate change | Units of each other currency per 1 unit of the pricing currency. Daily or latest, per the rate policy (`10`, section 6) |
| Stock Ledger | Phones | stock movement | **The stock ledger.** Every movement of stock, from every phone and location (see below) |
| Money Ledger | Phones | money movement | Every movement of money that isn't a sale: expenses, takings, banking, supplier invoices and payments, kept change, invoices on account (see below). Sales and their payments are in the monthly files |
| Stock Counts | Phones | product per count | Each stock take: expected, counted, difference (missing is red, extra is yellow), value of the difference, who counted, who approved |
| Purchases | Phones | supplier invoice | Supplier, their invoice number, total and VAT (input tax for the VAT return), how it was paid, payment status (Paid green, Unpaid orange), a photo of the invoice. The items are `Stock in` rows in the Stock Ledger with the same Purchase ID |
| Payment Callbacks | The optional Apps Script receiver | callback | Payment confirmations sent by Paynow: signature valid or not, matched sale, result. Optional: tills always confirm by polling |
| Months | Dura (values) | month | Written by the Shop Hub when a month closes, and nightly for the current month (or by the owner's phone without a hub). Sales, VAT and cost of goods sold in the pricing currency; output VAT and money in per currency. It's how `My Shop` reports on months whose sales live in other files, without a formula crossing files |
| Reports | Formulas | — | **Financial reports** (`13`): income statement year to date and by month, VAT per currency, cash flow per currency, and what the business owns and owes |
| Files | Dura | file or folder | Every Dura file and folder for the shop, with its Drive ID, layout version, and who made it. Phones and the hub find files here, never by name |
| Balances | Dura | contact, per currency | What the shop owes and is owed: kept change, invoices on account, and supplier invoices. Status 🔴 Over limit, 🟠 Owes the shop, 🔵 Shop owes them, ⚪ Settled |
| Summary | Formulas | — | Products OK / Low / Out and stock value per location; money owed; year to date: stock received, cost of goods sold, write-offs, count differences, and expenses, supplier payments, takings and banking per currency; month by month. With charts |

**Why customers and suppliers share one Contacts tab.**
- It's one place to find anyone's number.
- A business that both buys from and sells to the shop is one row.
- The money owed either way adds up in one Balances tab.
- The columns that apply to only one type are left blank for the other.
- The app shows customers or suppliers on their own screens; in the sheet,
  filter `Type`.

### The Stock Ledger

| Type | Qty | Example |
|---|---|---|
| Opening | + | Stock carried over on 1 January (or the first count when the shop started) |
| Stock in | + | A delivery from a supplier (with the supplier and the Purchase ID) |
| Sold | − | Items sold, one row per product per phone per sync batch |
| Returned | + | A customer return back into stock |
| Written off | − | Damaged or expired stock, a stopped seasonal item |
| Moved out / Moved in | − / + | Stock taken from the main shop to the Mbare stall, matched by Reference |
| Counted | ± | The difference found by a stock count |

Stock in hand is the sum of `Qty` per product and location. `Stock value
(USD)` is `Qty × Unit cost`, so the ledger also gives the cost of goods sold.
Profit is the sales totals (in the monthly files) minus that cost. To follow
one product, filter `Product ID` (and `Location`): that's its stock card. In
Google Sheets, Dura can add a **Stock Card** tab, where you pick a product from
a dropdown and see its movements with a running balance. It uses a formula
only Google Sheets runs reliably, so it isn't in the `.xlsx` sample.

### The Money Ledger

| Type | Cash | Balance change | Example |
|---|---|---|---|
| Expense | − | | A market levy, or transport for stock. `From till` says whether it left a till |
| Purchase | | + | A supplier invoice: the shop owes the supplier |
| Supplier paid | − | − | Paying a supplier (`From till` Yes if paid from a till) |
| Change kept | | + | Change the shop kept for a customer. The cash stays in the till |
| Change used | | − | Kept change spent on a sale |
| Change paid out | − | − | Kept change given back in cash, from a till |
| Invoiced on account | | − | An invoice the customer pays later: they owe the shop |
| Account paid | | + | The customer paid an invoice |
| Takings collected | − | | Cash handed to the owner after the cash-up |
| Banked | − | | Cash deposited at the bank |

`Balance change` is positive when the shop owes the contact more, and negative
when they owe the shop more. Adding it up per contact and currency gives the
`Balances` tab.

## Dropdowns and dates

**Nobody should type what can be picked.** In the green (owner) tabs:

- **Every repeated choice is a dropdown.** Yes/No, category, unit, tax, contact
  type, person or business, location, location type, role, app access,
  refunds, discount limit, supplier terms, currency, ZIMRA money type, mode,
  "merged into" (a contact), "set by" (a person).
- **The choices live in the `Lists` tab.**
  - The owner can add to the green columns: categories, units, discount
    limits, supplier terms.
  - The grey columns are fixed by Dura or ZIMRA: Yes/No, tax, roles, money
    types.
  - Locations, currencies, staff and contacts come straight from their own
    tabs, so a new location shows up in every location dropdown.
- **Strict or not:** most dropdowns refuse anything else. Category, unit, HS
  code and supplier terms suggest from the list but accept something new,
  with a warning.
- **Dates have a calendar.**
  - Date columns are validated as dates, and Google Sheets shows a date
    picker for them.
  - Dates display as `28 Oct 2026`, which can't be misread as month-first or
    day-first.
- **In the sheets Dura creates itself,** Yes/No columns are real Google
  Sheets checkboxes. The `.xlsx` sample uses a Yes/No dropdown, because Excel
  files have no checkbox cells.

The phones' tabs (blue) have no dropdowns, because nobody types there.

## `<year>-<month> <Month>`, one per month (e.g. `2026-10 October`)

| Tab | Written by | One row per | What it's for |
|---|---|---|---|
| Read Me | — | — | What each tab is |
| Sales | Phones | sale, invoice or return | Who sold it, where and when; currency, items, subtotal, discount, total, VAT; how it was paid and the change given; the customer ID, name and TIN (blank for walk-ins); the fiscal fields: status, ZIMRA device ID, fiscal day, ZIMRA receipt no, verification code; payment status (Paid, Unpaid, Refunded) and due date; synced time; and the total and VAT converted into the pricing currency at the sale's own rate (for profit reports). A return has negative amounts and points to its original sale. An invoice on account is `Type = Invoice` and shows Unpaid until it's paid |
| Items Sold | Phones | item line | Product, quantity, unit price at the time of sale, discount share, line total, tax, VAT, and the unit and line cost (pricing currency), so each month file works out its own gross profit |
| Payments | Phones | payment, change, kept change, refund, or later payment of an invoice | The method and currency actually handed over (see "Several currencies" below). An invoice's later payment is filed in the month it arrived, pointing to the invoice |
| Cash-ups | Phones | phone per day | Float, expected against counted cash per currency, the difference, mobile money and card totals per method, and kept change kept and used that day |
| Fiscal Days | Phones | ZIMRA fiscal day per phone | Device ID, day number, opened and closed times, receipts and credit notes, totals and VAT per currency, status. Only from when fiscalisation is on |
| Quotes | Phones | quote | Customer, items, total, valid until; Open, Accepted (with its sale) or Expired. Not fiscal, no stock change |
| Activity | Phones | action | The audit trail for the month (see below) |
| Summary | Formulas | — | The month by day (sales, returns, totals and VAT per currency), by location, phone, seller, payment method and product, plus cash-up differences, **profit and VAT** (sales before VAT, cost of goods sold, gross profit and margin; output VAT per currency). Charts of sales per day (USD and ZWG) and items sold |

A sale is filed in the month **it happened**, even if its phone synced it
later. Rows appear once their phone has synced: in the sample, today's rows
stop at each phone's last sync.

## Activity (a tab in each month's file; formerly `Activity <year>`)

| Tab | Written by | One row per | What it's for |
|---|---|---|---|
| Activity <year> | Phones | action | The audit trail: date, time, phone, who (or `Dura` for automatic actions), role, action, details, reference, and who approved it |

It records:

- signing in;
- refunds (approved by the owner's PIN) and discounts over the limit;
- removed lines and price changes;
- the exchange rate being set;
- customers added, changed or merged;
- stock received, moved and counted, and stock alerts;
- cash-ups and their differences;
- fiscal days opening and closing, and receipts ZIMRA flagged;
- payment setup, and payment callbacks that were rejected;
- phones joining or being retired, and sellers being added or removed;
- settings changes;
- rows skipped on sync;
- backups;
- the year-end archive.

## `Ledger <year>` (archive)

Made by the owner's phone at year end. It holds:

- **Ledger <year>**: the year's ledger, moved out of `My Shop`;
- **Stock Counts <year>**, **Purchases <year>** and **Exchange Rates <year>**;
- **Payment Callbacks <year>**, if any;
- **Closing Stock <year>**: the ledger added up on 31 December. It equals the
  `Opening` rows of the next year's ledger.

## IDs

IDs are made on the phone, so two phones can never produce the same one, even
offline:

| ID | Format | Example |
|---|---|---|
| Sale | `<phone>-S<yymmdd>-<seq>` | `P4-S261013-0014` |
| Contact (customer or supplier) | `<phone>-C<seq>` | `P3-C0002` |
| Payment | `<sale id>-<n>` | `P4-S261013-0014-1` |
| Stock Ledger row | `<phone>-L<yymmdd>-<seq>` | `P1-L261028-0003` |
| Purchase | `<phone>-B<yymmdd>-<seq>` | `P3-B261027-0001` |
| Money Ledger row | `<phone>-M<yymmdd>-<seq>` | `P1-M261024-0001` |
| Quote | `<phone>-Q<yymmdd>-<seq>` | `P1-Q261005-0001` |

| Activity row | `<phone>-A<yymmdd>-<seq>` | `P3-A261028-0012` |
| Receipt no (the shop's own) | `<phone>-<running number>` | `P4-0002972` |
| ZIMRA receipt no | the fiscal device's global number | `2972` |
| References | a short prefix plus the date | `WH-261026` (wholesaler), `MV-…` (move), `CNT-…` (count), `BNK-…` (banking), `DN-…` (delivery note) |

The ID is how a phone recognises its own row. It's how a retry avoids a
duplicate, and how a status cell is found again after the owner sorts the tab.

## Several currencies

Zimbabwe trades in USD, ZWG and ZAR side by side, and the files hold all
three.

- **One price per product, in the pricing currency** (chosen by the owner in
  Settings, not assumed to be USD; the sample uses USD). Other currencies'
  prices are that price times the rate (from Exchange Rates), rounded
  to 0.50. There are no fixed per-currency prices: change the rate, and every
  price follows.
- **A sale has one currency.** That is the currency of its receipt, and the one
  ZIMRA receives. Totals, VAT and the fiscal day totals are kept per currency
  and never mixed.
- **Payments record what was actually handed over**:
  - `Currency` and `Amount` are the money itself, so a USD sale can be paid
    partly in USD cash and partly by EcoCash in ZWG.
  - `Amount in sale currency` converts each row at `Rate used`.
  - For every sale, the `Amount in sale currency` of its Paid, Given and
    Refunded rows adds up exactly to the sale total. That's what the fiscal
    receipt's payments are made from.
- **Change is a row too** (Kind = Change, negative amount). It is often USD
  cents given back in ZWG, which is how Zimbabwean tills work when USD coins
  are short.
- **Cash-ups count each currency separately**: float + cash taken − change −
  refunds − drawer expenses = expected; then counted, and the difference.
- **Reports never add currencies together.** Each Summary shows USD, ZWG and
  ZAR in their own columns. Ledger values are in USD at cost.

## Reading the files without the app

Every file makes sense on its own, in Google Sheets or Excel:

- **Read Me first.** Every file opens on a Read Me tab that has:
  - what the file is;
  - a colour key;
  - every tab with what it's for;
  - a "Where to look" list ("Who owes me?" → Balances).
- **The tabs are colour-coded by who writes them:**
  - **green**: the owner edits it;
  - **blue**: the phones add rows;
  - **grey**: Dura works it out (formulas or lists);
  - the Read Me tab is dark blue.
- **Red numbers are negative, everywhere:** stock going out, money going out,
  short, or owed. A glance down a column shows the bad news.
- **Status dots** in Dura's tabs: 🟢 good, 🟡 needs a look soon, 🟠 someone
  owes the shop, 🔵 the shop owes someone, 🔴 act now, ⚪ settled. The dots
  survive printing and colour blindness better than fill colour alone.
- **Rows are coloured by meaning:**
  - returns are pink and invoices are blue;
  - paid is green, unpaid is orange, and overdue is red;
  - ZIMRA-accepted receipts are green, queued ones blue, flagged ones yellow;
  - stock in is green and stock lost is pink; money out is pink, owed is
    yellow, and banked is blue;
  - in a stock count, missing is red and extra is yellow;
  - a cash-up that's short is red, and one that's over is yellow;
  - stock that's low is yellow, and out of stock is red;
  - a balance over its limit is red;
  - a quote is blue if open, green if accepted, and grey if expired;
  - retired phones and inactive customers are grey.
- **Summaries have charts:**
  - the month's sales per day, for USD and ZWG;
  - items sold;
  - products OK, low and out per location;
  - stock bought against stock sold, month by month.
- **Busy days and big differences stand out** through colour scales.
- **Amounts are never added across currencies.** USD, ZWG and ZAR always have
  their own columns.

The sample files show all of this. Google Sheets keeps the colours, the
conditional colours and the charts when an `.xlsx` is uploaded. Dura itself
creates them with the Sheets API.

## How big can the files get?

The limit is per Google Sheet: **10 million cells**, counting every cell in
every tab, empty ones included. Dura sizes each tab to its columns exactly,
so no cells are wasted.

| File | Cells per year or month in the sample | A file fills up at about |
|---|---|---|
| A month's Sales file | about 0.15 million in a busy month (about 1,600 sales; roughly 90 cells per sale with its items and payments) | about 110,000 sales in one month, i.e. 3,700 a day: a 10-phone shop doing 370 sales per phone per day |
| `My Shop` (this year's Ledger in it) | about 0.45 million for ten months | about 450,000 Ledger rows in a year (20 columns each) |
| `Activity <year>` | about 0.05 million (5,000 rows) | about a million actions in a year: far beyond any small shop |

**Activity is a tab in each month's file** (`12`), so the audit trail sits
beside the sales it explains.

**If a shop ever gets close,** the owner's phone watches each file's size on
sync. When a file passes 70% of the limit:

- **A month's Sales file:** new rows go into a second file for the same
  month, `2026-10 Sales (2)`, with its own Summary.
- **`My Shop`:** the year's Ledger moves to its own file early, as at year
  end, and Stock and Summary move with it, since formulas never cross files.
- **The owner sees one line** in Activity and on the phone: "October's sales
  file was full; new sales go to 2026-10 Sales (2)".

Nothing is lost and nothing is rewritten. Sheets also slow down well before
the limit, so these steps are for speed as much as for size.
