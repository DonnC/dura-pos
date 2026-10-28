# Kept change, invoices, suppliers, ease of use, and problem reports

28 October 2026. This adds to `03`, `04` and `07`. The sample (`../samples/`)
now has all of it: kept change, invoices on account, quotes, suppliers and
purchases, and the Balances tab. Customers and suppliers now share one `Contacts` tab,
and the Ledger is split into a Stock Ledger and a Money Ledger (`04`).

## Kept change ("I'll keep your change")

At kiosks and tuck shops, the shop often owes a customer small change it
couldn't give: USD coins are short, or the customer says "keep it, I'll come
back". Today that's remembered, or written in an exercise book. Dura records
it and does the arithmetic. **It's not a wallet or stored value:** it's a
record of small amounts the shop owes, with limits.

**At the till:**

- **Keeping change.** At checkout, the change due shows **Give** and **Keep**
  buttons.
  - Keep asks for a customer: a name or phone number is enough, and quick-add
    is one field.
  - The receipt, and an SMS or WhatsApp message if the customer has a number,
    says: "Chipo's Corner Shop owes you USD 0.40".
- **Using it.** When the customer is picked at checkout, their balance shows,
  with one button to use it. They can use some or all of it.
- **Cash back.** Paying out kept change is one button. It comes out of the
  drawer, in the currency it's owed in.

**Limits, set by the owner:**

- the most kept per customer (default USD 2.00);
- a reminder after a number of days (default 60), to clear old balances;
- whether sellers may pay it out in cash, or need the owner's PIN.

**Several tills.** A till knows a customer's kept change only from its last
sync, and two phones offline at the same moment could both let the same 40c be
spent.
- In practice, kept change belongs to a till: the one where the coins are.
  The sample keeps it per location's till.
- The cap keeps any slip tiny.
- A balance that goes below zero shows in Balances as the customer
  owing the shop, for the owner to settle.

**Currency.** The balance stays in the currency it was owed in. USD cents
stay USD cents, even if the customer later spends them on a ZWG sale; then
it's converted at the day's rate, like any other USD payment.

**The cash-up** accounts for it:

- Kept change stays in the drawer. It counts as cash received but is shown as
  "owed to customers".
- Paying it out reduces the expected cash.
- The Summary shows the total owed to customers, per currency, so the owner
  never mistakes it for takings.

**Fiscalisation.**

- The original sale's receipt shows the full cash payment, so the receipt
  total is unchanged. The kept amount is a deposit, not a sale.
- When kept change is used, that part of the payment needs a ZIMRA money type.
  fzimra supports `Coupon` and `Other`, but which one ZIMRA expects is
  **question 12** in `02-questions-for-zimra.md`. Ask it before building this.

## Invoices, quotes and sharing

- **Every receipt is shareable.** One tap shares it as a PDF or image, with
  the ZIMRA QR code and verification code, through Android's share sheet:
  WhatsApp, email, anything. If the customer has a phone number, Dura offers
  that WhatsApp chat first.
  - There's no server: the file is made on the phone.
  - A copy goes into the month's folder only if the owner turns that on.
- **Quote.** It's a list of items and prices, valid until a date. It's not
  fiscal and doesn't touch stock. It's shared the same way, and turns into a
  sale with one tap.
- **Invoice on account** (the customer pays later; for business customers
  and trusted regulars):
  - It's a sale with a due date.
  - **It is fiscalised when issued**, with the unpaid part as money type
    `Credit` (fzimra has it).
  - Payments are recorded against the invoice later, in any month, and the
    Sales row shows Paid, Part paid or Unpaid.
  - Whether the later payment needs anything sent to ZIMRA is **question 13**.
  - The owner turns this on per customer, with a credit limit; sellers can't
    by default.
- **Statement.** For a business customer: everything invoiced, paid and owed,
  shared as one PDF.

## Suppliers and purchases

- **Suppliers are contacts** (`My Shop` → `Contacts`, `Type = Supplier`): name, phone, TIN and VAT number, what they
  supply, payment terms (cash on delivery, or 7, 14 or 30 days), and active.
- **Receiving a delivery** is one screen:
  1. pick the supplier;
  2. scan or tick the items and quantities;
  3. enter the invoice number, total and VAT, and how it was paid: from the
     drawer, by the owner, or owed;
  4. optionally take a photo of the supplier's invoice. It goes to
     `<year>/Supplier invoices/`.

  That becomes:
  - one row in **`Purchases <year>`** (the invoice);
  - `Stock in` rows in the Ledger, with the supplier and the reference.

  The VAT on purchases is what an accountant needs for the VAT return.
- **Paying a supplier later** is a Ledger cash row, `Supplier paid`, against
  the purchase. Amounts owed to each supplier are worked out by formula.
- **Order list.** Low stock is already known. "Order from Bakers Inn" makes a
  list of that supplier's low items with suggested quantities, from recent
  sales, and shares it on WhatsApp. **This is the kind of heavy lifting the
  app should do for the owner.**

## What it adds to the files

| Where | What |
|---|---|
| `My Shop` → `Contacts` | Suppliers are contacts with `Type = Supplier`, beside the customers |
| `My Shop` → `Balances` | New Dura tab (formulas): per customer and currency, kept change owed and account balance owed; per supplier, amount owed. Overdue and over-limit rows are coloured |
| Ledger | New columns `Customer ID` and `Supplier ID`. New cash types: `Change kept`, `Change used`, `Change paid out`, `Invoiced on account`, `Account paid`, `Supplier paid`. Balances live here because the Ledger is the one file every phone writes and formulas can read |
| Sales | `Type` adds `Invoice`. New columns `Due date` and `Payment status` (a status cell the phone updates) |
| Payments | `Kind` adds `Change kept` and `Change used`. New statuses `On account` and `Paid later`. Each sale's rows still add up exactly to its total |
| Quotes | One `Quotes` tab in the month's Sales file, or kept on the phone only. Not fiscal |
| Year end | Open balances carry into the new year as `Opening` rows per customer or supplier and currency, the same way stock does |

**Formulas never cross files.** Balances come from the Ledger in `My Shop`,
never from the monthly Sales files.

## Making the app easy: the five-second rule

The rule: **if someone looks at a screen for more than five seconds wondering
what to do, the screen is wrong.** That means the app does the hard work, not
the person.

**Principles:**

1. **Selling needs no setup.** Every feature that isn't needed is off and
   invisible (locations, sellers, fiscalisation, payments, suppliers, kept
   change) until the owner turns it on from the checklist (`07`).
2. **One main action per screen**, as a big button. Everything else is
   secondary.
3. **Sensible defaults everywhere:**
   - today's rate;
   - the usual currency;
   - a walk-in customer;
   - exact cash.

   A cash sale is: items, **Pay**, done.
4. **Undo instead of "Are you sure?"** Removing a line or cancelling a sale
   can be undone for a few seconds. Owner-PIN checks stay only for money that
   leaves: refunds, pay-outs and big discounts.
5. **Work happens out of sight:**
   - syncing, fiscal day open and close, retries, sending receipts to ZIMRA,
     rates reminders, backups;
   - **one status dot** (green, amber or red) is all the seller sees;
   - tapping it explains, in plain words, what's wrong and the one thing to do.
6. **Errors say what to do**, never a code. "No internet: sales are saved and
   will send later" rather than "HTTP 503". ZIMRA codes go in the report
   details (below), not on the screen.
7. **Never block a sale.** No dialog appears mid-sale for sync, an update, a
   rate or a backup. Anything that needs attention waits until the sale is
   done.
8. **Big touch targets and big numbers**, readable in sunlight, usable with
   one hand. Amounts always show their currency.
9. **Speak the shop's language.**
   - English, Shona and Ndebele.
   - Shop words: "Cash up", not "Reconciliation"; "Kept change", not "Customer
     liability".
10. **Reports answer questions**, not show tables:
    - "How much did I make today?"
    - "What's running out?"
    - "Who owes me?"
    - "Which seller was short?"

    Each is one card on the home screen, with the sheet behind it for anyone
    who wants detail.

**Targets to test against:**

- First sale within 5 minutes of installing.
- A cash sale of 3 scanned items in under 10 seconds.
- A cash-up in under 2 minutes.
- A stock take, by scanning or ticking, with no typing except counts.
- No screen where a first-time user hesitates for more than 5 seconds.

**How to check them:**

- Sit with five real vendors (a stall, a tuck shop, a small grocer) and give
  each a task with no help.
- Record the screen (with their permission) and time each task.
- Every hesitation over 5 seconds is a bug, filed like any other.
- Repeat before every release that changes a screen.

## Problem reports, tracked in public

The owner or seller should reach you in seconds, from where they already are,
and every problem should be tracked in the open.

**In the app: "Something wrong?"** It's on the menu, and the app also offers it
after a crash or a failed sync.

1. The person types a sentence or records a voice note, and can attach a
   screenshot of the current screen.
2. The app adds the technical details by itself:
   - app version, phone model and Android version;
   - sync and fiscal state;
   - recent ZIMRA error codes;
   - the last log lines.

   It **removes** business data: no shop name, TIN, amounts, customer details,
   file IDs or keys.
3. They see what will be sent, then tap **Send**.
4. They get a **reference**, like `DR-1042`.
5. A **"Chat on WhatsApp"** button opens your support number with
   "About DR-1042: …" filled in, so the conversation and the report are
   linked. Facebook, email and a phone call work the same way: the reference
   is the link.

**Tracking (public):**

- Each report becomes a **GitHub issue** in the public repo: the summary,
  details with the business data removed, and the reference. Crashes are
  grouped too.
- Anyone can see what's open, what's being fixed, and in which release.
  Nothing is hidden, and no shop's data is exposed.
- **Closing the loop.** When the issue closes, the app shows "Your report
  DR-1042 is fixed in version 1.6. Update now."
- **Private details,** when needed to fix something: the person can choose
  "also send my shop details privately". These go only to you, are never in
  the public issue, and are deleted after 90 days.
- **Without Firebase** (switched off, or the build without Google services):
  the report is shared as text through WhatsApp or email, and you file the
  issue by hand.

## Firebase: optional, and kept inside the free tier

Firebase runs the parts *you* manage: crash reports, problem reports, update
notices, feature switches. It **never holds a shop's business data**; that
stays in the shop's Google Drive.

| Use | Firebase product | Cost |
|---|---|---|
| Crash reports | Crashlytics | Free |
| Problem reports, and their fixed or open status | Firestore (one small document per report) | Free tier (tens of thousands of writes a day) is far more than enough |
| "Update available" and service notices | Cloud Messaging | Free |
| Kill switches and gradual feature rollout | Remote Config | Free |
| Anonymous screen timings, to find slow screens (the 5-second rule) | Analytics, **opt-in** | Free |
| Blocking fake reports | App Check with Play Integrity | Free up to a daily quota |
| Turning reports into GitHub issues | **Not** Cloud Functions, which need the paid plan. A scheduled GitHub Action reads new reports and opens issues; free for a public repo | Free |

**Avoid:**

- Cloud Functions and Cloud Storage: both need the paid Blaze plan (Storage
  for new projects).
- Phone-number sign-in: SMS costs.
- Anything that holds business data.

**The off switch:**

- Every Firebase feature is optional at three levels:
  - you can turn it off remotely;
  - the owner can opt out in Settings;
  - there's a build without Firebase at all, which F-Droid needs for a free
    and open-source listing.
- The app works the same without it; only crash reports and in-app report
  tracking fall back to the share sheet.

**Privacy wording to update.** `05` says Dura's developers can see
"nothing". With Firebase, that becomes:

> Crash reports and problem reports you choose to send, with business data
> removed. Never your sales, stock, customers or keys.

The Play Store's data safety form must say the same.
