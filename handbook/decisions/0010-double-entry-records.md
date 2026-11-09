# Decision: double-entry records, with no new tabs

Status: Accepted
Date: 2026-11-06
Roadmap slice: moves postings and the trial balance from phase 7 to phase 2

## Problem and evidence

A sale was written to two records: `Sales` and `Items Sold` for what was sold, and
the `Stock Ledger` for the stock that left. Other money went in the `Money Ledger`.
These were single-entry lists, so:

- nothing proved that money and stock agreed with each other;
- nothing forced both sides of a sale to exist on a live shop;
- an accountant couldn't get a trial balance or a balance sheet without rebuilding
  the records by hand.

The shop's workbooks had also reached 13 files and 132 tabs a year.

The first design added three tabs, one row per debit and credit. Measured against
the sample, that was 25 more tabs a year and about 8,000 more rows a month, doubling
each month file, to repeat what the rows already said.

## Decision and alternatives

**One row, two sides.** A row in `Payments`, the `Stock Ledger` or the `Money Ledger`
already records one movement of value. It gains three columns: `Amount`, `Debit
account` and `Credit account`. One positive amount against two named accounts is a
complete posting, so every row balances by construction.

**No new tab or file.** The rules are:

- **Accounts** are the 18 in `workbook/accounts.py`. The accounts money can land in
  are a list in `Lists`, and `Payment Methods` says which one each method uses.
- **The trial balance and balance sheet** are sections of `Reports`.
- **Months** gains one column per account the month files move, because formulas
  never cross files. `Sales` and VAT were already there.
- **The journal holds the record.** Each event's rows, with their postings, stay in
  the owner's Drive for good.

**A row that repeats something posted elsewhere names no accounts.** A `Change kept`
row in the Money Ledger tracks the customer's balance; the Payments row did the
posting. A move between locations changes no value, so it isn't posted either.

**Two postings have no row,** and the reports add them from existing columns:

| What | Debit | Credit | From |
|---|---|---|---|
| VAT in each sale | Sales | VAT owed | `Sales`, VAT |
| VAT on each purchase | VAT owed | VAT recovered on stock | `Purchases`, VAT |

Stock is held at cost including VAT, so the VAT recovered on stock appears as its own
line in the income statement rather than reducing stock. An accountant should confirm
this for a VAT-registered shop.

**Worked examples, all amounts USD:**

| What happened | Debit | Credit | Row |
|---|---|---|---|
| Cash sale, 2 loaves at 1.00 | Till cash | Sales, 2.00 | Payments |
| Those loaves leave stock, cost 0.82 each | Cost of goods sold | Stock, 1.64 | Stock Ledger |
| Change of 1.00 given | Sales | Till cash, 1.00 | Payments |
| Mobile money sale | Mobile money | Sales | Payments |
| Invoice on account | Customers owe | Sales | Payments |
| The customer pays later | Bank | Customers owe | Payments |
| Customer leaves 0.50 as kept change | Sales | Kept change owed, 0.50 | Payments |
| Stock delivered on credit | Stock | Suppliers owed | Stock Ledger |
| Supplier paid from the till | Suppliers owed | Till cash | Money Ledger |
| Transport paid | Expenses | Till cash | Money Ledger |
| Takings handed to the owner | Cash with owner | Till cash | Money Ledger |
| Till short at cash-up | Cash differences | Till cash | Money Ledger |
| Stock written off, or counted short | Stock losses | Stock | Stock Ledger |

**New Money Ledger types,** for movements that had no record: `Cash difference`,
`Float added`, `Till topped up`, `Mobile money withdrawn`, `Card paid into bank` and
`Opening`. Until now a till shortage never reached profit, and nothing showed who
topped up a till that gave more change than it took.

**Several currencies.** Every posting is in the pricing currency at the rate of the
day, so the trial balance is in one currency. Till, bank and wallet rows keep their
own currency and amount, so each currency's cash can still be proved. A sale's rows
add up to its total exactly: rounding goes on the largest row.

**The year.** The trial balance covers the data year. Year end carries each balance
sheet account into `Opening` rows in the Money Ledger, one per account and currency,
with last year's profit landing in `Opening balances`.

**Never block a sale.** Posting happens on the phone, in the same local transaction
as the sale. The hub stores the rows and adds up `Months`. It works nothing out.

**Unused tabs are hidden, not deleted.** `Fiscal Days`, `HS Codes`, `Quotes` and
`Payment Callbacks` stay hidden in new shops until the feature is on. `Summary` in
`My Shop` is folded into `Reports`. A shop that uses none of them sees 105 tabs a year.

**Alternatives:**

- *A tab of debit and credit rows.* Rejected for its size: see above. An accountant
  wanting one list gets it as an export instead, which is still to build.
- *Work the postings out in sheet formulas or the hub.* Rejected: the phone is the
  source of record and sells offline, and formulas can't cross files.
- *Wait for phase 7.* Rejected: postings belong in the sale event, and events are
  never rewritten.

## Compatibility and migration

No real shop has data yet, so nothing needs migrating. The test shop is rebuilt from
the new templates. `Payments`, the `Stock Ledger`, the `Money Ledger`, `Purchases`,
`Months` and `Payment Methods` gain columns at the end, so existing formulas keep
their columns.

## Acceptance and reversal

**Build order:**

1. The spec: generator, sample shop and checks.
2. The hub: `Months`, hiding tabs.
3. The phone's posting rules in `dura_core`, which must match `workbook/accounts.py`.

**Done when `python -m dura_templates check` shows, on the sample:**

- every posted row names two different accounts and one positive amount;
- each sale posts exactly its total, and the trial balance nets to zero;
- the `Stock` account equals the Stock Ledger's value;
- `Customers owe`, `Suppliers owed` and `Kept change owed` equal the shop's own
  records of who owes what;
- gross profit from postings equals `Months`;
- `Till cash`, in each currency, equals the floats.

A qualified accountant should review the accounts and the examples above before a
pilot. Dura records the postings; it doesn't give tax or accounting advice.

Reversal: the postings are extra columns, so removing them leaves the sales, stock and
money records intact.
