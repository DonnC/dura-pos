# Dura POS: feature design

28 October 2026. This note replaces sections 1 and 7 of `01-assessment.md`. The
business model is settled:

- open source, with no vendor cloud;
- the owner's own Google account (Sheets and Drive) is the only shared place;
- integrations use the owner's own keys (ZIMRA, payments), built in so the owner
  only tests and goes live;
- consulting for those who want it done for them.

## Who it's for

Street vendors, tuckshops, small retailers and service sellers.

- Usually **1 phone**; sometimes a few; at most about **10**.
- Often **the owner is the only seller**. When there are helpers, only the owner
  needs to see across phones.
- The real competitor is the exercise book, so the app has to be **faster than
  writing it in the book**.

Everything below is sized for that. A shop with one phone never sees a screen or
setting that only matters to a shop with five.

## How the data is organised

The app is built around sheets. The owner's Drive holds a `Dura POS` folder, in
chunks that stay fast and are easy to find:

```
Dura POS/
  My Shop                  permanent: products, staff, settings, this year's Ledger tab, Stock
  2026/
    Activity 2026          yearly: the audit trail
    2026-10 Sales          monthly: sales, items sold and cash-ups for that month
    2026-11 Sales
    …
  2025/
    Ledger 2025            last year's ledger, moved out of My Shop at year end
    Activity 2025, 2025-01 Sales … 2025-12 Sales
```

### `My Shop` (permanent)

The main tabs are below. The full list (Taxes, Currencies, Payment Methods,
Exchange Rates, Stock Counts, Payment Callbacks, Summary), with every column,
is in `04-data-files.md`, and there's a worked example in `../samples/Dura POS/`.

| Tab | Who writes it | What it holds |
|---|---|---|
| **Products** | Owner, in the sheet or the app | Name · Barcode · Price · Currency · Tax · HS code · Low-stock level · Active |
| **Stock** | Formulas only, read-only | Item · Location · In stock · Low-stock level · Status (OK / Low / Out) |
| **Staff** | Owner | Name · Role (Owner / Seller) · Active. PINs never go here; they stay on the phone |
| **Phones** | App, when a phone is set up | Phone · Location · ZIMRA device ID · Last synced |
| **Locations** | Owner | Usually just `Main` |
| **Settings** | Owner | Business name, currencies, exchange rate, low-stock alert on or off |
| **Ledger 2026** | App (rows added only) | This year's single ledger, described next. It lives here so the Stock formulas never have to read another file |

### The Ledger: the one place where phones meet

One row per movement, from any phone:

Date · Time · Phone · Seller · Location · Type · Item · Qty (+/−) · Amount · Currency · Reference · Row ID

| Type | Example |
|---|---|
| Opening | Stock and cash carried over on 1 January |
| Stock in | A delivery from a supplier |
| Sold | The items in a sale (for a busy phone, one row per item per sync batch) |
| Returned | A customer return |
| Moved | Out of one location and into another, as two rows with the same Reference |
| Counted | The difference found by a stock count |
| Cash | Float in, cash taken out, a small expense |

Stock on hand is the sum of Qty per item and location, and the Stock tab works
it out with formulas. No phone ever writes a stock figure, so no phone can
overwrite another's.

### `Activity <year>`: the audit trail

Date · Time · Phone · Who · What · Details. It records:

- signing in;
- refunds;
- discounts over the limit;
- price changes;
- voided lines;
- opening the drawer;
- cash-up differences;
- changes to settings;
- anything fiscal (day opened or closed, a receipt flagged by ZIMRA);
- syncs, and any rows the app skipped.

Manual edits to the sheets show up in Google's own version history, with the
person and the time.

### `<year>-<month> Sales`

| Tab | What it holds |
|---|---|
| **Sales** | One row per sale: Date · Time · Phone · Seller · Receipt no · Total · Currency · one column per payment method · Fiscal status · Sale ID |
| **Items Sold** | One row per item line: Sale ID · Item · Qty · Price · Line total |
| **Cash-ups** | One row per phone per day: expected and counted per currency, and the difference |
| **Summary** | Formulas only: the month by day, by phone, by payment method and by item |

Monthly files keep each file small and quick to open on a phone. They also match
how people think: "show me October". For a 1–10 phone shop, chunking by phone
isn't needed. A Phone column filters just as well, and the rules below stop
phones from colliding.

### Rules that keep it safe

1. **Phones add rows; they don't rewrite them.** Every row has a Row ID or Sale
   ID. Before adding, a phone checks which IDs are already there, so a retry
   after a dropped connection never creates a duplicate. Many phones can add to
   the same tab without overwriting each other. The only edits a phone makes are
   to status cells on rows **it** wrote, found by ID: for example, a receipt's
   fiscal status moving from Queued to Submitted. Nothing is ever deleted.
2. **Formulas never reach into another file.** Formulas that read another file
   (IMPORTRANGE) are slow, need a one-time "Allow access" click, and break when
   a file is moved or renamed. So every file works things out from its own
   tabs:
   - each month's Sales file summarises that month;
   - `My Shop` works out stock from its own Ledger tab.
3. **Files and tabs are found by their ID, columns by their heading.** Renaming,
   moving or reordering anything doesn't break the app. If a tab or file is
   deleted, the app rebuilds it from the phone's own copy and records that in
   Activity.
4. **The owner's edits are checked before they are used.** Products, Staff and
   Settings are read on each sync. Valid rows are applied, and skipped rows are
   listed with the reason (no price, a tax ZIMRA doesn't list, no HS code for a
   VAT payer).
5. **Formula tabs carry a warning-only lock**, and so do the sales tabs.
6. **At year end**, the app:
   - moves the year's Ledger tab out of `My Shop` into its own `Ledger <year>`
     file in that year's folder;
   - starts the new year's Ledger tab with opening balances.

   `My Shop` stays small, and there's only ever one live ledger.

### When it syncs

- **Background worker**: when online, in batches with one request per batch.
  Android's scheduled background work runs at most every 15 minutes. A sale
  made while online also triggers a short-delayed sync, so the owner's view is
  usually only a few minutes behind.
- **Sync now** button: whenever the owner wants.
- **End of day**: every cash-up syncs before it's marked done.
- **Wi-Fi only** is an option for backups, to save mobile data.

### What stays on the phone only

- Seller PINs, stored as hashes.
- Payment keys, encrypted with a key held in the phone's Keystore.
- ZIMRA fiscal state: fzimra holds it, and the device key never leaves the phone.
- The phone's full local copy, so selling never waits for the network.
- A daily database backup goes to the app's hidden Drive folder, so a lost
  phone's business data can be restored on a new one.

## Phones and sign-in (decided 28 Oct 2026)

- **The owner's Google account is the shop's account on every phone.** When a
  phone joins the shop, the owner signs it in to Dura once. All phones then
  reach the same `Dura POS` folder.
- **Sellers only ever use the app side.** They sign in to Dura with their PIN
  and can sell and cash up. They see no sheets, settings or Google screens
  unless the owner raises their access in **Staff**.
- **Recommended: a Google account just for the shop** (for example
  `chipos.cornershop@gmail.com`), rather than the owner's personal one. Android
  may add the account to the phone itself, so this keeps the owner's personal
  Gmail, Photos and WhatsApp backups off sellers' phones. It also keeps the
  shop's Drive storage separate.

The security side of this is in `05-archiving-and-security.md`.

## Limitations of Google Sheets and Drive for these users

Owners already know Google Sheets, and how to export, download, recover an
account and manage storage. So the app only needs to:

1. **Do everything itself.** Many vendors only have a phone, so the spreadsheet
   is a bonus, not a requirement.
2. **Remind once at setup** to add a recovery phone number and email to the
   Google account, then never ask again.
3. **Say plainly when Google refuses a write**, for example "Your Google storage
   is full; sales are safe on this phone". Selling carries on.
4. **Survive people changing the sheets.** Rules 3–5 above cover this.
5. **Keep files small** so they open fast on cheap phones, which the monthly
   and yearly chunking does.
6. **Batch** (one request per sync), which keeps the app within Google's limits:
   - 60 requests a minute per user;
   - 300 requests a minute per app project, across every shop.

   Ask Google early for a higher project limit.
7. **Pass Google's sign-in review** before launch. Otherwise owners see a
   "Google hasn't verified this app" screen. `drive.file` keeps the review
   light.
8. **Show each phone's last-synced time**, because "live" means a few minutes.

## The features, right-sized

### Selling (the core)

- **Two or three taps per sale**: tap or scan, take the payment, done. Big
  buttons, works offline, runs on a cheap phone.
- Quick sale for items not in the list, discounts, returns and change.
- Print the receipt over Bluetooth, or share it on WhatsApp or as a PDF. Check
  which forms ZIMRA accepts for fiscal receipts.

### Locations

- Hidden until needed; every shop starts with `Main`.
- A second stall gets its own location, and each phone is assigned to one.
  Stock is then per location.
- A move between locations is two "Moved" rows in the Ledger with the same
  Reference.

### Sellers

- Off by default: the owner sells alone, and nothing asks for a PIN.
- When a helper starts, switch it on. Each seller gets a PIN, set on the phone.
  - **Owner** can do everything.
  - **Seller** can sell. Refunds, larger discounts and price changes need the
    owner's PIN.
- **End of day**: count the cash per currency and compare it with what's
  expected. The cash-up row goes to Sales, and any difference to Activity.

### The owner's view across phones

- With one phone, the phone is the view.
- With several, the owner sees stock in `My Shop`, the month in its Sales file,
  and who did what in Activity. The app's owner screen reads the same files.
  Each phone's last-synced time is always shown.

### Stock and alerts

- Each product has a low-stock level. The phone warns at once, offline too.
- The Stock tab shows Low and Out in colour.
- When several phones sell from one location, each phone includes the others'
  sales up to their last sync. The sheet is exact once all have synced.

### Stock take

- Walk the product list (or scan) and enter what's there. The app shows
  expected against counted.
- Each difference becomes a "Counted" row in the Ledger, and the count itself
  goes to Activity.
- Count everything, or just a few fast movers.

### Fiscalisation (the business's own ZIMRA credentials)

- Off by default; one switch turns it on.
- Each phone is its own fiscal device, with its own device ID and activation
  key. fzimra does the rest.
- The app guides the owner through ZIMRA's steps: test, then sample documents,
  then live.
- One rule from the spec stays: each day's receipts must reach ZIMRA before that
  day closes.

### Payments (the business's own keys)

- Cash always. Mobile money and cards through the owner's own merchant keys, via
  an aggregator such as Paynow or a direct API.
- Sandbox first, then live.
- Each payment method maps to a ZIMRA money type.

**Confirming a payment: the phone asks, and that is the default.**

At a stall the customer is standing right there, approving the payment on their
own phone, so the till simply **asks the provider for the status every few
seconds** until the payment is paid, cancelled or timed out. With Paynow, the
start of every payment returns a *poll URL* for exactly this, and Paynow's own
guidance is to confirm a payment by polling even when a result URL is used. No
callback and no server are needed.

**An optional receiver for callbacks: Google Apps Script, in the owner's
account.** Use it only if a provider insists on a callback, or if a shop wants
payments confirmed while its phone is offline.

- It's a web app script that is copied from a Dura template sheet into the
  owner's account and deployed with a few clicks. A consultant can do this for
  them.
  - It runs as the owner.
  - It's open to anonymous callers, because a payment provider doesn't log in.
- It writes each callback as a row in a **Payments** tab, and the till reads
  that tab on its next sync.
- **Security rules, all required:**
  1. **Check the callback's signature.** Paynow signs each message with SHA-512
     over its fields plus the merchant's integration key, and the script
     recomputes that and refuses anything that doesn't match.
  2. **Never trust the callback alone.** It is only a nudge. The till still
     confirms by polling Paynow before it marks a sale paid, so even a perfect
     fake can't record a payment.
  3. **Keep secrets in the script's private properties**, never in the sheet.
  4. **Record each payment reference only once**, because providers retry
     callbacks.
- **Limits to know:** it is free, and these are Google's figures for gmail.com
  accounts:
  - 6 minutes per run;
  - 30 runs at once per user;
  - 20,000 outgoing requests a day.

  That's far more than a stall needs.
- **A quirk to test:** Apps Script answers a POST with a redirect (HTTP 302)
  before the response. Some providers count that as a failure and retry. The
  script still runs, and rule 4 makes retries harmless, but test each provider.
- **Keep the same deployment when updating the script** (edit the existing
  deployment). A new deployment changes the URL that the provider calls.

### Backup and a new phone

- The sheets are the readable copy, and the daily database backup in Drive's
  hidden data is the restorable copy.
- A new phone: sign in, pick the phone to restore, and everything comes back.
  If fiscalisation was on, the new phone needs new ZIMRA credentials.

## Suggested first phase

1. **Prototype first:** a second phone joining the shop with the owner's Google
   account. It should see the same `Dura POS` folder under the narrow
   `drive.file` permission, and sellers should be kept to the app side.
2. Then one phone and one owner:
   - selling;
   - `My Shop` with Products and Stock;
   - the Ledger;
   - monthly Sales files;
   - low-stock alerts;
   - end-of-day cash-up;
   - receipts printed or shared;
   - background sync and Sync now.

Activity, sellers, locations, stock take, fiscalisation and payments follow as
separate phases.
