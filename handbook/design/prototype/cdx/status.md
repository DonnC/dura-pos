# Dura / CDX design status

Updated: 11 November 2026. This is a design prototype, not the Flutter app.
Current scope: work only in this folder. Do not change app/backend code.

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

Reviewed the other screens for tablet space and removed the repeated shop
header from task/detail screens. The full header remains on Sell, Stock,
Money/My till and My shop/Me. Tasks retain Back, their title and a small signed-in
name/role within the scrolling content. The normal tablet task canvas starts
76 px higher. Relevant offline status and the Preview/Practice marker remain.

Money and shop summaries now sit beside useful actions. Invoice entry/review,
approval/float review and existing account/kept-change/return forms use paired
layouts where appropriate. Receipt screens show one receipt beside actions,
instead of duplicating it in a side panel. Stock gains useful row columns and a
bounded detail panel. Report titles/filters share a row; wide report graphs sit
beside exact figures. Large text and mobile preserve their readable order.

Passed: geometry/header audit of all 96 routes; 156 responsive combinations at
320/768/1024/1440 px in light/dark/large text; role labels, reachable actions,
basket/tender resize preservation and blind cash counting. The catalog passed
96 routes, 149 state examples, 27 dialogs and 108 dialog layouts. Existing
workflow, journey, responsive, restored-review, discount, kept-change,
quantity/return, report, access, interruption, continuity and vocabulary checks
passed. Source headers, UTF-8, 500-line limits and whitespace checks passed.
Twenty-three review captures and four additional Cashier captures were created;
representative actual mobile/tablet/wide renders were inspected.

Decisions / assumptions: full identity belongs on the main destinations, not
above every task. Profile/lock controls remain there, reachable after Back.
Focused counting/setup forms retain readable widths rather than invented
panels. Expected cash remains hidden before the blind count. Extra tablet space
never grants Owner permissions. Stock previews use the existing fictional
24-product example. All edits stayed in cdx; app/backend code and skills were
not changed. No production data, migration or restore contract changes.

Open [-cdx-preview.html](-cdx-preview.html) and choose **Review tablet task
layouts**, or use the device/screen controls. All updated mobile/tablet examples
and the detailed review are linked in
[-cdx-tablet-space-review.md](-cdx-tablet-space-review.md). The route audit is
[-cdx-workspace-audit.json](-cdx-workspace-audit.json).

Next: owner review of the revised header rule and tablet layouts. Physical
Android, keyboard/insets, TalkBack, vendor observations and real-service recovery
remain unverified. Figma remains deferred; no conversion or upload was created.
