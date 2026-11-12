# State and dialog coverage

11 November 2026 · Current cdx design only. **Figma remains deferred.**

Open [-cdx-coverage.html](-cdx-coverage.html) to search the design, select a
screen/state/dialog and inspect it on mobile, tablet portrait or tablet landscape.
Light, dark and 200% text are available. Device changes resize the same example;
appearance changes reopen its canonical fixture. Every example is fictional.

The inventory contains **98 base screens**, **157 additional state examples**
and **28 dialog examples**. The dialog examples exercise all **20 dialog call
sites** in the scripts actually loaded by the prototype. These are example
counts, not 283 distinct product screens or an enumeration of arbitrary inputs.

[-cdx-state-dialog-inventory.json](-cdx-state-dialog-inventory.json) is the
machine-readable record: screen family, example URL, actual heading, actual
screen after any guard, dialog source location and verification status.
[-cdx-coverage-cases.js](-cdx-coverage-cases.js) owns the explicit fixtures.
The catalog also includes long shop/product names and a large pricing amount.

## Every base route belongs to one journey

| Family | Screens | Coverage and recovery contract |
| --- | ---: | --- |
| Selling | 11 | Shelf, quick item, measured quantities, payment methods, pending answers and saved outcome; current/held baskets remain separate |
| Receipts and returns | 7 | Lookup, original receipt, print, whole/partial returns; linked history and original prices remain visible |
| Till and cash movements | 11 | Float, money in/out, drawer, cash count, variance, handover, lock and person change; restored review needs a fresh check and approval where required |
| Stock | 7 | Search, filters, product movements, delivery, physical count and product edit; empty tracked stock offers Add a product |
| Accounts | 4 | Customer/supplier lists and statements; customer collection is an explicit local review dialog |
| Purchase invoices | 4 | Items/costs, payment, review and saved invoice; absent invoice and empty item list have separate examples |
| Kept change | 6 | Customer activity, checkout, keeping change and cash refund; stale/currency/balance/cash limits stay explicit |
| Reports | 8 | Period/place, sales, drawers and source coverage; missing records never become zero |
| People and access | 10 | Cashier details, permissions, delivery/removal, own access, expiry and supervised recovery; role limits retain unfinished work |
| Connection/replacement | 12 | Account checks, pairing, new-device review, backup checks and lost device; incomplete results remain unconfirmed |
| Optional fiscal | 9 | Setup, receipt queue/status/check, owner review, day close and device recovery; no live fiscal action occurs |
| Shop/start/records/help | 9 | Optional features, records/export/upload explanation, help and first shop/product setup; pricing currency is a deliberate choice |

The checker obtains `Object.keys(screens)` from the running prototype and
requires an exact match with these families. Dependent base screens receive
explicit fixture prerequisites, so a linked review cannot silently show an
unrelated entry screen and be counted as covered. Redirects in the additional
state cases are recorded, because those guards are part of the design.

## State policy across the journeys

| State | Where it is designed | Meaning for local screens |
| --- | --- | --- |
| Default / populated | All base routes; valid dependent-review fixtures | A default entry form can intentionally be blank; it is not a failed load |
| Loading / preparing | Shelf and saved-report read examples; account/backup preparation and pending fiscal results | Local forms do not manufacture a network wait; their saved facts remain available |
| Empty / no result | Shelf, stock/search, no tracked products, invoices/items, receipts/search, kept balance and fiscal filters | A prerequisite-dependent review returns to its entry or safe parent instead of inventing a record |
| Offline | Cash sale, mobile request, invoices/returns, reports, upload status and device recovery examples | Local facts remain editable; a missing remote answer is never shown as success |
| Error | Invalid cash/count/expense input; invoice item/name dialogs; declined access, incompatible/damaged/gapped backup and refused fiscal state | Explain the correction in shop language; no raw provider payload, credential or diagnostic code |
| Disabled | Missing/invalid required input, no balance/cash, no permission, approval/recheck missing, incompatible recovery | Keep the reason in fields, notices or the action label; retain entered work |
| Interrupted | Basket, cash entry, invoices, kept change, returns, cashier settings, filters, recovery/fiscal previews and the four older reviews | Resume allowed data; never restore a PIN or acceptance checkbox; completed operations cannot be replayed |
| Long content | Shop/product names and large cash-sale total at small width; large-text review/dialog matrices | Text wraps, important amounts use a compact treatment, and scrollable content remains reachable |

These are the contracts of the current design, not a claim that every route
must show eight cosmetic variants. A local receipt detail, for example, does
not need an unrelated network spinner; its print problem and unavailable
record are different designed situations. Amounts and quantities retain their
currency/unit labels. A success fixture is always a practice outcome.

## All dialog call sites

| Dialog | Included variants / return path |
| --- | --- |
| Payment from Tariro | Valid collection review; return to account without another sale |
| Fiscal close answer | Same example day; waiting/review/closed choices |
| Ask the owner | Worker receipt issue; no message sent |
| Fiscal support details | Safe reference/mode/state only; back to the issue |
| Purchase-invoice item | Add, edit and invalid quantity/cost |
| Invoice evidence | Attachment preview only; no camera/file access |
| New kept-change contact | Empty form and invalid name; remain in the parent workflow |
| Share receipt | Saved practice copy; no Android share request or message |
| Available printers | No device connected; return to the existing receipt |
| Report refresh | No new figures received; saved view retained |
| Access check | No access update received; previous state retained |
| Sale options | Held sales, history and unfinished-basket actions |
| Basket | Whole packs, measured quantity and last-line removal/empty state |
| Held sales | Empty and populated; resume remains separate from current basket |
| Product scan | Camera/result preview only |
| Profile | Owner and cashier words; lock/till/person routes |
| Choose shop account | Example account selection only |
| Export contents | Chosen format, period and completeness; no file generated |
| Reconnecting device | Explicit received-state example; no real acknowledgement |

Approval PINs for refunds, invoices, money out and recovery are **inline review
fields**, not omitted dialogs. Recheck/consent rows and the tablet order panel
are likewise part of their parent screen. Toasts provide brief feedback and
existing Undo actions; they do not replace a saved receipt or confirmation page.

The checker discovers `showSheet(...)` calls in the active script list and
requires a rendered fixture for every call site. Add/edit/profile/basket/error
variants share call sites but remain separate examples. Each dialog's title,
initial focus and Escape close are checked. The nested Sale options → Held
sales → Escape path also returns keyboard focus to the app. Dialog layouts are
checked at small device, enlarged-text device, dark tablet portrait and tablet
landscape sizes. The native browser supplies Tab containment; TalkBack is not
claimed from that browser behaviour.

Completion views are inventoried separately from routes. The checker discovers
every `result(...)` call site and requires a rendered example, including saved
deliveries/counts, money out, collections, invoices, refunds/returns, handover,
cashier removal and the lost-device request preview. Cash, mobile-money and
account sale outcomes also have separate examples of the existing Done screen.
Balanced/over cash counts, matched stock counts and second-currency count/float
fields are included rather than assuming the shortfall example covers them.

`feedbackCallsites` in the JSON records the source location and expression for
each brief `toast(...)` message: limits, duplicate warnings, preserved work,
pending checks, storage failure and Undo feedback. These are source inventories,
not a claim that every toast condition was rendered by this checker. Existing
workflow checks exercise their practical paths; their conditions remain visible
for the final walkthrough. They use the shared status live region.

## Four older reviews: recovery now included

[-cdx-review-drafts.md](-cdx-review-drafts.md) specifies delivery, stock take,
money out and cash-up. Entry text, review reasons and retained float values
survive reload. Changed underlying records force a fresh review. Approval and
confirmation are requested again. A closed shift retains its saved handover,
and a completed draft cannot apply its stock/money/shift effect twice.

## Coverage gates before Figma

1. Keep the route, preview-option and dialog-source checks green whenever a
   screen, state or overlay changes. Review the linked examples, including
   scrolled content, rather than relying only on screenshots above the fold.
2. Complete a final journey walkthrough as owner and cashier, including long
   content, missing prerequisites, keyboard/focus and interrupted saves.
   The browser walkthrough and its closed continuity gaps are recorded in
   [-cdx-final-walkthrough.md](-cdx-final-walkthrough.md); physical checks remain open.
3. Physical Android keyboard/insets, TalkBack and vendor observations remain
   unverified. Browser fixtures do not prove real-service recovery or usability.
4. Resolve any design gaps found by that review before creating the Figma
   handoff. Then map every approved example, component, token and asset into
   Figma and compare its actual renders. No conversion is started in this pass.

This inventory accounts for the current executable prototype. It does not turn
future roadmap features into designed screens or prove that the Flutter app
implements them. Real OAuth, camera, Bluetooth, payment, upload, restore and
fiscal integrations remain outside this HTML design task.

## Checks and ownership

[-cdx-coverage-check.cjs](-cdx-coverage-check.cjs) generates the inventory and
review browser after successful route/state/dialog checks. It additionally
checks that every recovery and fiscal option exposed by the main preview has
a case. A missing mapping or new unrepresented dialog fails the check.
[-cdx-review-drafts-check.cjs](-cdx-review-drafts-check.cjs) exercises recovery,
stale context, fresh approval, handover, no replay and responsive captures.
[status.md](status.md) records the exact completed validation and next task.

All examples are isolated fictional snapshots. They are not one complete shop
ledger, real backup, live receipt or proof of production accounting. Generated
JSON/HTML are design-review artifacts; no production schema, journal, workbook,
migration or cross-device restore format changes. Base fixtures reset with
`fresh=1`; authored drafts use the existing bounded practice-browser state.

## Language, roles and new detail views

The current catalog also enforces Owner / Cashier / Device and Stock / Stock take
in visible copy. It includes compact account/practice headers, Owner/Cashier
discount approval, applied-discount basket/payment/receipt, detailed owner graphs
and denied-cashier report routes. Technical IDs remain unchanged. See
[-cdx-language-roles.md](-cdx-language-roles.md),
[-cdx-discounts.md](-cdx-discounts.md) and
[-cdx-owner-report-details.md](-cdx-owner-report-details.md).

The operations pass adds the 500-item stock-take example, progress/recount and
difference review, converted Sell prices, a failed-save receipt preview and
money-in approval/completion. The currency selector has its own dialog example.
Sale completion now is the receipt preview itself, rather than an intermediate
success screen. See [-cdx-stocktake-and-checkout.md](-cdx-stocktake-and-checkout.md).
