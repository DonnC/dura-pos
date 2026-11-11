# Kept change / CDX

10 November 2026. Design sandbox only: no app, backend or production records
change. The existing Shop Sign identity and four main destinations remain.

## Everyday journeys

| Screen | Purpose / main action | Recovery |
|---|---|---|
| Kept change customers | Money → Kept change; choose whose change is kept here | Zero balances remain explicit; feature-off screen links to owner preferences or selling |
| Customer balance | Amount the shop owes, opening balance and movements; use with basket or start sale | Cash checkout stays available when the balance cannot be used |
| Use at checkout | Choose customer, use some/all change, enter cash for the rest; save sale | Limit use to the balance and sale total; explain short cash; return to ordinary cash checkout |
| Keep new change | From cash checkout; name customer and get agreement; save sale and keep change | Give the change instead, add a customer, or correct an over-limit balance |
| Give cash back | Choose some/all of the customer's kept change; review cash back | Explain missing balance or insufficient drawer cash; Back preserves amount |
| Approve cash back | Show person, cash out and remaining balance; owner approves and saves | No posting without the practice PIN; Back returns to the amount |
| Confirmation / receipt | Show cash, kept amount and remaining customer balance separately | Next customer, saved receipt or customer history; repeat save is guarded |

Use the preview board's **Use & return kept change** journey and Device picker.
Direct `kept=sample` links load fictional balances (Tariro 1.50, Kuda 0.50 in
the selected pricing currency). Ordinary old sessions begin with zero kept
change. The feature stays off until enabled by the owner.

On tablets of at least 900 CSS px, the form and the payment/approval summary
sit side by side. Devices and enlarged text use one column with the main action
fixed below the scrollable content. Amounts keep their currency labels.

## Reconciliation examples

These USD figures are sample data, not a currency default:

- **Use some:** sale USD 3.50, kept change used USD 1.00, new cash USD 2.50.
  Tariro's USD 1.50 becomes USD 0.50. Till cash 70.50 → 73.00, sales
  86.50 → 90.00. Stock is reduced once for the sale.
- **Use all the payment:** one loaf USD 1.00 paid from Tariro's kept change.
  No new cash enters. Balance 1.50 → 0.50; sales increase by 1.00.
- **Overpay the remainder:** sale USD 3.50 less USD 1.50 kept change leaves
  USD 2.00 cash needed. Receiving USD 2.50 means give USD 0.50 change.
  Till cash rises by USD 2.00, not USD 2.50.
- **Keep new change:** sale USD 3.50, cash USD 5.00, USD 1.50 kept for Kuda
  with agreement. Balance 0.50 → 2.00. Till cash 70.50 → 75.50, but sales
  still increase by only USD 3.50.
- **Give cash back:** Rudo gives Tariro USD 0.50 after approval. Balance
  1.50 → 1.00; worker till cash 20.50 → 20.00. Sales and stock stay unchanged.

Money, the day summary and cash-up show kept change owed separately. The notes
explicitly say to count its physical cash once; the debt is not extra sales.

## Decisions and assumptions

- **Till-local, same currency:** use/refund is limited to this device's kept
  balance in the current pricing currency. The `kept=stale` design state blocks
  use/refund and offers cash selling. This does not solve multi-device races or
  prove that a live shared balance is current. Cross-till and cross-currency
  use require a separate design slice.
- **Cashier access:** a cashier may use change at checkout and request a payout.
  Every cash payout requires the owner's existing practice PIN. This previews
  a conservative permission choice; it does not implement authorisation.
- **Optional feature and limits:** the example limit is 2.00 in the displayed
  currency, and the owner can change it in practice preferences. This is sample
  policy, not a proposed safe limit for every currency. Outstanding balances
  prevent switching the feature off. Balances have no expiry.
- **Customer agreement:** keeping new change requires a checkbox after choosing
  the person. Changing the person clears that agreement. This slice keeps all
  of the cash-sale change; splitting between change given and kept is future
  work. There is no arbitrary top-up or transfer facility.
- **Customer identification:** existing practice names or a quick-added name /
  device are supported. Duplicate names are rejected in this small example.
  Real identification, ambiguity, shared numbers and privacy need validation.
- **Sales returns are separate:** a kept-change cash payout is not a returned
  sale. Selected-item returns now preserve the original cash/kept split and restore
  kept change rather than converting it to cash. See
  [-cdx-quantity-returns.md](-cdx-quantity-returns.md) for this later design slice,
  its rounding choices and same-till limits.
- **No provider, fiscal or sharing claims:** records are fictional and saved
  only in browser storage. No SMS, WhatsApp, payment transfer or fiscal result
  is generated. Fiscal payment classification remains unresolved here.

## States and browser storage

There is no fabricated loading or upload success: all balances are local.
Zero balances, disabled feature, short cash, invalid/over-limit amounts,
unavailable balance, closed till and approval requirements have explicit
messages and a recovery route. Offline ordinary cash selling stays available;
the sample local balance can be used without pretending it is shop-wide.

Checkout input and refund amounts persist after input in browser storage.
Changing the basket invalidates the checkout draft; saving a sale clears it.
Agreement and owner PIN are not persisted. A refund review must be approved
again after reopening. An unfinished new-customer editor is not persisted.
The cash received on the separate keep-new-change page follows the existing
cash-checkout behaviour and must be re-entered after a page reload.

Optional `kept`, `keptSelected`, `keptCheckout` and `keptRefund` fields extend
only the existing fictional browser state. The prototype has at most 12
contacts and 40 movements per contact; older movements roll into the opening
balance without erasing the current balance. Reset/new-shop setup clears them.
These bounds are not a production retention, migration or restore policy.
There are no journal, workbook, Flutter or backend schema changes.

## Checks and captures

`-cdx-kept-check.cjs` exercises cash/debt/stock outcomes, partial/full use,
overpayment, cap and agreement, draft recovery, refund approval, insufficient
cash, stale recovery and feature visibility. It also renders owner and cashier
layouts at 320, 390, 768 and 1024 CSS px in light/dark and 200% text.

Device and tablet captures are named `-cdx-kept-{phone|tablet}-{screen}.png`,
for account, checkout, keep, refund and refund-review. Examples:

- [Device checkout](-cdx-kept-phone-checkout.png) / [tablet checkout](-cdx-kept-tablet-checkout.png).
- [Device cash-back review](-cdx-kept-phone-refund-review.png) / [tablet cash-back review](-cdx-kept-tablet-refund-review.png).
- [Device keeping change](-cdx-kept-phone-keep.png) / [tablet keeping change](-cdx-kept-tablet-keep.png).

Final results are in
[status.md](status.md). Browser viewports are not physical-device, keyboard,
TalkBack or vendor usability testing.
