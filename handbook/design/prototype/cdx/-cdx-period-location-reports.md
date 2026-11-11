# Period and location reports / CDX

10 November 2026. Interactive design only, in `cdx`. No Flutter, backend,
workbook, financial records or production calculation contracts change.

Choose **Understand the figures** in the preview board. The Device selector
resizes the actual iframe viewport. That journey explicitly loads fictional
location examples using `reports=sample`; ordinary reports retain a current
till-only snapshot from the existing sandbox.

## Screens and hierarchy

| Screen | Purpose / main action | Recovery |
|---|---|---|
| How is the shop doing? | Choose period/place; coverage above recorded sales; view sales breakdown | Date errors clear old totals; empty view offers today on this device |
| Sales & returns | Original recorded sales, returns, net and device contributions; check included records | Missing values remain unavailable; no refund or payment action |
| What cash is expected? | Latest expected drawer cash by device/currency; back to report | Each drawer has its own timestamp; missing count stays unknown |
| What is included? | Show selected devices, dates, older figures and missing buying costs; back to report | A refresh with no connected Hub reports no new data; it never clears the missing-state warning |

Period choices are Today, Yesterday, This week and Choose dates. Custom ranges
are inclusive and bounded to 31 days in this preview. The fictional shop day is
10 November 2026; week-to-date starts Monday 9 November. Dates are calendar
dates in the sample shop's view, rather than UTC transaction timestamps.

Devices stack filters, coverage and the main sales amount. On tablets at least
900 CSS px wide, filters sit beside the heading; sales and detail links sit in
two columns. Large text uses a single column. The main action stays fixed below
the scrolling content. No chart interpolates missing days.

## Sample data and reconciliation

The table uses USD as fictional sample data. The app's pricing currency remains
the owner's choice. Report monetary figures use that selected pricing currency.

| Date / device | Place | Sales before returns | Returned goods | Net sales | Cost of goods | Source |
|---|---|---:|---:|---:|---:|---|
| 10 Nov / Device 1 | Front counter | 95.00 | 8.50 | 86.50 | Unknown | Current through 09:41 |
| 10 Nov / Device 2 | Front counter | 18.00 | 0.00 | 18.00 | Unknown | Last update 08:12 |
| 10 Nov / Device 3 | Market stall | Unknown | Unknown | Unknown | Unknown | No figures loaded |
| 9 Nov / Device 1 | Front counter | 110.00 | 10.00 | 100.00 | 65.00 | Included |
| 9 Nov / Device 2 | Front counter | 52.00 | 2.00 | 50.00 | 30.00 | Included |
| 9 Nov / Device 3 | Market stall | 73.00 | 3.00 | 70.00 | 42.00 | Included |

- Front counter today: recorded net USD 104.50; still incomplete because Device
  2 may have newer sales. Adding All example locations keeps USD 104.50 as a
  known subtotal while also showing the missing Market stall update.
- Market stall today: **Not available**, rather than zero.
- All locations yesterday: USD 235.00 sales − USD 15.00 returned goods =
  USD 220.00 net sales. Cost of goods USD 137.00 gives USD 83.00 gross profit,
  before shop expenses. All selected sample devices are included for that day.
- Week to date: recorded net USD 324.50, with the same missing/older Tuesday
  sources. It remains a partial figure.
- Device 1's latest drawer: USD 70.50 and ZWG 135.00, separately. Device 2 and
  Device 3 have no current expected-drawer figure. No USD/ZWG grand total is made.

Ordinary, non-example mode reads `s.sales`, `s.saleCount`, `s.cash` and `s.zwg` as
current till snapshots. It does not invent historical gross sales, return totals
or buying costs from an incomplete receipt list. Earlier periods have no rows
until real history is designed. A known current value of zero is displayed as
zero, separately from a missing period with no figures loaded.

## Decisions and assumptions

- **Two filters:** period applies to sales; place limits the devices included.
  The additional Market stall is an explicit example location, not a shop
  configuration change. Normal mode offers This device only.
- **Coverage is above the amount:** recorded subtotals remain useful while an
  older/missing device is visible. A report for an open day says figures so far,
  even when all selected source snapshots are current. It never labels an open
  day's subtotal as a final full-day result.
- **Completeness has boundaries:** the example checks expected device/day rows
  for the selected dates and places, plus whether those rows are current. It
  does not prove journal continuity, provider confirmation, fiscal acceptance,
  record deduplication or that a real device has uploaded everything. Production
  completeness rules still need their own contract.
- **Profit has its own requirement:** gross profit appears only when all source
  rows and their net cost-of-goods figures are present. Missing costs remain
  unknown. Gross profit is before shop expenses, not take-home money. Tax,
  discounts, stock valuation and net-profit reporting are outside this slice.
- **Flows and balances stay separate:** drawer cash is the latest snapshot,
  explicitly outside the chosen sales period. A sales filter does not turn a
  current drawer value into a yesterday/month-end balance. Customer collections,
  supplier payments and kept-change payouts do not become new sales. Historical
  balances, debt ageing and period cash-movement reconciliation remain future
  screens rather than inferred numbers.
- **No currency conversion:** sales use the pricing currency. Foreign cash in
  a drawer is shown separately, with its own currency. No exchange rate or
  cross-currency sales total is invented.
- **No false refresh:** without a Hub connection, checking for newer figures
  explains that nothing new was received. Snapshot values and coverage remain
  unchanged. Offline reporting uses saved figures; cash selling stays available.
- **Owner scope:** these reports and drill-downs are owner-only. Cashier My till
  remains focused on that cashier's current drawer and work.
- **Read-only examples:** location reports use an isolated fixture and do not
  post or modify sales, balances, returns, stock, cash or pending payments.
  Local till practice actions affect normal mode's current snapshot; they do
  not rewrite the separate location fixture.

## States and browser storage

Custom-date validation covers missing dates, reversed ranges, future practice
dates, invalid calendar dates and ranges over 31 days. Invalid inputs remove
the previous total and disable the sales action. The fields stay editable and
do not re-render on every keystroke. Loaded, empty, reading/error, unavailable
historical data, unavailable profit and partial coverage have explicit next
steps. Example reading/error states do not claim any actual network work.

Optional `reportFilter` stores four small fields: period, place, start and end.
Filters survive navigation, viewport resizing and a normal resume. Old sessions
default to Today / This device; the explicit sample defaults to Front counter.
Returning to ordinary mode resets an unavailable sample place to This device.
Reset/new-shop setup clears the filter. Report fixtures are code constants and
are not copied into financial browser state. No production schema, file,
migration or restore policy changes.

## Verification and captures

`-cdx-reports-check.cjs` covers period/place totals, net and gross-profit
reconciliation, missing versus zero, dates, retained filters, resize, per-currency
cash, no-change refresh, errors and owner access. It renders four scenes at
320, 390, 768 and 1024 CSS px in light/dark and 200% text: 48 combinations.

- [Device overview](-cdx-phone-reports.png) / [tablet overview](-cdx-tablet-reports.png).
- [Tablet yesterday, all locations and known gross profit](-cdx-tablet-report-yesterday.png).
- [Device sales](-cdx-phone-report-sales.png) / [tablet sales](-cdx-tablet-report-sales.png).
- [Device cash](-cdx-phone-report-cash.png) / [tablet cash](-cdx-tablet-report-cash.png).
- [Device coverage](-cdx-phone-report-coverage.png) / [tablet coverage](-cdx-tablet-report-coverage.png).

Results and the next task are in [status.md](status.md). Browser layout and
interaction checks are not physical-device, keyboard, TalkBack, real-source
reconciliation or vendor usability verification.

## Subsequent design pass

The later language/report/discount pass adds detailed charts and discount breakdowns. See
[-cdx-language-roles.md](-cdx-language-roles.md),
[-cdx-discounts.md](-cdx-discounts.md) and
[-cdx-owner-report-details.md](-cdx-owner-report-details.md) for the current
contract. Earlier limitations above describe that original slice.
