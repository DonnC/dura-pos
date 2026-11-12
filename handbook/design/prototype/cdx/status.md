# Dura / CDX design status

Updated: 12 November 2026. This is a design prototype, not the Flutter app.
Current scope: work only in this folder. Do not change app/backend code.

## Completed — overpayment and stock-take refinement

- [x] Explicit change currency, split change and drawer limits.
- [x] Retained rate and interrupted payment recovery.
- [x] Inline counted-item feedback, reasons and count history.
- [x] Focused interactions, dark/large-text layouts and phone/tablet previews.
- [x] Preserve the direct quiet receipt and failed-save retry.
- [x] Refresh the 100-route, 167-state and 28-dialog catalog.

## Covered

- [x] Approved B / Shop Sign identity, charcoal, chalk and sign red.
- [x] Device owner/cashier journeys: selling, payment, receipts and full returns.
- [x] Opening float, lock, cash-up differences and handover.
- [x] Stock receipts/counts, expenses and basic customer/supplier balances.
- [x] Practice-only onboarding, cashier access and connection/export previews.
- [x] Device light/dark/enlarged-text renders and workflow checks.

## Completed — this pass

- [x] Device preview controls: device, tablet portrait and tablet landscape.
- [x] Responsive tablet workspaces, including a persistent editable Sell basket.
- [x] More useful Stock: search, low/out-of-stock filters and movement detail.
- [x] More useful receipts: search, payment/return filters and empty recovery.
- [x] Customer/supplier statements with explicit balance movements.
- [x] Mobile/tablet interaction, resize and visual verification; refreshed captures.

## Completed — supplier purchase invoices

- [x] Items received and purchase costs.
- [x] Payment, due date and optional evidence.
- [x] Review, saved detail and statement links.
- [x] Mobile/tablet captures and interaction/layout verification.

## Completed — kept change

- [x] Customer balance and activity screens.
- [x] Use kept change at checkout, with cash for the rest.
- [x] Keep new change with customer agreement.
- [x] Approved cash refund and confirmation.
- [x] Mobile/tablet interaction, layouts, captures and assumptions.
- [x] Final existing-screen regression run.

## Completed — quantities and partial returns

- [x] Weighed quantity entry, units and basket/receipt totals.
- [x] Select returned quantities and stock condition per item.
- [x] Original-payment refund split, approval and linked history.
- [x] Draft recovery and limits after previous returns.
- [x] Mobile/tablet renders, interactions and assumptions.
- [x] Final existing-screen regression run.

## Completed — cashier access

- [x] Cashier permissions and allowed-device review.
- [x] Remove access with honest per-device delivery states.
- [x] Cashier offline access, owner check and supervised recovery.
- [x] Mobile/tablet captures, interactions and assumptions.
- [x] Final existing-screen regression run.

## Completed — period and location reports

- [x] Period/place filters and honest sales overview.
- [x] Sales/returns breakdown and known profit.
- [x] Drawer snapshots with separate currencies and timestamps.
- [x] Source coverage, missing data and custom-period recovery.
- [x] Mobile/tablet captures, checks and assumptions.
- [x] Final existing-screen regression checks and board-capture recovery.

## Completed — connection, pairing and restore

- [x] Owner connection checklist and recovery states.
- [x] Pairing / new-device shop confirmation and code recovery.
- [x] Replacement-device restore review and lost-device follow-up.
- [x] Preserved local work and mismatched/incomplete backup guards.
- [x] Mobile/tablet captures, interaction checks and assumptions.
- [x] Final existing-screen regression and capture review.

## Completed — optional fiscal status and recovery

- [x] Test setup and clear saved/submitted/accepted status.
- [x] Receipt queue, unknown result and owner issue review.
- [x] Fiscal-day close, waiting and failed-close recovery.
- [x] Device/access recovery without copied fiscal identity.
- [x] Mobile/tablet captures, preserved-work checks and assumptions.
- [x] Final existing-screen regression and board captures.

## Completed — first consistency, accessibility and interruption audit

- [x] Inventory the 90 base screens and review shared control sizes.
- [x] Cash/search focus, small filters and reduced-motion feedback.
- [x] Preserve unfinished cash entry for the same cashier, currency and basket.
- [x] Verify keyboard/dialog recovery, stale-draft guards and responsive layouts.
- [x] Inspect refreshed renders and finish the audit summary.
- [x] Assess complete Figma conversion scope and limitations.
- [x] Final existing-workflow and layout regression.

## Completed — state/dialog coverage and review drafts

- [x] Map all 90 screen routes and all 19 dialog call sites.
- [x] Retain delivery, stock-count, money-out and cash-up entry/review drafts.
- [x] Fresh checks, approval re-entry, changed-record guards and saved handover.
- [x] Complete the linked state/dialog review catalog and coverage policies.
- [x] Verify restored device/tablet layouts, dark/large text and all dialog layouts.
- [x] Inspect captures and record assumptions and remaining design gates.
- [x] Final existing-screen regression sweep and board captures.

## Completed — language, account header, owner reports and discounts

- [x] Standardise Owner / Cashier / Device and Stock / Stock take in design copy.
- [x] Compact account header and one small Preview/Practice corner marker.
- [x] Keep owner reports/settings hidden and guarded for cashiers.
- [x] Detailed owner trend/product/cashier/discount reports with graphs and tables.
- [x] Product-line discount entry/review, payment and receipt presentation.
- [x] Verify discount approval, held sales, original paid-price returns and layouts.
- [x] Update catalog coverage and inspect mobile/tablet renders.
- [x] Validate the two dedicated project design skills and generated pointers.
- [x] Final existing-workflow, layout and vocabulary checks.

## Completed — final Owner/Cashier browser walkthrough

- [x] Review catalog coverage and identify cross-feature continuity risks.
- [x] Verify signed-in role after reopening and discounted shift handover.
- [x] Verify pending payment quotes and the next customer's unfinished sale.
- [x] Close identified gaps and inspect mobile/tablet recovery views.
- [x] Refresh catalog, focused regression checks and review notes.

## Completed — Sell space and updated previews

- [x] Remove the four-item Favourites cutoff and oversized tablet cards.
- [x] Adaptive shelf columns, compact toolbar and bounded basket width.
- [x] Representative 24-product review shop and category counts.
- [x] Mobile, portrait, landscape and wide preview captures.
- [x] Verify resizing, filtering and the interactive preview controls.
- [x] Final category-label, catalog and source checks.

## Completed — tablet space and task headers

- [x] Review shared header and repeated/narrow tablet layouts.
- [x] Full shop header on main destinations; inline identity for task/detail views.
- [x] Useful paired money, shop, invoice, approval, receipt and pending layouts.
- [x] Remove duplicate receipt panels; align report filters and chart/detail areas.
- [x] Audit all routes and verify mobile/tablet/dark/large-text layouts.
- [x] Verify existing journeys, refresh previews/catalog and inspect captures.
- [x] Record decisions, checks and next work.

## Completed — stock take, one-step receipts and cash movements

- [x] Research current Square, Lightspeed and Shopify stock-count workflows.
- [x] Search/category/status filters, bounded count pages and saved progress.
- [x] Recount changed stock; leave uncounted goods untouched; explain Other reasons.
- [x] Direct receipt after saving, with honest local-save success/failure.
- [x] Persistent Stock take / Receive stock actions and Add product FAB.
- [x] Simplify money-out purpose; add money-in entry/review.
- [x] Compact mobile account header and remove duplicate profile money shortcut.
- [x] Restore Sell currency control with converted product prices and explicit rate.
- [x] Verify 500-item counts, recovery, reasons, money, currency and receipt paths.
- [x] Update catalog/previews, inspect layouts and document decisions and next work.

## Completed — quiet receipt preview

- [x] Remove success heading, duplicate change card and device/fiscal status copy.
- [x] Receipt data plus one small green success check; no return actions here.
- [x] Keep Share, Print and Next customer; preserve an honest minimal failure state.
- [x] Keep returns available from Recent sales instead of the receipt.
- [x] Verify 48 phone/tablet, role and appearance layouts and refreshed captures.
- [x] Verify relevant receipt/return regressions and refresh the catalog.
- [x] Finish preview notes and latest summary.

## Next design work

- [x] Kept-change journey and its use/refund at checkout.
- [x] Fractional quantities and partial returns with explicit units/approval.
- [x] Deeper cashier permission/revocation and offline access states.
- [x] Period/location report exploration without pretending missing data is complete.
- [x] Connection, pairing and replacement-recovery design previews.
- [x] Optional fiscal receipt/day and rejected-receipt recovery design.
- [x] First cross-screen consistency, accessibility and interruption-state audit.
- [x] Complete state/dialog coverage inventory and richer older-review draft recovery.
- [x] Final browser walkthrough as Owner/Cashier and closure of identified design gaps.
- [ ] Cross-currency refund allocation and insufficient refund-cash states.
- [ ] Owner review of the finished catalog, workflow choices and assumptions.
- [ ] Physical device/keyboard, TalkBack and vendor usability observations.
- [ ] Figma handoff at the end, after design coverage and final review are complete.

## Decisions / assumptions for this pass

- “Tab layout” means tablet layout; device bottom tabs remain familiar.
- Tablet uses the same workflows and permissions; more space exposes the basket,
  rather than adding extra business features or owner access for a cashier.
- At 700 CSS px and above, navigation becomes a rail. Enlarged text uses one
  content pane instead of squeezing an order-summary panel beside the form.
- Mobile products retain two columns; tablet/wide Sell uses adaptive columns
  and a 280–380 px basket. Stock's existing practice low threshold of four is
  retained, not introduced as a production policy.
- Portrait/landscape previews are browser viewport simulations. They are not
  proof of behaviour on physical hardware.
- Statements use fictional opening balances and only subsequent practice actions.
  No live connection, production schema or external integration is added.
- Receipt lookup is scoped to the current device and role. It does not imply a
  complete shop-wide history, and unknown supplier due dates stay unknown.

## Previous pass — language, header, reports and discounts

Current design copy uses Owner / Cashier / Device consistently, and Stock for
goods and Stock take for a physical count. The project glossary is the shared
contract; technical IDs remain stable. Existing app implementation copy has not
been migrated in this design pass.

The compact header shows shop, signed-in name and role. Healthy saving no longer
needs a permanent second bar. A small corner marker identifies Preview or the
once-selected Practice appearance. Owner and Cashier retain familiar navigation
positions, with different destinations and guarded owner-only routes.

Owner reports now include daily trends, product performance, cashier attribution
and discounts, with graphs and exact-value tables. Periods include this month
and last seven days. Missing records remain visible; unknown buying costs do not
become zero cost or invented profit. Shared devices do not stand in for people.

Product-line discounts show original price, reduction and payable amount through
basket, payment and receipt. Cashier requests require fresh owner approval.
Held baskets retain approved unchanged discounts; changed quantities/prices need
a fresh review. Partial returns use the original discounted amount paid,
including fractional quantities and cumulative rounding.

The catalog now covers 96 routes, 142 additional states and 27 dialog examples
across all 19 dialog call sites. All 12 completion-view sites have examples;
23 brief-feedback sources are separately inventoried. Current coverage and
108 dialog layouts passed. Focused checks passed for header/role boundaries,
discount approval, draft reload, held sales, changed quantities, validation,
net-price returns, 24 discount layouts and 48 detailed-report layouts.
Existing workflow, journey, responsive, invoice, kept-change, quantity/return,
cashier-access, report, connection and fiscal checks passed. The final 696-layout
sweep, five design boards and browser asset/error checks passed. Mobile/tablet
header, role, graph, scrolled report table, payment and receipt captures were
inspected. UTF-8, source headers, 500-line limits and whitespace checks passed.

Added dedicated dura-responsive-design and dura-design-language skills, linked
to the project glossary and current prototype contract. Both skill validators
passed; the generated skill-pointer check reports 12 skills and zero problems.
Design edits stay in cdx, with authorised shared vocabulary/skill updates under
the handbook and .agents/.claude. App/backend code was not edited in this pass.

Open [-cdx-preview.html](-cdx-preview.html) for mobile/tablet journeys or
[-cdx-coverage.html](-cdx-coverage.html) for the searchable catalog.
Contracts, assumptions and captures are in [-cdx-language-roles.md](-cdx-language-roles.md),
[-cdx-discounts.md](-cdx-discounts.md) and
[-cdx-owner-report-details.md](-cdx-owner-report-details.md).

Assumptions: Cashier is the one current selling-role label. Every cashier manual
discount needs owner approval; one discount per product line, with no stacking
or free-item workflow in this slice. Fixed discounts apply to the entire line.
Preview means fictional account appearance; Practice is not a live database
switch. No PIN is persisted. Fixtures are fictional snapshots, not a complete
shop ledger. Physical devices, keyboard/insets, TalkBack, vendor observation and
real-service validation remain unverified.

Next: final owner/cashier catalog walkthrough and closure of any design gaps it
finds. Figma remains deferred until design coverage and final review are complete;
no Figma file, import package, upload or conversion was created in this pass.

## Latest summary

12 November: designed overpayment and change currency on the current payment
screen. Choose USD, ZWG or split change; only the USD part needs typing for split
change. Available drawer balances, insufficient cash and a changed-rate recovery
remain beside the payment. Exact payment stays quick. Saving opens the same quiet
receipt directly, including received cash, actual change and the retained rate.

Synthesized the supplied stock-take examples into Dura's scalable workflow:
inline counted quantities and differences, optional item reasons with typed Other,
a shared reason for remaining differences, and searchable/paged completed-count
history. Counting stays direct, searchable, resumable and bounded to 20 inputs;
there is no added stock-take dashboard or compulsory per-item modal/save.
Completed snapshots retain their original quantities and reasons when stock later
changes. Existing Owner/Cashier boundaries stay in place.

Passed: explicit currency choice, USD/ZWG/split drawer effects, insufficient cash,
retained draft and rate-change recovery; 500-item operations/reload/recount checks;
per-item reasons and immutable history after reload; 72 new phone/tablet layouts
at 320/390/768/1024 px in light/dark/enlarged text; 48 quiet-receipt layouts and
receipt failure/retry; existing journey regression; phone/tablet preview controls.
Ten new captures were rendered and the phone/tablet layouts inspected.
Catalog passed: 100 routes, 167 states, 28 dialogs, 20 dialog callsites,
13 completion callsites and 112 dialog layouts. The workspace review also passed
100 screen audits and 156 layouts, including header, role and resize checks.

Decisions / assumptions: USD/ZWG and the rate are fictional configured examples.
Change choice is explicit for cross-currency overpayment; incoming cash counts
as available, but cash denominations are not modeled. Rounding occurs once to the
selected currency's cents and the residual is retained. A changed shop rate keeps
the typed tender but requires checking change again. History is Owner-only and
shows the last ten counts on this device; it is not a full journal or upload
confirmation. Starting a new shop clears these local prototype histories.

All work stayed in cdx. No app/backend code, skills or Figma files changed.
Open [-cdx-preview.html](-cdx-preview.html) and choose **Overpayment & change**,
then use Device to compare phone and tablet. Details and stock-take synthesis:
[-cdx-overpayment-and-count-history.md](-cdx-overpayment-and-count-history.md).

Next: design refund allocation for these currency combinations, then continue the
final catalog walkthrough. Physical devices, scanner/keyboard, TalkBack and vendor
observations remain open. Figma stays at the end after coverage and owner review.

## Completed — keep image previews out of Git

- [x] Added folder-local image ignore rules, including nested previews.
- [x] Removed 170 existing image paths from Git tracking; all 202 local images remain unchanged.
- [x] Verified no images remain in the index and every local image is ignored.

This stages image removals for the next commit; earlier commits retain their images.
No history rewrite or commit was made. Editable prototype sources stay tracked.
Next design work remains cross-currency refund allocation.
