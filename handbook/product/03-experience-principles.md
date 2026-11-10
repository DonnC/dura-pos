# Experience principles

2 November 2026. **For a vendor, the experience is the product.** A POS that's
correct but slow or confusing gets abandoned for the exercise book. These
principles apply to every screen, sheet, receipt and message Dura produces.
They come from [note 08](../../notes/08-change-invoices-suppliers-ux-support.md)
(the five-second rule), [the mobile concept](../design/mobile-concept.md) and
the project's design skill.

## Design for the real setting

- **A cheap Android phone,** often with a small screen (design from 320
  logical pixels wide), little storage and an old Android version.
- **Outdoors, in sunlight, one-handed,** with a customer waiting.
- **Data costs money,** and the network comes and goes.
- **The person may not read English comfortably,** and may never have used a
  POS before.
- **The phone may be shared** by an owner and a relative or cashier.

## The five-second rule

**If someone looks at a screen for more than five seconds wondering what to do,
the screen is wrong.**

1. **Selling needs no setup.** Features stay off and invisible until the owner
   turns them on from the "Set up when you need it" checklist. Examples:
   locations, staff, payments, fiscalisation, suppliers, kept change.
2. **One main action per screen,** as a large button at the bottom, within
   reach of the thumb.
3. **Sensible defaults:**
   - today's rate;
   - the shop's usual currency;
   - a walk-in customer;
   - exact cash.

   A cash sale is items, **Pay**, done. The one thing never defaulted is the
   pricing currency at setup: the owner chooses it.
4. **Undo instead of "Are you sure?"** Removing a line or cancelling a sale
   can be undone for a few seconds. PIN checks are kept for money leaving the
   shop: refunds, pay-outs and large discounts.
5. **Work happens out of sight.** Syncing, retries, backups and fiscal
   submissions run in the background. The seller sees one status indicator
   and can tap it for a plain explanation and the one thing to do.
6. **Never block a sale.** No dialog interrupts a sale for sync, updates,
   rates or backups. Anything that needs attention waits until the sale is
   done.
7. **Errors say what to do,** never show a code. "No internet: sales are saved
   and will send later", not "HTTP 503". Technical detail goes in the problem
   report.

## Show the truth, plainly

- **Every amount shows its currency.** `USD 2.00`, never a bare `2.00`.
  Currencies are never added together.
- **Every quantity shows its unit** where it isn't obvious, e.g. `16 loaves`.
- **Keep the states of a sale apart.** These are different facts, and the
  screen must not blur them:
  - saved on this phone;
  - uploaded;
  - payment confirmed by the provider;
  - accepted by ZIMRA.
- **Incomplete means incomplete.** If a phone hasn't synced, the report says
  so ("P2 last seen 14:05"). An unknown cost is shown as unknown, not zero.
- **Never fake success.** A payment that hasn't been confirmed by a check is
  pending. A demo or practice result is labelled as one.
- **Words alongside colour.** "Waiting to upload" with an amber dot, never the
  dot alone.

## Speak the shop's language

- **English, Shona and Ndebele,** with every string in the app's copy files,
  never hard-coded in a widget.
- **Shop words, not accounting words:**

  | Say | Not |
  |---|---|
  | Cash up | Reconciliation |
  | Kept change | Customer liability |
  | Money owed to you | Accounts receivable |
  | Stock count | Inventory audit |

- **Reports answer questions:** "How much did I make today?", "What's running
  out?", "Who owes me?", "Which seller was short?". Each is one card, with the
  detail behind it.

## Look and feel

- **Sell is the home screen.** Setup and reports never slow the next customer.
- **Bottom navigation,** few destinations: Sell, Stock, Money, My shop.
- **Identity:** the Shop Sign wordmark and d, charcoal, chalk and sign red
  ([branding](../design/branding/04-shop-sign.md)). Red directs primary actions;
  neutral surfaces and explicit status words keep its meaning clear.
- **Large touch targets** (at least 48 dp), big numbers, high contrast for
  sunlight.
- **Calm, not decorative.** No gradients, glass, gratuitous shadows or
  animations that delay selling. Motion only to explain a change, and none
  when the system's reduce-motion setting is on.
- **Colours, spacing and type come from `dura_ui` theme tokens.** Never a
  hard-coded colour in a widget; CI checks this.

## Every screen handles every state

Design and test each of these, not just the happy path:

- loading;
- empty (with a next step, e.g. "Add your first product");
- populated, including long product names and large amounts;
- offline;
- error, with recovery;
- disabled, with the reason;
- interrupted: the app killed mid-sale and reopened. The sale must come back.

Also check:

- 200% text size;
- dark mode;
- the keyboard open;
- a screen reader (labelled controls, sensible focus order).

## The sheets are part of the experience

The owner's Sheets are as much a screen as the app:

- a **Read Me** tab first in every file;
- **tabs colour-coded by who writes them,** labelled in words too: green for
  owner input, grey for Dura's records, blue for reports;
- **dropdowns from the `Lists` tab** instead of typing, and date pickers;
- clear headings (`Amount received`, not `amt_rcvd`), with the currency in
  the heading or a column;
- **red negatives, status dots and a few useful charts.**

See [the records policy](../engineering/03-records-and-sheets.md).

## Targets, and how we check them

| Task | Target |
|---|---|
| First sale after installing | Under 5 minutes |
| Cash sale of 3 scanned items | Under 10 seconds |
| Cash-up | Under 2 minutes |
| Stock take | No typing except counts |
| Any screen, first-time user | No hesitation over 5 seconds |

- **Test with real vendors.** Five of them, such as a stall, a tuck shop and a
  small grocer, each doing a task with no help. Record the screen (with
  permission) and time it.
- **Every hesitation over five seconds is a bug,** filed like any other.
- **Repeat before every release that changes a screen.**
- **Don't claim a target is met until it's been measured.** The same goes for
  speed, battery and accessibility claims.

## Checklist for a UI pull request

- [ ] One clear main action; nothing blocks a sale.
- [ ] Amounts show currency; quantities show units.
- [ ] Loading, empty, offline, error and interrupted states handled.
- [ ] Works at 320 px wide and at 200% text; labels for screen readers.
- [ ] Strings are in the copy files, ready for translation.
- [ ] Colours and spacing from theme tokens; uses existing `dura_ui`
  components.
- [ ] Golden images reviewed, with before and after attached.
