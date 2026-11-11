# Tablet space and task-header review

11 November 2026 · cdx design only · No Flutter/backend changes.

## Why the header used to repeat

The prototype put shop, name, role and profile in one shared app shell. Every
screen inherited that branding row, even after it already had Back and a task
title. Its tablet grid reserved 76 px for that row. Payment, approvals, invoices
and reports therefore started lower without gaining useful task information.

## Revised header rule

| View | Identity and navigation |
| --- | --- |
| Sell, Stock, Money/My till, My shop/Me | Full shop header, name/role, avatar and the familiar main navigation |
| Tasks and details | Back where the workflow permits, task title, then a small name/role within the content |
| Saved outcomes | Result title and name/role; next step stays reachable |
| Onboarding | Existing minimal onboarding treatment |
| Offline / Practice | Relevant offline status and the small Preview/Practice corner marker remain |

The task identity scrolls with the content. It is not a replacement fixed account
bar. Returning to a main destination restores the shop header. The receipt's shop
name remains part of the actual receipt. That is distinct from app navigation.

At normal tablet text, task content starts at 28 px beneath the simulated system
bar, rather than 104 px beneath system plus shop header. Name/role remains visible
in the task heading. Removing the account bar does not change permissions.
Profile/lock controls remain on the main destinations; use Back to leave a task.

## Review by work area

| Area | Finding and treatment |
| --- | --- |
| Sell | Previous adaptive shelf and bounded basket retained |
| Money / My till | Sales and incomplete-data context beside drawer figures and actions; Cashier still gets only their own shift |
| My shop / Me | Shop/shift summary beside relevant menus, instead of stacking everything in a narrow column |
| Stock | Bounded product-detail panel; stock rows use additional columns when useful; search/filters remain intact |
| Invoices | Items beside totals and notes; existing payment/review columns can use a wider workspace; compact noninteractive amount rows |
| Approvals | Review amounts beside approval/float entry, preserving mobile reading order |
| Receipts | One receipt beside share, print and return controls; removed the second copy previously shown in the context panel |
| Recent sales | List plus selected-receipt preview retained; it serves a different purpose from duplicating a receipt screen |
| Pending payment | Status beside reference, item quote and next action; reduced oversized status padding on tablets |
| Reports | Title and filters share a row; wide product/cashier/discount graphs sit beside exact-value tables; smaller tablets stack them legibly |
| Customer/supplier, kept change, quantities and returns | Existing meaningful pairs get usable width; no extra data or workflow is introduced |
| Opening/cash count, setup, connection and fiscal recovery | Focused forms remain readable; shared account row removed on task/detail views. Spare space is not filled with invented data |

Blind cash counting stays blind: expected cash is not exposed before entering
the count. Widening a tablet does not grant Owner access. Large text returns to
one content column where needed. Existing controls are moved, not cloned, so
IDs, labels, approvals, typed values and their handlers remain the same.

## Updated previews

The main preview has **Review tablet task layouts**, showing payment, invoice
review and the product report. Device and screen controls still cover the rest.

| Example | Mobile | Tablet |
| --- | --- | --- |
| Cashier payment | [Mobile](-cdx-space-mobile-cashier-pay.png) | [Tablet](-cdx-space-tablet-cashier-pay.png) |
| My till | [Mobile](-cdx-space-mobile-cashier-money.png) | [Tablet](-cdx-space-tablet-cashier-money.png) |
| Owner money | [Mobile](-cdx-space-mobile-money.png) | [Tablet](-cdx-space-tablet-money.png) |
| My shop | [Mobile](-cdx-space-mobile-shop.png) | [Tablet](-cdx-space-tablet-shop.png) |
| Stock | [Mobile](-cdx-space-mobile-stock.png) | [Tablet](-cdx-space-tablet-stock.png) |
| Invoice items | [Mobile](-cdx-space-mobile-invoice-items.png) | [Tablet](-cdx-space-tablet-invoice-items.png) |
| Invoice review | [Mobile](-cdx-space-mobile-invoice-review.png) | [Tablet](-cdx-space-tablet-invoice-review.png) |
| Receipt | [Mobile](-cdx-space-mobile-receipt.png) | [Tablet](-cdx-space-tablet-receipt.png) |
| Pending payment | [Mobile](-cdx-space-mobile-pending.png) | [Tablet](-cdx-space-tablet-pending.png) |
| Discount review | [Mobile](-cdx-space-mobile-discount-review.png) | [Tablet](-cdx-space-tablet-discount-review.png) |
| Sales trend | [Mobile](-cdx-space-mobile-report-trend.png) | [Tablet](-cdx-space-tablet-report-trend.png) |
| Product report | [Mobile](-cdx-space-mobile-report-products.png) | [Tablet](-cdx-space-tablet-report-products.png) |

The [wide product report](-cdx-space-wide-report-products.png) shows graph and
table together. Empty states keep an honest next step rather than fictitious
rows. The 24-product Stock example uses existing fictional sample data.

## Evidence and limits

`-cdx-workspace-audit.json` records header treatment, geometry and paired-layout
presence for all 96 routes at 1024 × 768. This is a route audit, not a claim that
every possible input/state was visually inspected. Representative actual
mobile/tablet/wide renders were inspected.

`-cdx-workspace-check.cjs` checks all routes, plus 156 layout combinations across
320/768/1024/1440 px, light/dark/large text, role labels, root/task headers,
reachable actions, resize/basket recovery and blind cash counting. It generates
23 captures; four additional Cashier captures verify the updated role views.
The existing catalog and relevant workflow suites are also run; exact results
are recorded in [status.md](status.md).

All changes are within cdx. No production data/schema, migration, restore format
or business permission changes. This review does not prove physical Android,
keyboard/insets, TalkBack, vendor usability or real-service recovery. Figma
conversion remains deferred until the owner finishes reviewing the design.
