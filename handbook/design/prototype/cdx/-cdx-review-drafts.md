# Older review drafts, completed

11 November 2026 · HTML design only · Shop Sign identity unchanged.

Delivery, stock count, money out and cash-up now keep unfinished entry text and
review details on the current practice phone. A reload no longer forces the
owner or cashier to type those values again. No stock, cash or shift change
occurs until the final save action.

## Four journeys

| Journey | Kept while unfinished | Fresh check after reload | Completion |
| --- | --- | --- | --- |
| Delivery | Product, selling-pack quantity, supplier and delivery reference | Compare with the delivered packs; confirm restored entries | Stock changes once; draft clears |
| Stock count | Counted products, including zero; difference reason | Compare against current recorded stock; confirm entries | Corrections save once; original movements remain |
| Money out | Reason, amount and explanation | Check expected cash, confirm entries and enter owner approval again | Cash/debt changes once; PIN is never retained |
| Cash-up | Each currency's count, difference explanation and retained floats | Check current drawer figures and confirm entries | Shift closes once; handover remains available after reload |

The restored notice sits above the figures; the confirmation follows the
details in reading order. **Check restored entries below** explains why the
final action is unavailable. Fresh sessions retain the existing short workflow.
**Start this draft again** clears only that unfinished draft and its fields.
It does not remove a saved delivery, payment, count or closed shift.

Changed records send the user back to entry with the typed values retained and
a plain explanation. The next review uses current figures. A missing or already
completed draft offers entry and asks the user to check saved records first;
it does not recreate a save. An already closed shift offers its saved handover,
and opening a new shift clears the previous handover preview.

## Scope and storage assumptions

- At most one draft per journey, four total, for the current shop, role, seller
  and pricing currency. Another context does not display or reuse those values.
- Entry strings may be incomplete or invalid. They remain editable, with the
  normal validation; an invalid draft cannot become a review/save action.
- Delivery/count freshness compares product identities, quantities and units.
  Money-out freshness compares drawer and supplier balances. Cash-up also
  checks shift state, sales, current basket and held baskets.
- No invented time-to-expiry. A restored physical count always needs a fresh
  check; the stored number is not evidence that the drawer/shelf is unchanged.
- Approval PINs, confirmation checkboxes and owner authorisation are never
  persisted. These are design examples, not production access controls.
- `s.lastHandover` retains one closed-shift summary, with the expected cash from
  that close. Later viewing does not recompute the old difference from new cash.

The optional `s.reviewDrafts` shape is a bounded object keyed by `receive`,
`stock`, `expense` and `cashup`. Each entry has `scope`, a comparison `baseline`,
`stage` and an allowlisted `fields` object. Strings are limited to 160 characters;
stock fields are bounded by the existing 40-product practice limit. Example:

```json
{
  "receive": {
    "scope": "practice shop / owner / Chipo / USD",
    "baseline": "comparison of this phone's tracked products",
    "stage": "review",
    "fields": {
      "receive-product": "bread",
      "receive-qty": "6",
      "receive-supplier": "mambo",
      "delivery-ref": "DEL-012"
    }
  }
}
```

The readable scope/baseline above illustrate their purpose; the actual values
are JSON comparison strings. No journal, workbook or production schema changes.
Older practice sessions without these optional fields still open. Resetting or
starting a new practice shop clears them. Shop-record restore examples do not
import these drafts across phones. Browser reload is not proof of native Android
process recovery, hardware storage reliability or integration behaviour.

## Review captures

| Review | Phone | Tablet |
| --- | --- | --- |
| Delivery | [Phone](-cdx-phone-receive-draft.png) | [Tablet](-cdx-tablet-receive-draft.png) |
| Stock count | [Phone](-cdx-phone-stock-count-draft.png) | [Tablet](-cdx-tablet-stock-count-draft.png) |
| Money out | [Phone](-cdx-phone-expense-draft.png) | [Tablet](-cdx-tablet-expense-draft.png) |
| Cash-up | [Phone](-cdx-phone-cashup-draft.png) | [Tablet](-cdx-tablet-cashup-draft.png) |

[-cdx-review-drafts-check.cjs](-cdx-review-drafts-check.cjs) exercises real entry,
review, reload, reapproval and save paths, including zero/invalid/partial input,
changed balances, currency scope and duplicate prevention. Its restored-review
matrix covers 320/390/768/1024 px, light/dark/200% text; captures show two browser
viewports. Completion evidence is in [status.md](status.md).
