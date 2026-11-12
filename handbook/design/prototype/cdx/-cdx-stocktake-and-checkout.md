# Stock take, direct receipts and cash movements

11 November 2026 · Design only in cdx. No app/backend implementation changes.

## Research and the Dura fit

[Square's count workflow](https://squareup.com/help/us/en/article/8249-conduct-full-inventory-counts-with-square-for-retail)
distinguishes full counts from smaller cycle counts, with search, category and
scanner entry followed by review. Its full-count behaviour can zero uncounted
goods; a cycle count leaves excluded goods unchanged. Dura adopts the safer
counted-items approach for small shops that may stop halfway through a shelf.

[Lightspeed's count workflow](https://retail-support.lightspeedhq.com/hc/en-us/articles/229129948-Performing-inventory-counts-in-Retail-POS)
supports partial counts and calls attention to stock movements during counting.
Dura's inference: a stale physical count must not overwrite newer selling or
receiving activity. This preview flags affected counted items for recount,
instead of silently applying their old quantity. Unsynced activity on other
devices remains explicitly unknown.

[Shopify's current stock-count documentation](https://help.shopify.com/en/manual/inventory-and-locations/inventory-counts/creating-inventory-counts)
separates a location's count, progress and review, and supports product/barcode
lookup. Dura keeps these useful stages without copying a desktop-admin setup
requirement. The owner can count a shelf on the device and keep working offline.
The deprecated Stocky workflow was not used as the current Shopify reference.

These are documented product workflows, not interviews, competitor performance
measurements or evidence that Dura has passed a vendor usability test.

## Stock take for hundreds of products

- One draft for the signed-in Owner, shop and current device/location.
- Search by name, ID or barcode, plus category and All / Not counted / Counted /
  Recount filters. Barcode input finds a product; it does not invent camera
  access or automatically add one unit to a physical total.
- Only 20 count inputs are mounted per page, even with 500 sample products.
  Search remains available while scrolling. Enter advances to the next field,
  and at the page end advances to the next 20 when available.
- Counts are totals. Blank means untouched; explicit zero means none left.
  Measured items use their established base units and decimal quantity rules.
- Progress and entered values survive reload. Back pauses the task; Stock offers
  Resume stock take. Reopening a review requires a fresh check of restored work.
- Stock changed after an entered count is flagged for recount. Stock that moves
  before the first count uses its current baseline. Nothing stops cash selling.
- Review shows differences first, matched-product totals and untouched-product
  totals. Review rows are paged too. Tablet reason entry sits beside the list.
- Only counted products are adjusted, through new movements. Uncounted goods
  are never set to zero. Difference reasons include Other with required text.
  One reason describes the reviewed batch; separate batches can be used when
  distinct explanations are needed.

The 500-item example is synthetic review data. It is not a real shop catalogue.
The browser product bound is now 1,000 so this example can actually survive
reload; it is not a proposed production product limit or native performance claim.
Older small catalogues still load. Existing count drafts are compatible with
the visible legacy fields; new drafts retain a bounded entry map and per-product
stock revision alongside the existing review recovery mechanism.

State sample: `entries.bread = {value: "0", before: 18, revision: 0}`. An absent
or blank entry is different from this explicit zero. If a later movement changes
the recorded quantity/revision, the entry requires recount. No production
journal, workbook, migration or cross-device restore contract changes.

## Fewer clicks and clearer reasons

| Task | Revised path |
| --- | --- |
| Cash sale | Save sale → receipt data with one small success check; no intermediate screen or change card |
| Successful receipt | Share/print and Next customer are available immediately; navigation remains available |
| Failed local save | Unsaved preview, sharing disabled, Retry saving this sale; retry keeps the same record ID |
| Stock | Stock take and Receive stock stay together at the bottom for the Owner |
| Add product | Persistent, labelled plus FAB → product form |
| Large count | Inline quantities and keyboard advance; no open/save dialog for each product |
| Bulk delivery | Receive stock → supplier invoice shortcut, rather than finding Suppliers through Money |
| Account/profile panel | Lock and Switch person; duplicate My money/My till shortcut removed |
| Mobile header | 56 px minimum rather than 72 px, retaining the role and a 48 px profile target |
| Money out | One Used for choice; a description is required only for Other. Supplier reference is optional |
| Money in | Separate direct entry for float, owner contribution, expense money returned or Other; not a sale |

Full and partial returns reveal a required explanation when Other is selected,
keep it in the review and record it with the correction. Stock differences do
the same. Existing free-text discount and cash-up reasons already permit any
other explanation; no extra dropdown is added just to duplicate that freedom.

Necessary review/approval boundaries remain for stock corrections, refunds and
money leaving the drawer. Cashier money-in also requires Owner approval; Owner
money-in uses the signed-in role. This permission choice is a design assumption
for owner review. Money in changes drawer cash, not sales or customer debt.

## Currency display and payment

The Sell currency control is visible again. Following the owner's preference,
it changes product-price display as well as the payment route. The current
fictional example uses USD shop prices and the configured example USD/ZWG rate.
No live exchange-rate service is implied, and unavailable currency rates are
not invented.

Switching to ZWG preserves original USD product prices, discounts, receipts and
sales totals. It shows converted prices and basket total with the rate beside
the shelf. Take payment opens the existing currency-split screen with USD zero
and the converted ZWG remainder filled in. Each saved payment retains its rate
and tender amounts; zero-value tender lines are omitted from the receipt.

Conversion rounds the remainder once to tender-currency cents. For example,
USD 3.33 at the fictional rate of ZWG 27.01 per USD becomes ZWG 89.94. The saved
sale remains USD 3.33 and keeps its rate, payment and rounding residual. The
current split preview still accepts exact payment only; choosing an overpayment
change currency is outside this slice. No pricing-currency migration occurs.

## Previews and checks

Use **Stock take & direct receipt** in [-cdx-preview.html](-cdx-preview.html).
The screen selector also exposes Money in and its review.

| View | Mobile | Tablet |
| --- | --- | --- |
| 500-item stock take | [Mobile](-cdx-operations-mobile-stock-count.png) | [Tablet](-cdx-operations-tablet-stock-count.png) |
| Differences review | [Mobile](-cdx-operations-mobile-count-stock-review.png) | [Tablet](-cdx-operations-tablet-count-stock-review.png) |
| Stock actions and FAB | [Mobile](-cdx-operations-mobile-stock.png) | [Tablet](-cdx-operations-tablet-stock.png) |
| Converted Sell | [Mobile](-cdx-operations-mobile-sell.png) | [Tablet](-cdx-operations-tablet-sell.png) |
| Direct receipt | [Mobile](-cdx-operations-mobile-done.png) | [Tablet](-cdx-operations-tablet-done.png) |
| Save failed | [Mobile](-cdx-operations-mobile-done-failed.png) | [Tablet](-cdx-operations-tablet-done-failed.png) |
| Money out | [Mobile](-cdx-operations-mobile-expense-purpose.png) | [Tablet](-cdx-operations-tablet-expense-purpose.png) |
| Money in | [Mobile](-cdx-operations-mobile-money-in-purpose.png) | [Tablet](-cdx-operations-tablet-money-in-purpose.png) |

`-cdx-operations-check.cjs` verifies 500-item paging/search/reload/recount,
untouched stock, zero, reasons, direct receipts, failed-save retry without a
second sale, cash movement balances, Cashier approval, converted prices and
rounded payment. Its 96 layout combinations cover 320/390/768/1024 px in
light/dark/large text. It produces sixteen captures.

The catalog and relevant existing workflow checks are also run; exact results
are recorded in [status.md](status.md). Browser storage is a fictional sandbox,
not proof of native Android durability. Physical scanner/camera, keyboard/insets,
TalkBack, vendor observations, shared-device reconciliation and real services
remain unverified. Figma remains deferred until design review is complete.

The [12 November quiet receipt revision](-cdx-quiet-receipt.md) supersedes the
earlier success heading, status text and return controls shown in this pass.
The receipt now contains its data, one small success check, Share and Print.
Returns are entered from Recent sales.
