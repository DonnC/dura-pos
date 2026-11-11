# Detailed owner reports

11 November 2026 · Fictional design data; no live account or app-code change.

Reports answer the owner's daily questions. Cashiers keep their own till view;
business reports and profit remain hidden and guarded, including direct entry.
Mobile and tablet expose the same permission boundaries and recorded amounts.

| Report | Question | Graph and detail |
| --- | --- | --- |
| Sales trend | How are sales changing? | Daily recorded net sales, returns, known gross profit and source coverage |
| Products | What is selling? | Net sales by product; net quantities, discounts and known gross profit |
| Cashiers | Who recorded the sales? | Net sales by recorded person; amounts and granted discounts |
| Discounts | What did we give away in discounts? | Discount amounts by reason; affected net sales and a clear original-sale basis |
| Existing drawer/coverage reports | What cash is expected, and what is missing? | Timestamped per-device/per-currency snapshots and source completeness |

Every detailed report keeps Period and Place controls. Today, Yesterday, This
week, Last 7 days, This month and a custom range are available. Date ranges and
location selection carry through the drilldowns. The example clock remains
10 November 2026; newer dates are rejected as before.

## Readable responsive charts

Charts use HTML labels and theme-token bars rather than labels shrunk inside an
SVG viewport. Mobile dates remain readable; longer periods and enlarged text can
scroll horizontally. Exact values, currency and coverage are available in the
keyboard-accessible **View chart figures** table. Negative recorded figures use
the zero baseline correctly; a true zero is distinct from missing data.

A faded bar means older or incomplete records. A question mark means no figures.
A bar for an incomplete day is the sum of available recorded figures, not a
complete estimate. Devices that have not sent records do not become zero-sales
days. Gross profit stays unavailable when buying costs or required records are
missing. It is after cost of goods and before shop expenses, not net profit.

On mobile the trend graph precedes the performance detail. On tablet the graph
and performance/context use the available width side by side. Product/cashier/
discount tables remain available below their graphs, with horizontal scrolling
when columns cannot fit. Charts never depend on colour alone for their meaning.

## Fixture and reconciliation rules

The original Today/Yesterday/This week snapshots retain their amounts. Additional
4–8 November rows provide a seven-day example. Each fictional daily row has
grouped product records whose net amounts sum to that row. Product and cashier
totals reconcile with recorded net sales for the selected fixture period/place.
Unit quantities are explicit grouped fixture data, not guesses from today's price.

Chipo and Rudo appear on shared devices. Cashier attribution comes from recorded
item/person data and is never inferred from a device's name. Fixture discounts
are recorded separately from after-discount sales; the graph does not subtract
them twice. Returns are separate. The fixture's original prices can therefore
be reconstructed as after-discount sales plus granted discounts.

Outside the sample report dataset, item detail uses available saved receipts and
their original line/return/discount snapshots. If earlier seeded summary figures
have no item records, the detail says so rather than allocating invented product
performance. No buying costs are inferred from selling prices. Currencies are
never combined; all charts use the selected shop pricing currency, and drawer
snapshots keep their currencies and timestamps separate.

## Captures and checks

| Report | Mobile | Tablet |
| --- | --- | --- |
| Sales trend | [Mobile](-cdx-phone-report-trend-detail.png) | [Tablet](-cdx-tablet-report-trend-detail.png) |
| Products | [Mobile](-cdx-phone-report-products-detail.png) | [Tablet](-cdx-tablet-report-products-detail.png) |
| Cashiers | [Mobile](-cdx-phone-report-cashiers-detail.png) | [Tablet](-cdx-tablet-report-cashiers-detail.png) |
| Discounts | [Mobile](-cdx-phone-report-discounts-detail.png) | [Tablet](-cdx-tablet-report-discounts-detail.png) |

The [scrolled tablet product report](-cdx-tablet-report-products-detail-scrolled.png)
shows the exact quantities, net sales, discounts and unknown-cost profit state.

[-cdx-owner-reports-check.cjs](-cdx-owner-reports-check.cjs) checks reconciliation,
unknown profit, known historical profit, role guards and 48 responsive layouts.
The original period/place, missing-versus-zero, retained-filter and currency
checks remain in the existing reports suite. The catalog records the new routes
and their denied-cashier states. Physical devices, TalkBack and vendor observation
remain separate validation; the examples make no measured usability claim.

These fields are display fixtures and aggregations inside cdx. No production
record, workbook, journal, migration or restore contract changes. Figma remains
deferred until the complete design is reviewed and remaining gaps are closed.
