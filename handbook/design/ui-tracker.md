# Mobile app tracker

10 November 2026. Every component and screen of the Counter design, and how far
each has come. The design is in [`prototype/cdx`](prototype/cdx/-cdx-design.md),
and [decision 0012](../decisions/0012-counter-design-and-ui-foundation.md) adopts it.

**Built: 22 of 88.**

To find something to work on, pick a row in the earliest open phase whose
**Built** box is empty. Read its prototype screen, then
[`dura-ui`](../../.agents/skills/dura-ui/SKILL.md).

## How to tick a box

| Column | Tick it when |
|---|---|
| Shell | The screen exists in the app and can be reached, even if it only says when its work opens |
| Built | It does what the prototype shows, using real data, with every state the [experience principles](../product/03-experience-principles.md) list |
| Tested | Behaviour and screen-reader tests name its ID, such as `group('SELL-06 take payment', ...)` |
| Golden | A golden test names its ID, and the images were looked at before they were committed |
| Responsive | It's checked at 320 wide, at 200% text, and on a tablet-width window |
| A11y | Its labels, focus order, live announcements and 48-pixel targets are tested |
| Vendor | A shopkeeper used it with no help, as the [targets](../product/03-experience-principles.md#targets-and-how-we-check-them) describe. Note who and when in the pull request |

`—` means the step doesn't apply. Components have no shell, for example.

Phases are the [roadmap's](../engineering/06-roadmap.md). A screen can have a
shell long before its phase.

## What CI checks

`melos run check` reads this file and fails when:

- a screen in the app (`TrackedScreen` in `client/apps/dura`) isn't listed, or
  isn't ticked **Shell**;
- a row is ticked **Shell** or **Built** for a screen the app doesn't have;
- **Tested** is ticked and no test names the ID, or **Golden** is ticked and no
  golden test names it;
- a later box is ticked before **Built**;
- an ID is malformed or repeated, or the progress line above is out of date.

It can't check **Responsive**, **A11y** or **Vendor** for you. Tick those only
when they're true.

## Foundation

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-01 | Theme tokens: colours, spacing, corners, sizes | `:root` | 1 | — | [x] | [x] | — | — | [x] | — |
| UI-02 | Type scale and amount styles | `h1`, `.amount-due` | 1 | — | [x] | [x] | — | — | — | — |
| UI-03 | Window sizes and the standard page | `@media` | 1 | — | [x] | [x] | [x] | [x] | — | — |
| UI-04 | Buttons: main, secondary, quiet | `.primary`, `.secondary` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-05 | Text field | `.form-input` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-06 | Amount field, currency always shown | `.field` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-07 | Amount text, currency always shown | `.amount-due` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-08 | Filter chips | `.chip` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-09 | List row | `.menu-row`, `.ledger-row` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-10 | Summary card | `.hero` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-11 | Notice: hint, warning, error | `.note`, `.warning` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-12 | Action dock for the main action | `#dock` | 1 | — | [x] | [x] | [x] | [x] | [ ] | [ ] |
| UI-13 | Navigation: bottom bar and side rail | `nav` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-14 | Shop header and status line | `.appbar`, `.connection` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-15 | Page heading and Back | `h1`, `.back` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-16 | Setting switch row | `.toggle-row` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |
| UI-17 | Confirmation, for money leaving and sharing | `dialog` | 1 | — | [x] | [x] | [ ] | [ ] | [ ] | [ ] |
| UI-18 | Product tile with count badge | `.product` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-19 | Quantity stepper | `.stepper` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-20 | Bottom sheet | `dialog` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-21 | Select sheet, instead of dropdowns | `select` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-22 | Undo toast | `.toast` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-23 | Empty state with a next step | `.empty` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-24 | Shelf loading and load error | `sell` states | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-25 | Payment method choice | `.payment-tabs` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-26 | Suggested amounts | `.suggestions` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-27 | Change box | `.change` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| UI-28 | Receipt lines | `.receipt-details` | 2 | — | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Platform

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| APP-01 | App shell: header, four tabs, bar or rail, owner and seller words | `nav` | 1 | — | [x] | [x] | [x] | [x] | [ ] | [ ] |
| APP-02 | Problem log: rotated, with stack frames, screen and trail | — | 1 | — | [x] | [x] | — | — | — | — |
| APP-03 | Usage records on the phone: rotated, on by default, owner can switch off | — | 1 | — | [x] | [x] | — | — | — | — |
| APP-04 | Usage records uploaded to the owner's Drive through the hub, when turned on | — | 6 | — | [ ] | [ ] | — | — | — | — |
| APP-05 | Memory-leak checks in every widget test | — | 1 | — | [x] | [x] | — | — | — | — |

## Selling

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| SELL-01 | Sell: shelf, search, basket line, main action | `sell` | 2 | [x] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-02 | Your basket | sheet: Your basket | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-03 | Sale options | sheet: This sale | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-04 | Held sales | sheet: Held sales | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-05 | Sell an unlisted item | `quick` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-06 | Take payment: cash | `pay` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-07 | Sale saved | `done` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-08 | Scan a product | sheet: Scan a product | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-09 | USD and ZWG cash together | `mixed` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-10 | Sale on a customer's account | `credit` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-11 | Mobile money request | `mobile` | 6 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SELL-12 | Payment pending | `pending` | 6 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Receipts and returns

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| RCPT-01 | Recent sales | `history` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| RCPT-02 | Receipt | `receipt` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| RCPT-03 | Share a receipt | sheet: Share receipt | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| RCPT-04 | Print, and choose a printer | `print` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| RCPT-05 | Return | `refund` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| RCPT-06 | Return review and owner approval | `refund-review` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Shifts

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| SHIFT-01 | Open your till | `opening` | 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHIFT-02 | Count your cash | `cashup` | 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHIFT-03 | Cash-up review | `count-review` | 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHIFT-04 | Hand over | `handover` | 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHIFT-05 | Locked | `locked` | 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHIFT-06 | Next person | `switch-person` | 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Stock

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| STOCK-01 | Your stock | `stock` | 2 | [x] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| STOCK-02 | Product | `product` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| STOCK-03 | Add or change a product | `product-edit` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| STOCK-04 | Receive stock | `receive` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| STOCK-05 | Review a delivery | `receive-review` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| STOCK-06 | Count the shelf | `stock-count` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| STOCK-07 | Count differences | `count-stock-review` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Money

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| MONEY-01 | Your money, or My till for a seller | `money` | 4 | [x] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| MONEY-02 | Record money out | `expense` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| MONEY-03 | Money out review and approval | `expense-review` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| MONEY-04 | Customers | `customers` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| MONEY-05 | A customer, and a payment from them | `customer` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| MONEY-06 | Suppliers | `suppliers` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| MONEY-07 | Reports | `reports` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## First setup

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| SETUP-01 | Welcome | `welcome` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SETUP-02 | Make it your shop: name and pricing currency | `setup` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SETUP-03 | Your first product | `first-product` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SETUP-04 | Join an existing shop | `join` | 6 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## My shop

| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | Responsive | A11y | Vendor |
|---|---|---|---|---|---|---|---|---|---|---|
| SHOP-01 | My shop, or Me for a seller | `shop` | 2 | [x] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-02 | Set up when needed | `settings` | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-03 | Connection and upload status | `sync` | 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-04 | Records | `records` | 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-05 | Export, and what it contains | `export` | 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-06 | Connect Google | `connect` | 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-07 | Restore, with checks before restoring | `restore` | 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-08 | People and phones | `people` | 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-09 | A person's access | `staff` | 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-10 | Pair another phone | `pair` | 6 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-11 | Fiscal receipts | `fiscal` | 5 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-12 | Help | `help` | 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| SHOP-13 | Problem reports, and the usage switch | — | 1 | [x] | [x] | [x] | [ ] | [x] | [ ] | [ ] |
