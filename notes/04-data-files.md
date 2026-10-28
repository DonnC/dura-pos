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

```
Google Drive (the shop's Google account)
└── Dura POS/
    ├── My Shop                 the shop's main file, permanent
    ├── 2026/                   the current year
    │   ├── Activity 2026       audit trail for the year
    │   ├── 2026-01 Sales       one file per month
    │   ├── …
    │   └── 2026-10 Sales
    └── 2025/                   a closed year (archive)
        ├── Ledger 2025         the year's ledger, stock counts, rates, closing stock
        ├── Activity 2025
        └── 2025-12 Sales

Hidden app data (only Dura can see it): one backup of each phone's database
On each phone only: PINs, payment keys, the ZIMRA device key and fiscal state
```

**Why it's chunked this way:**

- `My Shop` is the one file the owner keeps coming back to.
- Sales are split by month, so each file stays small and quick to open on a
  phone, and "show me October" is one file.
- The ledger and the audit trail are split by year.
- A formula never reads another file. Every total is worked out inside its own
  file.

## Who writes what

| Mark | Meaning |
|---|---|
| **Owner** | The owner edits it, in the sheet or in the app. Dura checks the edits on the next sync, applies the valid rows, and lists any it skipped in Activity |
| **Phones** | Written by the phones. Rows are added and never rewritten, except status cells on a phone's own rows (fiscal status, payment status). Nothing is deleted |
| **Formulas** | Grey tab, worked out from other tabs in the same file. Don't type in it |
| **Owner's phone** | Written by the owner's phone only, e.g. the year-end archive |

## `My Shop`

| Tab | Written by | One row per | What it's for |
|---|---|---|---|
| Read Me | — | — | What each tab is, in plain words |
| Products | Owner | product | The price list and product master: name, barcode, one price in the pricing currency (USD), cost, tax, HS code, low-stock level, active. Other currencies' prices come from the day's rates |
| Stock | Formulas | product per location | Stock on hand, low-stock level, status (OK / Low / Out, coloured), value at cost, last received. Worked out from this year's Ledger tab |
| Locations | Owner | location | Main shop, stalls. Usually just one |
| Phones | Phones | phone | Each phone's location, status (Active / Retired), ZIMRA device ID and serial, certificate expiry, current fiscal day, last synced time, app version |
| Customers | Owner and phones | customer | Optional regulars and business buyers: name, phone no, email, type, TIN, VAT number, address, usual location, which phone added them, active, merged into. A phone adds a customer at checkout; the owner edits in the sheet or the app. A business buyer's details go on its fiscal invoices |
| Staff | Owner | person | Role (Owner / Seller), app access, which phones, discount limit, refunds, active dates. PINs are never stored here |
| Suppliers | Owner | supplier | Name, phone, TIN and VAT number, what they supply, payment terms |
| HS Codes | Dura | HS code in use | The ZIMRA HS codes this shop's products use, with ZIMRA's official wording and how many products use each. The app carries ZIMRA's full list (about 6,600 eight-digit codes, in `../reference/zimra_hs_codes.csv`) and offers a search when a product is added; only the codes in use are written here |
| Taxes | Phones | tax | Copied from ZIMRA's configuration when fiscalisation is on: tax ID, name, percent, code |
| Currencies | Owner | currency | USD, ZWG and ZAR: whether accepted, what each is used for, price rounding |
| Payment Methods | Owner | method | Cash per currency, EcoCash, InnBucks, card, bank transfer. Each has its ZIMRA money type, provider (e.g. Paynow), sandbox or live, and how payment is confirmed. The keys themselves are never stored here |
| Settings | Owner | setting | Business details, TIN and VAT number, the shop's Google account, discount limit, day close times, sync, backups, receipt footer |
| Exchange Rates | Owner | day | ZWG and ZAR per 1 USD, set each morning |
| Ledger 2026 | Phones | stock or cash movement | **The single ledger.** Every movement of stock or cash from every phone and location (see below) |
| Purchases 2026 | Phones | supplier invoice | Supplier, their invoice number, total and VAT (input tax for the VAT return), how it was paid, payment status, a photo of the invoice. The items are `Stock in` rows in the Ledger with the same Purchase ID |
| Customer Balances | Dura | customer or supplier, per currency | What the shop owes and is owed: kept change, invoices on account, and supplier invoices. Status Open, Settled or Over limit (red) |
| Stock Counts 2026 | Phones | product per count | Each stock take: expected, counted, difference, value of the difference, who counted, who approved |
| Payment Callbacks 2026 | The optional Apps Script receiver | callback | Payment confirmations sent by Paynow: signature valid or not, matched sale, result. Optional: tills always confirm by polling |
| Summary | Formulas | — | Products OK / Low / Out and stock value per location. Year to date: stock received, cost of goods sold, write-offs, count differences, and expenses, takings and banking per currency |

### The Ledger

| Type | Qty | Cash | Example |
|---|---|---|---|
| Opening | + | | Stock carried over on 1 January (or the first count when the shop started) |
| Stock in | + | | A delivery: the bakery van, the wholesaler |
| Sold | − | | Items sold, one row per product per phone per sync batch |
| Returned | + | | A customer return back into stock |
| Written off | − | | Damaged or expired stock, a stopped seasonal item |
| Moved out / Moved in | − / + | | Stock taken from the main shop to the Mbare stall, matched by Reference |
| Counted | ± | | The difference found by a stock count |
| Expense | | − | A market levy, or transport for stock. `From drawer` says whether it left a till |
| Purchase | | | A supplier invoice: `Balance change` + (the shop owes the supplier) |
| Supplier paid | | − | Paying a supplier: `Balance change` −, and cash out (`From drawer` Yes if paid from a till) |
| Change kept | | | Change the shop kept for a customer: `Balance change` +. The cash stays in the till |
| Change used | | | Kept change spent on a sale: `Balance change` − |
| Change paid out | | − | Kept change given back in cash, from a till |
| Invoiced on account | | | An invoice the customer pays later: `Balance change` − (they owe the shop) |
| Account paid | | | The customer paid an invoice: `Balance change` + |
| Takings collected | | − | Cash handed to the owner after the cash-up |
| Banked | | − | Cash deposited at the bank |

Every row names the location. Money rows for a customer or supplier also
carry their ID and a `Balance change`: positive when the shop owes them more,
negative when they owe the shop more. Adding up `Balance change` per customer
or supplier and currency gives the `Customer Balances` tab.

Stock in hand is the sum of `Qty` per product and location. `Stock value
(USD)` is `Qty × Unit cost`, so the ledger also gives the cost of goods sold.
Profit is the sales totals (in the monthly files) minus that cost.

## `<year>-<month> Sales`, one per month

| Tab | Written by | One row per | What it's for |
|---|---|---|---|
| Read Me | — | — | What each tab is |
| Sales | Phones | sale, invoice or return | Who sold it, where and when; currency, items, subtotal, discount, total, VAT; how it was paid and the change given; the customer ID, name and TIN (blank for walk-ins); the fiscal fields: status, ZIMRA device ID, fiscal day, ZIMRA receipt no, verification code; payment status (Paid, Unpaid, Refunded) and due date; synced time. A return has negative amounts and points to its original sale. An invoice on account is `Type = Invoice` and shows Unpaid until it's paid |
| Items Sold | Phones | item line | Product, quantity, unit price at the time of sale, discount share, line total, tax, VAT |
| Payments | Phones | payment, change, kept change, refund, or later payment of an invoice | The method and currency actually handed over (see "Several currencies" below). An invoice's later payment is filed in the month it arrived, pointing to the invoice |
| Cash-ups | Phones | phone per day | Float, expected against counted cash per currency, the difference, mobile money and card totals per method, and kept change kept and used that day |
| Fiscal Days | Phones | ZIMRA fiscal day per phone | Device ID, day number, opened and closed times, receipts and credit notes, totals and VAT per currency, status. Only from when fiscalisation is on |
| Quotes | Phones | quote | Customer, items, total, valid until; Open, Accepted (with its sale) or Expired. Not fiscal, no stock change |
| Summary | Formulas | — | The month by day (sales, returns, totals and VAT per currency), by location, phone, seller, payment method and product, plus cash-up differences. Charts of sales per day (USD and ZWG) and items sold |

A sale is filed in the month **it happened**, even if its phone synced it
later. Rows appear once their phone has synced: in the sample, today's rows
stop at each phone's last sync.

## `Activity <year>`

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
| Customer | `<phone>-C<seq>` | `P3-C0002` |
| Payment | `<sale id>-<n>` | `P4-S261013-0014-1` |
| Ledger row | `<phone>-L<yymmdd>-<seq>` | `P1-L261028-0003` |
| Purchase | `<phone>-B<yymmdd>-<seq>` | `P3-B261027-0001` |
| Quote | `<phone>-Q<yymmdd>-<seq>` | `P1-Q261005-0001` |
| Supplier | `<phone>-V<seq>` | `P1-V0002` |
| Activity row | `<phone>-A<yymmdd>-<seq>` | `P3-A261028-0012` |
| Receipt no (the shop's own) | `<phone>-<running number>` | `P4-0002972` |
| ZIMRA receipt no | the fiscal device's global number | `2972` |
| References | a short prefix plus the date | `WH-261026` (wholesaler), `MV-…` (move), `CNT-…` (count), `BNK-…` (banking), `DN-…` (delivery note) |

The ID is how a phone recognises its own row. It's how a retry avoids a
duplicate, and how a status cell is found again after the owner sorts the tab.

## Several currencies

Zimbabwe trades in USD, ZWG and ZAR side by side, and the files hold all
three.

- **One price per product, in the pricing currency (USD).** The ZWG and ZAR
  price is the USD price times that day's rate (from Exchange Rates), rounded
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
  - a "Where to look" list ("Who owes me?" → Customer Balances).
- **The tabs are colour-coded by who writes them:**
  - **green**: the owner edits it;
  - **blue**: the phones add rows;
  - **grey**: Dura works it out (formulas or lists);
  - the Read Me tab is dark blue.
- **Rows are coloured by meaning:**
  - returns are pink and invoices are blue;
  - unpaid is orange;
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

**Activity is one file per year.** That's enough by a wide margin, and one
file is easier to search.

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
