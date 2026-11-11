# Weighed quantities and partial returns / CDX

10 November 2026. Interactive design only, inside `cdx`. No Flutter, backend,
workbook or production journal changes.

## Screens

Open the preview board and choose **Weigh & return items**, then a phone or
tablet in Device. The board explicitly loads fictional examples.

| Screen | Purpose and main action | Recovery |
|---|---|---|
| How much rice? | kg/g entry, quick weights, price per kg and line total; add/update basket | Invalid precision explains the limit; unit changes preserve weight; remove with Undo |
| Basket / receipt | Show measured quantity and rounded line total alongside ordinary packs | Edit weighed quantity directly; held baskets preserve base quantities |
| What came back? | Quantity and sellable/damaged status per original item; review return | Blank means no return; explain remaining quantity, missing reason, currency or till-cash limits |
| Check the return | Original prices, selected stock effects and cash/kept split; approve/save | Back preserves the draft; revalidate on save; no posting without owner PIN |
| Return saved / original receipt | Explicit cash to give and kept change restored; view linked receipt | Original sale is unchanged; remaining quantities limit subsequent returns |

Phones use one scrolling column and a fixed action. The review action shows
the calculated refund or explains the next input needed. Tablets at 900 CSS px
place entry/returned items beside the amount summary and approval. Enlarged
text returns to one column.

## Fictional sample data

- Loose rice: USD 2.40 per kg; stock on this phone 25 kg.
- 0.375 kg / 375 g costs USD 0.90. A USD 1.00 payment gives USD 0.10 change.
- Returning 0.125 kg refunds USD 0.30. If sellable, it restores 125 g; 250 g
  from the sale remains returnable. Returning those 250 g as damaged refunds
  USD 0.60 without putting it back on the shelf.
- The board's separate receipt contains two loaves (USD 2.00) and 0.750 kg
  rice (USD 1.80). Returning one loaf and 0.250 kg gives USD 1.60 back. The
  sample marks the loaf unsellable and the rice sellable so both stock effects
  are visible. This receipt is part of the fictional seeded day, not an extra
  new sale added to that day's aggregate.

## Decisions / assumptions

- **Manual weight, kg/g only:** this slice uses one example measured product.
  Whole packs stay whole. No Bluetooth scale or barcode weight parsing is
  implied. Measured-product setup, litres/metres and arbitrary precision are
  future design work. A normal catalogue with no weighed product has an empty
  state, rather than inventing a product.
- **Precision:** 1 g increments, up to 99.999 kg per line. The preset weights
  are 250 g, 500 g and 1 kg. Sale totals round half up once per line to the
  currency's minor unit; the sample currencies use two decimal places.
- **Original prices:** a return uses the original saved line amount, unit and
  quantity. Current catalogue price changes do not change its refund. The
  maximum is what remains from that receipt, including previous returns.
- **Rounding across returns:** each line's cumulative returned quantity
  determines the cumulative refundable cents. A new return gets the difference
  from previous refunds. For a one-cent line split into three equal returns,
  the refunds are 0, 1 and 0 cents, not three cents. Zero-cent returns can still
  record stock disposition after approval; they do not create cash.
- **Payment split:** cash/kept-change refunds follow the original payment
  proportions, with cumulative rounding. A USD 1.00 return from a USD 3.50 sale
  originally paid with USD 1.50 kept change and USD 2.00 cash restores USD 0.43
  kept change and pays USD 0.57 cash. Later returns resolve the remaining cents
  so a full return restores exactly USD 1.50 and USD 2.00.
- **Keeping new change is separate:** change retained from an original cash
  sale remains owed to the customer when goods are returned. The refund pays
  for the returned goods only. Giving that kept change back remains a separate
  approved payout.
- **Restoring kept change:** require the original same-currency customer
  balance on this phone. New receipts keep its contact ID; an old receipt's
  name is accepted only when it matches one contact. Missing, ambiguous or
  unavailable balances block the return with an explanation. Restoring money
  already owed may exceed the new-change cap; it is not rejected or converted
  into cash. It makes the kept-change feature visible again if previously off.
- **Approval and condition:** all selected returns require the existing
  practice owner PIN. A seller requests the return for their own receipt;
  the owner can view this phone's receipts. Restocking is off by default and
  selected separately per line. Damaged goods never go back into sellable
  stock automatically.
- **Scope limits:** same pricing currency and this phone's cash/kept receipts
  only. Provider, account and multi-currency refunds, discounts, tax allocation,
  exchanges, cross-phone return locking and fiscal credit notes remain separate
  work. Local checks are not proof against two phones refunding the same sale.
- **Stock setup:** the existing whole-pack receiving, buying and counting
  screens exclude measured products. This avoids treating grams as packs while
  their own receiving/count journeys are still undesigned. Measured stock and
  movements display kg; the existing practice low threshold is four displayed
  units (four kg in this example), not a production reorder recommendation.

## States and storage effects

Everything in the prototype is local; there is no invented upload, provider or
fiscal success. Offline cash selling remains available. Invalid/empty weights,
wrong precision, invalid whole-pack fractions, fully returned lines, insufficient
cash, missing receipts, inaccessible seller receipts and unavailable kept
balances have an explanation and a next step.

Optional product `scale` / `measure` fields distinguish integer grams from
existing whole-pack counts. Existing products/baskets retain their original
integers. `lineTotal` snapshots preserve original rounded cents. These changes
are only to fictional browser data, not a production migration contract.

`quantityDraft` and one `returnDraft` persist after input. Resize does not rebuild
typed fields. Back retains the active draft; choosing a different receipt starts
its own return draft. The PIN is not saved. A reload needs approval again.

`returnTotals` preserves cumulative quantities and refunded cents for each
retained receipt; `partialReturns` holds up to 30 readable linked corrections.
Metadata is pruned only with the existing bounded receipt history; reset/new
shop clears it. Original receipt objects are never rewritten. Old whole-return
markers are still recognised, and an earlier partial return routes the legacy
whole-return entry back through remaining-quantity checks. These browser bounds
are not a production retention or restore policy.

## Verification and captures

`-cdx-quantity-returns-check.cjs` checks conversion, precision, integer money,
sale/return cash and stock, damaged stock, repeated returns, unchanged receipts,
kept/cash restoration, draft recovery, shortages and cumulative rounding.
It renders owner/seller screens at 320, 390, 768 and 1024 CSS px in light/dark
and 200% text: 72 combinations.

- [Phone quantity](-cdx-phone-quantity.png) / [tablet quantity](-cdx-tablet-quantity.png).
- [Phone item selection](-cdx-phone-return-items.png) / [tablet selection](-cdx-tablet-return-items.png).
- [Phone review](-cdx-phone-return-review.png) / [tablet review](-cdx-tablet-return-review.png).
- [Tablet cash and kept-change review](-cdx-tablet-return-kept-review.png).

Final results are in [status.md](status.md). Browser layout and interaction
checks are not physical scale, device/keyboard, TalkBack or vendor usability
verification.
