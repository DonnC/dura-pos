# Customers, big lists, onboarding, and updating a shop's sheets

28 October 2026. Read with `04-data-files.md`. The sample now has a
`Contacts` tab in `My Shop` (customers and suppliers together; see `04`), and a
customer on about 1 sale in 15.

## Customers

### In the sheets

- **`My Shop` → `Contacts`** has one row per customer (and per supplier). It's permanent, like
  Products, and is not split by year.
- **Every sale row** carries `Customer ID`, `Customer` and `Customer TIN`.
  Walk-ins, which are most sales, leave them blank.
- **Columns:**
  - name, phone no and email;
  - Person or Business;
  - TIN, VAT number and address, which matter only for a business buyer;
  - usual location;
  - added by (the phone), added on, updated on;
  - active, merged into, and a note.
- **IDs come from the phone that adds the customer:** `P3-C0002`. Two offline
  phones can never make the same ID.

### On the phone

- **The sale screen defaults to a walk-in.** A seller never has to choose a
  customer.
- **"Add customer"** searches the phone's own copy by name or phone number as
  you type, or quick-adds someone with just a name and number. It works
  offline, and the new row goes up with the next sync.
- **A business buyer.** If the shop issues it fiscal invoices, the app asks
  for its TIN, VAT number and address, and puts them in the receipt's buyer
  section.
- **Who can change what:**
  - sellers can add customers;
  - changing or merging an existing customer needs the owner's PIN.

  This keeps a single writer for each existing row. The owner's phone writes
  the change into that customer's cells, found by Customer ID, and sets
  `Updated on`. The owner can also edit the sheet directly; the phones pick
  that up on their next pull.
- **Duplicates.** Two phones may add the same person while offline.
  - On sync, the owner's phone flags customers with the same phone number.
  - The owner merges them with one tap: the extra row gets `Active = No` and
    `Merged into = <the kept ID>`.
  - Old sales keep the old ID, and reports follow `Merged into`.
  - The sample shows this: Mai Tafadzwa, `P3-C0001` merged into `P1-C0006` on
    12 April 2026.
- **History.** A customer's last 7 days of purchases are on the phone; older
  ones are read from the sheets when asked (`05`, "What a phone keeps").
- **Privacy.**
  - Phone numbers and emails are personal information, and Zimbabwe's Cyber
    and Data Protection Act applies.
  - Ask only for what the shop uses.
  - If a customer asks to be removed, the owner sets them inactive and blanks
    their contact details. Their past sales stay, under the ID.
- **Not designed yet:** selling on credit (a customer's running balance). Add it
  only if shops ask.

## 2,000+ products or customers

**The lists themselves are not a problem.**

- **Size in the sheet:** 2,000 products × 15 columns is 30,000 cells. A
  Google Sheet holds 10 million, so even 20,000 products fit easily.
- **One request:** the phone pulls Products, Contacts, Staff, Settings and
  Exchange Rates in a single `values.batchGet`. For 2,000 products and 2,000
  customers that's a few hundred KB, compressed to well under 100 KB, and
  about a second.
- **How it applies the changes:** the phone compares row by row against its
  own copy and saves only what changed. A row that has gone from the sheet is
  set inactive on the phone, not deleted, because old sales still point to it.
- **When it pulls:**
  - at app start and first thing in the morning;
  - on *Sync now*;
  - right after an owner's change made in the app;
  - every hour in the background.

  It doesn't pull on every 15-minute push. Sales only go up, and nothing is
  pulled back down.
- **On the phone:**
  - Room tables are indexed on barcode, name and phone number, with full-text
    search on names. Searching 20,000 rows is instant.
  - Lists page as you scroll, so the full list is never loaded at once.
- **First load:** an owner moving from another system pastes their existing
  list into the `Products` tab, or picks an Excel or CSV file on the phone.
  - Dura checks every row and lists the ones it skipped (no price, a duplicate
    barcode).
  - A list of 2,000 imports in one go.

**What does grow with a big catalogue is the Ledger, and the formulas that
read it.**

- **Ledger size.** `Sold` rows are one per product per phone per batch.
  - For a big catalogue, the phone sends them once per day, at cash-up. During
    the day the app shows live stock from its own data.
  - That's roughly 3 phones × 250 different products a day × 365 days, which
    is about 275,000 rows a year: under half the file's limit.
- **Stock formulas.** One `SUMIFS` per product over the whole ledger gets slow
  with thousands of products.
  - For a big catalogue, Dura replaces the `Stock` tab with one `QUERY` that
    groups the ledger in a single pass.
  - This is exactly the kind of change the update method below makes safely.
- **If a shop ever nears the file limit,** the owner's phone splits the year's
  Ledger into its own file early, the same way the year-end archive does.
  A street vendor or small shop won't get there.

## Onboarding

The aim: **selling within five minutes**, with everything else switched on
later, at the moment it's needed.

**First run on the owner's phone:**

1. **Start my shop**, then one Google sign-in screen. It's the ordinary
   "Dura wants to see and change the files it creates" consent, nothing scary.
2. Shop name, and the currencies you take: USD and ZWG are on, ZAR is one
   tap.
3. Set the owner PIN.
4. **Products**, choosing one of:
   - scan as you go: an unknown barcode asks for a name and price;
   - import a list (a file from the phone, or paste into the sheet);
   - start empty.
5. **Done.** Dura creates the `Dura POS` folder, `My Shop`, this month's Sales
   file and `Activity` *from code*. There's no template link to copy and no
   "make a copy" step.

**Afterwards: a "Set up when you need it" checklist** on the home screen. Each
item is one short guided screen:

| Item | What it takes |
|---|---|
| A second phone | The owner's phone shows a QR code; the new phone scans it, signs in with the shop account, and gets its location and name |
| A seller | Name, which phones, a discount limit; the seller sets their PIN on the phone |
| Another location | Name and address; choose which phones are there |
| Mobile money and card (Paynow) | Paste the integration ID and key, or scan the QR code from the Paynow dashboard; a sandbox test payment; then switch to live |
| Fiscalisation | ZIMRA device ID and activation key, then the ZIMRA test, samples and approval steps, guided one at a time |
| The script gateway (if it's chosen) | Only when the shop adds a seller's phone or payments. A one-person stall never sees this step |

The quick guide is that checklist, plus a 1–2 minute video for each item.
There's no manual to read first.

## Updating a shop's sheets without losing data

Every shop has its own copy of every file, so an improvement must reach them
**without anyone touching a sheet**, and without risking a single row.

### The split that makes it safe

- **Data tabs** hold what the shop typed or sold: Products, Contacts, the ledgers,
  Sales, Payments, Activity, and so on.
  - Dura changes them only by **adding**: a new column, or a new tab.
  - It never renames, moves or removes a column that holds data.
  - Columns are found by heading, so a new column can sit anywhere.
- **Dura tabs** hold no data: `Read Me`, `Stock`, `Summary`, their charts,
  colours, number formats and protections.
  - An update **rebuilds them** completely with the Sheets API, which can
    write formulas, conditional formatting, charts and protected ranges.
  - They're worked out from the data tabs in the same file, so rebuilding
    loses nothing.
- **The owner's own tabs and charts are never touched.**
  - If the owner edited a Dura tab, Dura notices, because it keeps a
    fingerprint of what it last wrote.
  - It renames the edited tab `Summary (your version)` instead of
    overwriting it.

### How an update runs

1. Each file records its **layout version** in the spreadsheet's developer
   metadata, plus a line in `Read Me`.
2. Each app release carries **migrations**: numbered steps from one version to
   the next, as Android's Room does for the phone's database.
3. **Only the owner's phone runs them**, after the owner updates the app.
   - First, it saves a copy of the file into `Dura POS/Backups/` and keeps it
     for 30 days.
   - Then it runs the steps, records them in `Activity`, and shows a short
     "What's new in your sheets" note.
4. **Every step checks before acting**, e.g. "add the column only if it's
   missing". A dropped connection halfway through is simply resumed next time.
5. **Which files:**
   - `My Shop` and the current year's and month's files are updated;
   - closed months and years are left as they are, because they are records.
     A "refresh old summaries" option can rebuild their Dura tabs on request.
6. **New files are always current.** Dura creates each month's and year's file
   from code, so a new month gets the newest layout with no migration at all.
7. **Other phones keep selling throughout.**
   - An app reads and writes its own layout version and the one before it.
   - If the file is newer than a phone's app, that phone keeps selling and
     queues its rows, asks for an app update, and sends once updated.

### The script (only if the gateway is chosen)

The same rules apply. On top of them:

1. **Make it thin enough that it rarely changes.**
   - The script only:
     - checks a phone's signature;
     - appends rows to a tab by heading;
     - reads named ranges;
     - receives payment callbacks.
   - Everything else lives in the app.
   - Requests carry a protocol version, and the app keeps supporting older
     script versions for a long time. Most app releases then need no script
     change at all.
2. **When it must change, the owner's phone updates it in place**, using
   Google's Apps Script API:
   - upload the new code;
   - make a version;
   - point the **existing** deployment at it.

   The web address stays the same, so the other phones notice nothing.

   The costs:
   - the owner turns on "Google Apps Script API" once in their Apps Script
     settings, as part of the guided gateway step;
   - Dura must pass Google's app verification for the script scopes. It's free
     but slow, and needs a homepage and a privacy policy;
   - those scopes reach all of the shop account's scripts, so Dura asks for
     them only when the gateway is turned on. A shop-only account (`05`)
     keeps that harmless.
3. **Fallback:** a guided manual update, three screens long.
4. **Not recommended: a shared Apps Script library.**
   - Each shop still has to move to the new version by hand.
   - Calls through a library are slower.
   - It would run the publisher's code inside every shop's account.

Without the gateway, the only script is the optional payment-callback receiver.
Callbacks are only hints, and polling confirms every payment, so an outdated
receiver can never break a sale.
