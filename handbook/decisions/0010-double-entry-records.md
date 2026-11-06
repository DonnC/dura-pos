# Decision: double-entry records behind the shop's ledgers

Status: Proposed
Date: 2026-11-06
Roadmap slice: moves postings and the trial balance from phase 7 to phase 2

## Problem and evidence

Today a sale is written to two records: `Sales` and `Items Sold` for what was
sold, and the `Stock Ledger` for the stock that left. Other money goes in the
`Money Ledger`. These are single-entry lists, so:

- nothing proves that money and stock agree with each other;
- nothing forces both sides of a sale to exist on a live shop, because the hub
  writes the rows an event carries, and the check that they match runs only on
  the sample shop;
- an accountant can't get a trial balance, a balance sheet or a true profit
  figure without rebuilding the records by hand.

## Decision and alternatives

**Every event that changes money or stock value also carries a balanced
accounting entry.** The owner never has to write one: the phone produces it, in
the same local transaction as the sale.

**Rules:**

- **Balanced by construction.** Debits equal credits in every entry, or it isn't
  recorded. Sums use exact decimals, never floating point.
- **Append-only.** A correction is a reversing entry linked to the original, as
  decision 0003 requires for all events.
- **The Stock Ledger and Money Ledger stay** as the plain views the owner reads,
  and become subledgers. Each row names its entry, and each has a control account
  that must equal it.
- **Quantities stay as they are.** Double entry covers value. A stock row is still
  a signed quantity, and a move between locations stays two linked rows with no
  posting, because the shop's stock value doesn't change.
- **Never block a sale.** If no rule covers a case, the entry posts to a visible
  `Suspense` account for the owner or accountant to clear.
- **The phone works it out; the hub only checks.** Rules are pure Dart in
  `dura_core`. The hub stores entries as ordinary view rows, counts any unbalanced
  batch in `status`, and never edits one.

**New tabs:**

| Tab | File | Writer | Holds |
|---|---|---|---|
| `Accounts` | `My Shop` | Owner, checked input | The chart: code, name, type, with a starter set |
| `Accounting Entries` | Month file | Phones, through the hub | One row per line: entry ID, event, account, debit, credit, currency, rate, pricing-currency amounts |
| `Trial Balance` | Month file | Formulas, opening figures from the hub | Opening, movement and closing per account |

Formulas never cross files, so the hub copies each account's closing balance into
next month's opening figures, the way it fills `Months`.

**Worked examples, all amounts USD:**

| What happened | Debit | Credit |
|---|---|---|
| Cash sale, 2 loaves at 1.00 | Till cash 2.00 | Sales 2.00 |
| The same loaves leave stock, cost 0.82 each | Cost of sales 1.64 | Stock 1.64 |
| Mobile money sale of 5.00 | Provider clearing 5.00 | Sales 5.00 |
| Provider pays out, less a 0.10 fee | Bank 4.90, Provider fees 0.10 | Provider clearing 5.00 |
| Invoice on account of 20.00 | Customers owe 20.00 | Sales 20.00 |
| Customer leaves 0.50 as kept change | Till cash 0.50 | Change held for customers 0.50 |
| Stock bought on credit, 30.00 | Stock 30.00 | Suppliers owed 30.00 |
| Supplier paid from the till | Suppliers owed 30.00 | Till cash 30.00 |
| Transport paid | Transport expense 3.00 | Till cash 3.00 |
| Owner takes 10.00 | Owner drawings 10.00 | Till cash 10.00 |
| Stock written off, or counted short | Stock losses 1.64 | Stock 1.64 |
| Sale with VAT, 11.55 at 15.5% | Till cash 11.55 | Sales 10.00, VAT owed 1.55 |

**Several currencies.** Each currency keeps its own accounts, so the USD till and
the ZWG till are never mixed. An entry balances in the pricing currency at the
event's rate, and when it stays in one currency it also balances in that currency.
Any rounding or rate difference posts to `Exchange differences`.

**Alternatives:**

- *Build the entries in the hub or with sheet formulas.* Rejected: the phone is the
  source of record and sells offline, and the hub isn't needed to complete a sale.
- *Wait for phase 7.* Rejected: entries belong in the sale event, and events are
  never rewritten, so sales recorded before this could only get entries by
  inference.
- *Replace the ledgers with the entries.* Rejected: owners read plain lists, not
  debits and credits.

## Compatibility and migration

No real shop has data yet, so nothing needs migrating. The sale event gains its
entry rows, the contract gains the new tables, the sample shop and clean templates
gain the new tabs, and the test shop is rebuilt. `dist/` changes, so the layout
version moves. `handbook/engineering/03-records-and-sheets.md` and the capabilities
list change on acceptance.

More rows: a typical sale adds four lines to the month file. That needs a measured
check against Sheets limits for a busy shop's month before this is accepted as done.

## Acceptance and reversal

**Build order:**

1. **The spec.** Generator tabs, a sample shop with entries for every scenario, and
   `verify` checks.
2. **The rules.** Posting rules in `dura_core`, with a table test per event type.
3. **The hub.** Contract, balance count in `status`, and opening balances.

**Done when:**

- every sample entry balances, and the sample's trial balance nets to zero;
- the `Stock` account equals the `Stock` tab's value, and the till accounts equal
  cash-ups, on the sample and on a real test shop;
- `Customers owe` and `Suppliers owed` equal `Balances`;
- gross profit from entries equals gross profit from `Months`;
- a reversed sale leaves every balance where it started;
- a qualified accountant has reviewed the starter chart and the worked examples
  before a pilot. Dura records the postings; it doesn't give tax or accounting
  advice.

Reversal: entries are extra rows, so removing the tabs and rules leaves the sales,
stock and money records intact.
