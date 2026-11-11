# Final Owner / Cashier browser walkthrough

11 November 2026 · Design only · Figma handoff remains deferred.

This reviews the current executable catalog, including the joins between tasks.
It is a browser design review, not vendor research, Android verification or proof
that these features exist in Flutter. The four navigation positions and approved
Shop Sign identity are unchanged.

## Daily-work review

| Task | Owner view | Cashier view | Recovery checked |
| --- | --- | --- | --- |
| Open and sell | Own shift and shop | Own shift and basket | Zero float, missing products, invalid cash, lock and reload |
| Hold and hand over | Close own drawer; switch person | Close own drawer; switch person | Approved discounts remain with an unchanged auto-held basket |
| Take payment | Enabled methods | Permitted methods | Pending payment stays separate from the next customer |
| Discount and return | Apply with a reason | Ask owner to approve | Original net price, fractional quantities and previous returns |
| Stock | Receive, edit and Stock take | View quantities; ask owner for changes | Zero counts, restored reviews and changed records |
| Suppliers and kept change | Invoices and balances | Permitted kept-change tasks | Invoice review, consent, currency and balance limits |
| Cash up | Own drawer and business context | Own drawer | Short/over counts, retained float and saved handover |
| Reports and settings | Business reports, people and devices | Own access and saved-work status | Owner-only routes remain guarded without clearing the basket |
| Connection and optional fiscal status | Setup and issue review | Permitted status | Existing incomplete/offline/recovery catalog states |

## Gaps found and closed

| Impact | Finding | Result |
| --- | --- | --- |
| High | Reopening after a person switch could select the initial role | Plain reopening restores the saved signed-in Owner/Cashier and their drawer. Explicit preview role links still select their fixture. |
| High | Closing with an unfinished discounted basket lost its approval metadata | Automatic hold carries the approved discount into handover and resume, like an explicit Hold sale. Changed quantities/prices still invalidate it. |
| High | A pending payment could use newer shelf prices when saved | The request retains its item/price/discount quote. A confirmed example uses that quote for the receipt and recorded amount. |
| High | Finishing a pending payment could disturb the next customer's tender or discount | Their basket, discounts, cash entry and kept-change draft remain separate. The completion action says Return to current sale when one is waiting. |
| Medium | Retrying a failed payment after prices changed did not explain the new total | The payment screen shows the previous requested amount and asks for a check of the current total. An unchanged discount remains approved. |
| Medium | Older preview requests lacked the item quote needed for an honest receipt | Keep the reference, ask the owner to review and return to selling. No receipt is invented and no second collection is requested. |

The three original continuity scenarios were first observed failing for the
intended reasons: wrong role after reload, USD 3.50 instead of USD 3.30 after
handover, and USD 3.90 instead of the requested USD 3.30 on confirmation.
Their focused checks now exercise the complete paths rather than only isolated
screen fixtures.

## New review examples

The existing routes gain six examples; no new destination or navigation level
is introduced. Search their IDs in [-cdx-coverage.html](-cdx-coverage.html).

| Example | Mobile | Tablet |
| --- | --- | --- |
| Pending item quote | [Mobile](-cdx-mobile-pending-quote.png) | [Tablet](-cdx-tablet-pending-quote.png) |
| Another customer waiting | [Mobile](-cdx-mobile-pending-next-customer.png) | [Tablet](-cdx-tablet-pending-next-customer.png) |
| Changed-price recovery | [Mobile](-cdx-mobile-payment-price-recovery.png) | [Tablet](-cdx-tablet-payment-price-recovery.png) |
| Saved payment / return to sale | [Mobile](-cdx-mobile-pending-saved-current.png) | [Tablet](-cdx-tablet-pending-saved-current.png) |
| Discounted shift handover | [Mobile](-cdx-mobile-discounted-handover.png) | [Tablet](-cdx-tablet-discounted-handover.png) |
| Older request missing detail | [Mobile](-cdx-mobile-pending-missing-detail.png) | [Tablet](-cdx-tablet-pending-missing-detail.png) |

## Fictional state sample and compatibility

A pending request optionally retains a `quote` alongside its existing reference,
basket and amount. For example, bread at USD 1.00 × 2 with USD 0.20 off has a saved
line total of USD 1.80; milk adds USD 1.50; the requested amount is USD 3.30.
The quote includes currency, requesting cashier, item quantities, original/net
prices, reason and approver. Current-customer drafts are separate. There are at
most three pending requests and three held baskets, each with at most the bounded
40-product preview catalog. No PIN is saved.

These optional fields live only in the existing fictional browser sandbox. Old
undiscounted held baskets still work. An older pending request without a quote
stays pending for review rather than being reconstructed at today's prices.
No production journal, workbook, schema, migration or cross-device restore format
changes. Browser storage is not a production Android recovery implementation.

## Evidence and remaining gates

[-cdx-walkthrough-check.cjs](-cdx-walkthrough-check.cjs) exercises signed-in reload,
discounted cash-up/handover, quoted-price confirmation after a shelf change,
next-customer draft recovery, duplicate completion and failed/older requests.
It also checks the six examples at 320/390/768/1024 px, light/dark/large text,
including their intended amounts, and produces twelve captures.
Exact results and regression checks are recorded in [status.md](status.md).

Physical Android keyboard/insets, TalkBack, vendor observation, real payment and
service recovery remain unverified. The owner still needs to review the finished
catalog and assumptions before Figma. No conversion, import package, account
connection or upload was created in this pass.
