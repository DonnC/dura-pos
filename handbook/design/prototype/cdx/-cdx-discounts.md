# Product-line discounts

11 November 2026 · Design only. No Flutter, backend or production record change.

A discount belongs to a product line in the current sale. It does not edit the
shelf price. Open the basket, choose **Discount** beside the product, enter a
percentage or an amount off that whole line, and give a short reason. Review
the original line, discount and resulting price before applying it.

| View | What it shows |
| --- | --- |
| Sell | Shelf price stays visible; an affected product says Discount in basket |
| Basket | Discount/Edit discount per line; original subtotal and total discount |
| Review | Original line, discount, after-discount amount and reason |
| Payment | Payable total, before-discount subtotal, discounts, cash and change |
| Receipt | Original unit price/line, discount included, subtotal, total discount and amount paid |
| Return | Refund uses the saved after-discount line amount and original quantities |

For two loaves at USD 1.00 each, a 10% line discount is USD 0.20. The bread line
is USD 1.80. Add milk at USD 1.50: the sale is USD 3.30, and USD 5.00 cash gives
USD 1.70 change. Returning one loaf refunds USD 0.90, not today's shelf price.
The focused check exercises that exact sequence.

## Role and recovery decisions

- An Owner can apply a manual discount with a reason.
- A Cashier requests owner approval in the review. The preview uses Chipo as
  the fictional approver. Approval PINs are never stored or restored.
- All cashier manual discounts require approval in this pass. No arbitrary
  percentage allowance is silently chosen as the business's real policy.
- One manual discount per line; an edit replaces it. There is no stacking,
  automatic promotion engine, coupon or free-item flow in this design slice.
- The discount must be positive and smaller than the original line amount.
  Invalid input stays editable and cannot advance to Apply.
- Quantity/unit-price changes clear the affected manual discount. A held sale
  retains its approved unchanged lines. Its applied discount remains part of the
  quote even when another cashier resumes that unchanged sale on this till.
- A pending edit retains its selected product, type/value and reason. Its scope
  includes the person and currency. A new approval is required after reload.
- Applying/removing a discount invalidates old cash/kept-change entry drafts so
  they cannot silently use an earlier payable amount. Nothing is paid by Apply.

## Exact amounts and original-price returns

The preview calculates in integer minor units and rounds once per line.
Percentages allow up to two decimals. A fixed amount is off the entire line,
not an ambiguous amount per pack. Measured products use their existing base-unit
quantity and rounding rule. Original product prices remain unchanged.

Saved item snapshots add optional original-line amount, discount amount/type/
value, reason and approver fields. The saved sale adds its original subtotal and
total discount. Partial returns use the existing cumulative original-line
allocation, so rounding cannot refund more than the original paid line total.
Old receipts with none of these fields still display and return as before.

This is optional bounded browser state: at most one applied discount for each
current basket product, plus one unfinished edit. Held baskets carry the same
bounded discount metadata. Completion/reset clears current-basket discounts;
new practice-shop setup clears the draft. No production journal/workbook schema,
migration, fiscal tax calculation or cross-device restore format is changed.
Supplier discounts and accounting/tax treatment are separate design work.

## Captures and validation

| View | Mobile | Tablet |
| --- | --- | --- |
| Cashier approval | [Mobile](-cdx-phone-discount-approval.png) | [Tablet](-cdx-tablet-discount-approval.png) |
| Payment | [Mobile](-cdx-phone-discount-payment.png) | [Tablet](-cdx-tablet-discount-payment.png) |
| Receipt | [Mobile](-cdx-phone-discount-receipt.png) | [Tablet](-cdx-tablet-discount-receipt.png) |

[-cdx-discounts-check.cjs](-cdx-discounts-check.cjs) checks approval, reload,
unchanged shelf prices, held/changed quantities, validation, payment, receipts
and the USD 0.90 return. It also checks that a 750 g line at USD 2.40/kg with
10% off costs USD 1.62, and returning 250 g refunds USD 0.54. Its 24 review
layouts cover Owner/Cashier at four widths
in light/dark/large text. The catalog includes applied-basket, payment and receipt
examples as well as entry/review. Live credentials and services are not involved.
