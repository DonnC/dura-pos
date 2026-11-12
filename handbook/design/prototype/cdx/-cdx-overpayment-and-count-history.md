# Overpayment, change currency and stock-take refinement

12 November 2026. Design prototype only; all changes are in cdx.

## Checkout

Cash received stays on one screen. USD and ZWG amounts remain visible together.
Exact-payment shortcuts avoid typing. An overpayment reveals an explicit change
currency choice: USD, ZWG or USD + ZWG. Split change asks only for the USD part;
the ZWG remainder is calculated. Saving opens the existing quiet receipt directly.
No extra confirmation or success page has been introduced.

The till must have enough cash in each chosen currency, including cash received
in this sale. The prototype blocks an impossible payout and keeps the entered
amounts so the cashier can change the allocation. It does not model denominations.

The configured example rate is retained with the payment draft. If the shop rate
changes, saving is blocked until the cashier chooses the current rate; the received
amounts remain, and change currency must be checked again. Basket, discount, shop
or signed-in-person changes create a new payment draft. Reload preserves a matching
draft. Conversion uses integer minor units and rounds change once to the selected
currency's cents; any residual remains with the sale. Tiny change that would round
to zero USD cents asks for ZWG instead. The shop's pricing currency stays USD.

The receipt lists received amounts, change amounts and retained rate. Its only
success indicator remains the small green check. The established failure/retry
presentation remains intact.

## Synthesis of the supplied stock-take examples

The seven reference images supplied from Marmalade's mpos-design stock-take folder
were treated as product examples. Dura adopts their useful concepts: progress,
counted-item feedback, explanations for differences, review and completed history.
The visual treatment and interaction are Dura's existing Shop Sign design.

Counting remains the first screen, with search/barcode matching, categories,
counted/not-counted filters, 20 inputs per page and drafts that survive reload.
This avoids an extra landing page and a compulsory modal/save for every item.
Each entered count shows its quantity and signed difference or Matched inline.
Optional item reasons are edited inline. Other includes a typed explanation.
A review-stage reason covers remaining unexplained differences, reducing repetition.
An individually chosen Other must have at least five characters before saving.

Past stock takes is available alongside counting. Completed sessions retain their
original product names, before/count quantities, person, time, untouched total and
reasons. Later stock changes do not rewrite these snapshots. History detail has
Differences / All counted, search and 20-row pages. Empty history remains honest.
History is Owner-only, matching Dura's existing stock-adjustment permission.
It shows the last ten completed counts on this device, not a complete shop journal
or evidence of upload. Starting a new shop clears these prototype records.

## Preview

Open [-cdx-preview.html](-cdx-preview.html) and choose **Overpayment & change**.
Use the Device control for phone, tablet portrait or tablet landscape. The searchable
[-cdx-coverage.html](-cdx-coverage.html) includes exact, missing-choice, split,
insufficient-cash, changed-rate, receipt, count-reason and history examples.

![Phone change currency](-cdx-change-ZWG-phone.png)
![Tablet split change](-cdx-change-split-tablet.png)
![Tablet stock take](-cdx-take-item-reason-tablet.png)
![Phone count history](-cdx-take-history-detail-phone.png)

## Assumptions and remaining review

- USD/ZWG and the shown rate are fictional configured examples, not live rates.
- Change is currency-level cash; denominations and customer agreement are handled
  by the person serving. No automatic payout or exchange-rate lookup is implied.
- Stock adjustments and count history remain Owner-only. Cashier access is unchanged.
- History snapshots are a bounded local design demonstration, not a production
  record schema, sync protocol, migration or restore implementation.
- Cross-currency refunds still require their own allocation design; this pass does
  not imply that existing refund routes can refund every new cash combination.
- Physical phone/tablet, scanner, keyboard insets and TalkBack checks remain open.
  Figma conversion remains deferred until design coverage and review are complete.
