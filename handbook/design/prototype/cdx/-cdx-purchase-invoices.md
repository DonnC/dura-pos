# Supplier purchase invoices / CDX

10 November 2026. Interactive design only. Nothing here implements Flutter,
uploads a file or sends a supplier payment.

## Journey

Enter from Money → Suppliers → Mambo Wholesale → Add purchase invoice.
The preview board also has a **Receive an invoice** journey with fictional
sample entries, and a device selector for actual browser viewport resizing.

| Screen | Purpose and main action | Recovery |
|---|---|---|
| Items received | Reference, selling packs and buying cost; continue to payment | Empty explanation, edit/remove item, validated quantities and costs |
| Payment | Pay later, in full or in part; review invoice | Explain insufficient till cash, keep entered values, skip evidence |
| Review | Show stock additions, cash out and balance separately; save once | Back keeps the draft; duplicate reference stays unsaved with explanation |
| Saved invoice | Read the original costs and payment; open supplier statement | Empty invoice history offers a new invoice |

The tablet places the payment summary alongside the form and review amounts
alongside received items. Devices use a single scrollable column and fixed main
action. At 200% text, forms return to a single column. The invoice flow hides
main navigation; Back leads to the previous step or supplier account.

## Practice example and reconciliation

The board's populated example is explicitly loaded with `invoice=sample`:

- Six loaves × USD 0.70 = USD 4.20.
- Six milk cartons × USD 1.10 = USD 6.60.
- Invoice total: USD 10.80; cash paid now: USD 5.00; remaining: USD 5.80.
- Opening supplier balance USD 20.00 becomes USD 25.80.
- Opening till cash USD 70.50 becomes USD 65.50.
- Bread stock 18 → 24 loaves; milk 12 → 18 cartons.
- Sales and selling prices stay unchanged.

The interaction check separately enters six loaves and USD 2.00 paid, producing
USD 2.20 new debt. It also checks paying later with insufficient cash, duplicate
prevention, editing, evidence examples, draft recovery and owner access.

## Decisions and assumptions

- One known supplier is used, matching the existing sandbox. Supplier creation
  and supplier selection are a later design slice.
- This is a **new delivery**, not an invoice against an earlier stock receipt.
  The quantity-only Receive stock route remains separate. Linking an existing
  receipt to an invoice is still needed before a production implementation.
- Whole selling packs only. Prices are final buying costs per pack in the
  shop's chosen currency. Tax, freight, discounts, supplier credits and foreign
  currency settlement have no separate controls in this slice. This is not a
  complete purchasing or tax workflow.
- A reference is required; an owner can enter their own reference when the
  supplier has no printed number. Duplicate checks apply only to the retained
  invoices for this practice supplier on this browser.
- Only cash from this till is modelled. Cash out requires the existing practice
  owner PIN; paying later does not. No external transfer is initiated.
- Due date and evidence are optional. Missing dates stay unknown. Fully paid
  invoices hide the due-date field.
- The evidence picker demonstrates photo/PDF entry with a labelled fictional
  example. It stores no actual file. Camera permissions, failed captures,
  file limits, upload recovery and real previews remain unimplemented.
- Saved invoice payment amounts are historical, as recorded at purchase.
  Later supplier payments are shown on the account statement; they are not
  allocated to individual invoices. Due dates do not claim overdue balances.
- Draft fields persist in browser storage after input. An unfinished item
  editor is not persisted until Add/Save item. This browser exercise does not
  prove crash safety, atomic posting or real authorisation.

## States and storage effects

The form is local: there is no fabricated loading spinner or upload success.
Offline status uses the existing banner and does not disable the invoice.
Empty invoices, invalid inputs, insufficient cash, duplicate references and
cashier access denial each have an explanation and a recovery route.

Optional `invoiceDraft` and `invoices` fields extend only the existing fictional
browser state. Old practice sessions start with no invoices; no migration is
needed. At most 12 lines are allowed per draft and 20 saved invoices are retained.
Existing account movements and stock-movement limits remain in force. Resetting
the practice day clears these fields with the rest of the sandbox. Retention
is not an accounting policy or a production restore contract. No production
journal, workbook, backend schema or app code changes.

## Review

Run `-cdx-invoice-check.cjs` with Playwright/Edge available. It captures:

- [-cdx-invoice-device-items.png](-cdx-invoice-phone-items.png)
- [-cdx-invoice-device-payment.png](-cdx-invoice-phone-payment.png)
- [-cdx-invoice-device-review.png](-cdx-invoice-phone-review.png)
- [-cdx-invoice-tablet-items.png](-cdx-invoice-tablet-items.png)
- [-cdx-invoice-tablet-payment.png](-cdx-invoice-tablet-payment.png)
- [-cdx-invoice-tablet-review.png](-cdx-invoice-tablet-review.png)

Mobile/tablet browser captures are not physical-device, keyboard, TalkBack or
vendor usability testing. Full check results and the next task are in
[status.md](status.md).
