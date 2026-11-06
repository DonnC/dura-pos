# Financial records: what Dura gives a Zimbabwean small business

28 October 2026. **This is a working guide, not tax advice.** ZIMRA's rules
change, and a business's own obligations depend on its registration
(VAT-registered or not, company or sole trader, presumptive tax or not). The
owner should confirm with their accountant or ZIMRA.

## The records a small business is usually asked for

| Record | Who asks for it | Dura | Where |
|---|---|---|---|
| **Sales record (day book)**: every sale and return, with tax | ZIMRA (for every taxpayer), the accountant | ✅ Full | Each month file: Sales, Items Sold |
| **Fiscal records**: fiscal receipts and fiscal day (Z) reports | ZIMRA, for fiscalised businesses | ✅ Full, through fzimra | Sales (fiscal columns), Fiscal Days |
| **Cash book**: money in and out, per currency | The accountant, the bank, the owner | ✅ Mostly | Payments, Cash-ups (per till per day), Money Ledger; **Reports → Cash flow** |
| **Purchases record**: supplier invoices, with input VAT | ZIMRA (to claim input VAT), the accountant | ✅ Full | Purchases, with invoice photos |
| **Stock records**: stock on hand, movements, counts, valuation at cost | The accountant (cost of sales, closing stock), the owner | ✅ Full | Stock, Stock Ledger, Stock Counts, Closing Stock at year end |
| **Debtors**: who owes the business | The owner, the accountant | ✅ | Balances; invoices on account in Sales |
| **Creditors**: whom the business owes | The owner, the accountant | ✅ | Balances; Purchases (Unpaid) |
| **Income statement (profit and loss)** | The accountant, ZIMRA (with the income tax return), banks and lenders | ✅ Trading part | **Reports → Income statement**: sales, cost of sales, gross profit, stock losses, expenses Dura sees, profit before tax |
| **VAT figures for the return**: output VAT, input VAT, VAT payable, **per currency** | ZIMRA, for VAT-registered businesses | ✅ Figures; the return itself is filed by the owner or accountant | **Reports → VAT** (year to date); each month file's Summary (the month) |
| **Cash flow statement** | Lenders, the accountant | ✅ Trading part, per currency | **Reports → Cash flow** |
| **Balance sheet (statement of financial position)** | The accountant, lenders; companies every year | ⚠️ Partly: stock, debtors, creditors and kept change. Cash at bank, equipment, loans and capital aren't in Dura | **Reports → What the business owns and owes** |
| **Provisional tax planning (QPDs)**: estimated profit for the year, to plan the four quarterly payments | ZIMRA (income tax payers) | ⚠️ The profit so far is in Reports; the estimate and the tax are the accountant's | Reports |
| **Presumptive tax** (some informal and small traders pay a fixed amount instead of tax on profit) | ZIMRA or the council, depending on the trade | ➖ Not computed. The sales record still shows the business's size | — |
| **Payroll**: wages, PAYE, NSSA, AIDS levy | ZIMRA, NSSA | ❌ Out of scope. A future link to `zw_compliance`'s payroll, or the accountant | — |
| **Records kept for years** | ZIMRA (commonly six years) | ✅ Everything stays in the owner's Drive, by year | `05` |

## How Dura works out the reports

All of this is checked by `samples/check_samples.py`.

- **Profit is in the pricing currency.**
  - Every sale row carries its total and VAT converted at that sale's own
    rate.
  - Every item line carries its cost.
  - So each month file works out its own sales before VAT, cost of goods
    sold, gross profit and margin (Summary → "Profit and VAT").
- **VAT and cash stay per currency.** Output VAT, input VAT and money in and
  out are never converted or added across currencies. A VAT-registered
  business declares what it owes per currency, as ZIMRA expects; the
  accountant confirms the rules.
- **The `Months` tab carries month totals into `My Shop`.**
  - Formulas never cross files, so the Shop Hub writes one row of totals per
    month into `Months` when the month closes, and keeps the current month
    up to date each night. Without a hub, the owner's phone does it.
  - `Reports` adds up `Months` for the year in Settings, with the ledgers in
    `My Shop`.
- **Cost of goods sold** is the cost of every item sold, less returns. It
  matches the Stock Ledger's `Sold` and `Returned` rows, and the check proves
  it month by month.

## Gaps, and the cheap ways to close them

Each of these is a small addition to the Money Ledger and the `Lists` tab, with
no new files. **Suggested for phase 5** of `10`:

| Gap | Fix |
|---|---|
| Expenses have no category | An `Expense category` column with a dropdown in `Lists`: rent, wages, transport, market levy, electricity and water, airtime and data, bank and wallet charges, repairs, other. The income statement then lists expenses by category |
| Wages paid in cash | An expense category `Wages`. Proper payroll (PAYE, NSSA) stays out of scope |
| The owner taking money out, or putting money in | Money Ledger types `Owner drawing` and `Owner put in`, so personal money isn't mistaken for expenses or sales |
| Bank and wallet charges, and transfer taxes | An expense category; the app can suggest the charge when a mobile-money or bank payment comes in |
| Cash at bank | A monthly `Bank balance` row typed by the owner (date, bank, currency, balance), so the balance sheet section can show it |
| Other income (e.g. renting out a fridge) | A Money Ledger type `Other income`, with a category |
| An accountant's pack | One tap: the year's `Reports`, `Months`, `Purchases`, `Balances` and `Closing Stock` exported as one workbook and a PDF, with `11` for anyone using AI |
