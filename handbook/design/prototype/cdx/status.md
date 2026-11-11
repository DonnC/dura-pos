# Dura / CDX design status

Updated: 11 November 2026. This is a design prototype, not the Flutter app.
Current scope: work only in this folder. Do not change app/backend code.

## Covered

- [x] Approved B / Shop Sign identity, charcoal, chalk and sign red.
- [x] Phone owner/seller journeys: selling, payment, receipts and full returns.
- [x] Opening float, lock, cash-up differences and handover.
- [x] Stock receipts/counts, expenses and basic customer/supplier balances.
- [x] Practice-only onboarding, staff access and connection/export previews.
- [x] Phone light/dark/enlarged-text renders and workflow checks.

## Completed — this pass

- [x] Device preview controls: phone, tablet portrait and tablet landscape.
- [x] Responsive tablet workspaces, including a persistent editable Sell basket.
- [x] More useful Stock: search, low/out-of-stock filters and movement detail.
- [x] More useful receipts: search, payment/return filters and empty recovery.
- [x] Customer/supplier statements with explicit balance movements.
- [x] Phone/tablet interaction, resize and visual verification; refreshed captures.

## Completed — supplier purchase invoices

- [x] Items received and purchase costs.
- [x] Payment, due date and optional evidence.
- [x] Review, saved detail and statement links.
- [x] Phone/tablet captures and interaction/layout verification.

## Completed — kept change

- [x] Customer balance and activity screens.
- [x] Use kept change at checkout, with cash for the rest.
- [x] Keep new change with customer agreement.
- [x] Approved cash refund and confirmation.
- [x] Phone/tablet interaction, layouts, captures and assumptions.
- [x] Final existing-screen regression run.

## Completed — quantities and partial returns

- [x] Weighed quantity entry, units and basket/receipt totals.
- [x] Select returned quantities and stock condition per item.
- [x] Original-payment refund split, approval and linked history.
- [x] Draft recovery and limits after previous returns.
- [x] Phone/tablet renders, interactions and assumptions.
- [x] Final existing-screen regression run.

## Completed — staff access

- [x] Seller permissions and allowed-phone review.
- [x] Remove access with honest per-phone delivery states.
- [x] Seller offline access, owner check and supervised recovery.
- [x] Phone/tablet captures, interactions and assumptions.
- [x] Final existing-screen regression run.

## Completed — period and location reports

- [x] Period/place filters and honest sales overview.
- [x] Sales/returns breakdown and known profit.
- [x] Drawer snapshots with separate currencies and timestamps.
- [x] Source coverage, missing data and custom-period recovery.
- [x] Phone/tablet captures, checks and assumptions.
- [x] Final existing-screen regression checks and board-capture recovery.

## Completed — connection, pairing and restore

- [x] Owner connection checklist and recovery states.
- [x] Pairing / new-phone shop confirmation and code recovery.
- [x] Replacement-phone restore review and lost-phone follow-up.
- [x] Preserved local work and mismatched/incomplete backup guards.
- [x] Phone/tablet captures, interaction checks and assumptions.
- [x] Final existing-screen regression and capture review.

## Completed — optional fiscal status and recovery

- [x] Test setup and clear saved/submitted/accepted status.
- [x] Receipt queue, unknown result and owner issue review.
- [x] Fiscal-day close, waiting and failed-close recovery.
- [x] Device/access recovery without copied fiscal identity.
- [x] Phone/tablet captures, preserved-work checks and assumptions.
- [x] Final existing-screen regression and board captures.

## Completed — first consistency, accessibility and interruption audit

- [x] Inventory the 90 base screens and review shared control sizes.
- [x] Cash/search focus, small filters and reduced-motion feedback.
- [x] Preserve unfinished cash entry for the same seller, currency and basket.
- [x] Verify keyboard/dialog recovery, stale-draft guards and responsive layouts.
- [x] Inspect refreshed renders and finish the audit summary.
- [x] Assess complete Figma conversion scope and limitations.
- [x] Final existing-workflow and layout regression.

## Completed — state/dialog coverage and review drafts

- [x] Map all 90 screen routes and all 19 dialog call sites.
- [x] Retain delivery, stock-count, money-out and cash-up entry/review drafts.
- [x] Fresh checks, approval re-entry, changed-record guards and saved handover.
- [x] Complete the linked state/dialog review catalog and coverage policies.
- [x] Verify restored phone/tablet layouts, dark/large text and all dialog layouts.
- [x] Inspect captures and record assumptions and remaining design gates.
- [x] Final existing-screen regression sweep and board captures.

## Next design work

- [x] Kept-change journey and its use/refund at checkout.
- [x] Fractional quantities and partial returns with explicit units/approval.
- [x] Deeper staff permission/revocation and offline access states.
- [x] Period/location report exploration without pretending missing data is complete.
- [x] Connection, pairing and replacement-recovery design previews.
- [x] Optional fiscal receipt/day and rejected-receipt recovery design.
- [x] First cross-screen consistency, accessibility and interruption-state audit.
- [x] Complete state/dialog coverage inventory and richer older-review draft recovery.
- [ ] Final owner/seller walkthrough of the catalog and closure of any design gaps.
- [ ] Physical device/keyboard, TalkBack and vendor usability observations.
- [ ] Figma handoff at the end, after design coverage and final review are complete.

## Decisions / assumptions for this pass

- “Tab layout” means tablet layout; phone bottom tabs remain familiar.
- Tablet uses the same workflows and permissions; more space exposes the basket,
  rather than adding extra business features or owner access for a seller.
- At 700 CSS px and above, navigation becomes a rail. Enlarged text uses one
  content pane instead of squeezing an order-summary panel beside the form.
- Favourite products retain a balanced two-column shelf; larger catalogues can
  use additional columns. Stock's existing practice low threshold of four is
  retained, not introduced as a production policy.
- Portrait/landscape previews are browser viewport simulations. They are not
  proof of behaviour on physical hardware.
- Statements use fictional opening balances and only subsequent practice actions.
  No live connection, production schema or external integration is added.
- Receipt lookup is scoped to the current phone and role. It does not imply a
  complete shop-wide history, and unknown supplier due dates stay unknown.

## Latest summary

The linked state/dialog catalog now accounts for all 90 current base routes,
125 additional state examples and 26 dialog examples spanning all 19 dialog
call sites. Every one of the 12 completion-view call sites has a rendered
example. All 23 brief-feedback source locations are inventoried separately;
that is not a claim that every toast condition was rendered.

Delivery, stock-count, money-out and cash-up entry/review drafts now survive
reload. Product/count zero values, invalid text, reasons, per-currency counts
and retained floats remain editable. Restored reviews need a fresh check;
money out still requires approval again. Changed records return to entry
with values retained, and completed drafts cannot replay their effects.
A closed shift keeps its own handover summary. Empty tracked-product lists
now offer Add a product. Long pricing amounts use a compact treatment.

Passed: current route/state/dialog/result inventory checks; 104 dialog layouts;
48 restored-review layouts; approval, zero/partial/invalid input, changed-record,
currency, saved-handover and no-replay checks. Eight recovery captures and the
interactive catalog were inspected. Source headers, UTF-8, source-size and
whitespace checks passed. Existing workflow, journey, responsive, invoice,
kept-change, quantity/return, staff-access, report, connection and fiscal checks
passed, plus their final 696-layout sweep and all five board captures.
All edits for this pass are inside cdx. App/backend code was not edited.

Open [-cdx-coverage.html](-cdx-coverage.html) to search examples and switch
phone/tablet or appearance. Coverage policy and remaining gates are in
[-cdx-state-dialog-inventory.md](-cdx-state-dialog-inventory.md). Recovery rules,
storage sample and captures are in [-cdx-review-drafts.md](-cdx-review-drafts.md).

Assumptions: one bounded unfinished draft per journey on this phone, scoped to
shop/role/seller/currency; a restored physical count requires a fresh check;
no persisted PIN or consent; browser storage is not native Android process
recovery. Fixtures are isolated fictional snapshots, not a complete shop ledger.
Physical devices, keyboard/insets, TalkBack, vendor observation and real-service
validation remain unverified.

Next: final owner/seller catalog walkthrough and closure of any design gaps it
finds. Figma remains deferred until design coverage and final review are complete;
no Figma file, import package, upload or conversion was created in this pass.
