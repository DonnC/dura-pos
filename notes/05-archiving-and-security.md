# Dura POS: archiving and security

28 October 2026. Read with `04-data-files.md`. The sample in
`../samples/Dura POS/` shows the archive and every tab mentioned here.

## Archiving

### Every day

- Phones add rows when they sync, and never delete anything.
- At cash-up, each phone saves a backup of its database to Drive's hidden app
  data. Each phone keeps its last 14 daily backups and removes older ones.

### Every month

- **Only the owner's phone creates files.** Around the 25th, it creates next
  month's `<yyyy-mm> Sales` file, so the file exists before any phone needs it.
  This stops two phones creating two copies of the same month at the same
  moment.
- If a phone has a sale for a month whose file doesn't exist yet, it keeps the
  rows on the phone. It sends them once the file appears. Nothing is lost
  while it waits.
- Last month's file stays where it is. It's complete once every phone has
  synced past the month end; the Phones tab shows each phone's last sync.

### Every year

The live tabs in `My Shop` never change name: `Stock Ledger`, `Money Ledger`,
`Stock Counts`, `Purchases`, `Payment Callbacks`. The year they hold is
`Settings` → `Data year`, and the Summary reads it from there. So no formula
ever names a year, and nothing breaks on 1 January.

1. **In December**, the Shop Hub (or, without one, the owner's phone) creates the next year's folder and its
   `Activity <year>` file, along with January's Sales file.
2. **On 1 January, nothing changes shape.** Phones keep adding rows to the
   same tabs.
   - Stock stays right, because it's the sum of every row.
   - The Summary's year-to-date figures count only rows from `Data year`,
     because they filter by date.
3. **Archive, once every active phone has synced past 31 December** (or after
   14 days, with a warning in Activity naming any phone that hasn't), the
   Shop Hub runs it at night (`12`). Without a hub, the owner's phone runs it
   when it's next online:
   1. copies last year's rows from each live tab into `<year>/Ledger <year>`,
      as `Stock Ledger <year>`, `Money Ledger <year>`, `Stock Counts <year>`,
      `Purchases <year>`, `Payment Callbacks <year>` and
      `Exchange Rates <year>`;
   2. reads the copy back and checks the row counts and totals match;
   3. adds `Closing Stock <year>`: stock per product and location, and open
      balances per contact and currency;
   4. in one Sheets update, removes last year's rows from the live tabs and
      adds `Opening` rows dated 1 January: stock in the Stock Ledger, balances
      in the Money Ledger. This is the only time rows are removed, and only
      after step 2 has passed;
   5. sets `Data year` to the new year;
   6. records the archive in Activity.
4. **If the archive stops halfway** (lost connection, closed app), it starts
   again from the beginning next time. Each step checks what's already been
   done, so nothing is copied twice or lost.
5. **Late rows.** If a phone syncs last year's rows after the archive, they
   are added to `Ledger <year>`, and a correcting `Opening` row is added to the
   live tab, so stock stays right.

`My Shop` stays small, and there's only ever one live set of tabs. Closed
years aren't written to again, except by step 5.

### How long to keep it

- **Drive:** keep everything. The files are small: in the sample, a busy month
  for three phones is under 1 MB, and `My Shop` with ten months of ledger is
  about 1.6 MB. ZIMRA expects business records to be kept for several years
  (commonly six). The owner should confirm this with their accountant.
- **Phones keep only what they need.** The sheets are the record, so a phone
  is a working copy, not an archive (see "What a phone keeps" below).
- **Fiscal data on the phone:** fzimra keeps receipts that are pending or
  rejected until they're resolved, and prunes accepted ones after 7 days.
  ZIMRA's own record is the master. The Sales files keep each receipt's fiscal
  number, status and verification code for good.

### What a phone keeps

A phone keeps what it needs to sell and look after its own drawer. Anything
already synced is cleared after a short time, so the phone stays fast and
small.

| Kept on the phone | For how long |
|---|---|
| Products, prices, rates, customers, suppliers, staff and settings | Always, refreshed from `My Shop` |
| Stock for its own location | Always, worked out from its copy and refreshed on sync |
| Anything not yet synced (sales, payments, ledger rows, activity) | Until it's synced. Never cleared before that |
| Fiscal receipts not yet accepted by ZIMRA, and the current fiscal day | Until ZIMRA accepts them, as fzimra does |
| Open items: unpaid invoices, open quotes, kept change balances, unpaid supplier invoices | While open |
| Its own synced sales, payments and cash-ups | **7 days** after sync, for reprints, returns and the week's reports. Then cleared |
| Reports (day and week summaries) | Worked out from the 7 days it holds. Anything older is read from the sheets when asked, which needs a connection |

- **Older sales still work.** A return or reprint of an older sale looks it
  up in the sheets by receipt number or QR code. Returns need a connection
  after 7 days.
- **Clearing is safe.** A row is cleared only if it's synced *and* the phone
  has read it back from the sheet once, so a failed upload can never be lost
  to clearing.
- **The owner sets the time:** 7 days by default, up to 30.
- **The daily backup** in hidden app data holds the phone's working copy, not
  its history.

### Moving to another system

Every file downloads from Google Sheets as `.xlsx` or `.csv` (File →
Download). The tables are flat, one row per thing, with stable IDs, so they
import into Excel, an accounting package or another POS without rework.

For a full move, export:

- `My Shop`: Products, Ledger, Staff, Settings;
- every `<yyyy-mm> Sales` file;
- the `Activity` files.

## Security

### Who can reach the data

| Who | How | What they can do |
|---|---|---|
| Owner | The shop's Google account; the owner PIN in the app | Everything: sheets, settings, staff, prices, payments, fiscal setup, exports |
| A seller | The shop's phone, signed in to Dura with their own PIN | **App only** by default: sell, see stock, cash up. Refunds, discounts over the limit and price changes need the owner's PIN. No sheets, settings or Google screens unless the owner raises their access in Staff |
| An accountant | The owner shares a file, view-only, from Google Drive | Read the files shared with them |
| Dura's developers | Optional Firebase (see `08`) | **No business data.** There's no Dura server for shop data; it never leaves the shop's own Google account. Dura's developers see only crash reports and the problem reports a person chooses to send, with business data removed |

### The Google account

- **Use a Google account just for the shop.** Every phone signs in to Dura with
  the shop's account. Android may add that account to the phone itself, and
  anyone using an unlocked phone could then open Drive or Sheets directly.
  With a shop-only account, all they could see is shop data, never the owner's
  personal email, photos or chats. It also keeps the shop's storage separate.
- **Narrow permission:** Dura asks Google for `drive.file`. With it, Dura can
  see and change only the files it created. It can't read anything else in the
  Drive, even in the shop account.
- **Turn on the account's own protections:** a strong password, 2-step
  verification, and a recovery phone number and email. Dura reminds the owner
  once, at setup.
- **Removing a phone's access:**
  - Google Account → Security → *Your devices* → sign the phone out;
  - or Google Account → Security → *Third-party access* → remove Dura, which
    signs out every phone at once;
  - then sign the phones that should stay back in.

### PINs

- Each person's PIN is set **on the phone** and stored there only, as a salted
  slow hash (PBKDF2 or Argon2). It is never in a sheet, a backup or a log.
- After 5 wrong tries the phone locks the PIN screen, for longer each time.
- The owner's PIN is separate from the phone's screen lock, and should be
  different from every seller's PIN.
- On a new phone, PINs are set again rather than restored.
- **Behind the owner's PIN:**
  - Settings, Staff, product and price edits;
  - payment and fiscal setup;
  - the Google account screen (sign-out, open sheets, export);
  - refunds, discounts over the limit, and removing a phone.

### Payment keys (Paynow and others)

- They are entered on each phone and encrypted with a key held in Android
  Keystore. They're never written to a sheet, a backup or a log.
- Sandbox and live keys are separate, and Payment Methods shows which mode is
  on.
- When a phone is lost or retired, regenerate the integration key with the
  provider and enter the new one on the remaining phones.
- Payments are confirmed by the till **polling the provider**. A payment is
  never marked paid on the strength of an incoming message.

### The payment callback receiver (optional Apps Script)

It runs in the shop's own Google account. It must:

1. verify each callback's signature (Paynow's SHA-512 hash with the
   integration key), and reject anything that doesn't match;
2. treat a valid callback only as a hint, so the till still confirms by polling;
3. keep the integration key in the script's private properties, never in a
   sheet;
4. record each payment reference once, ignoring the provider's retries.

Rejected callbacks are written to `Payment Callbacks` and Activity. The sample
has one, on 14 September 2026.

### ZIMRA fiscalisation

- Each phone is its own fiscal device. fzimra generates its key inside Android
  Keystore, and the key **never leaves the phone**. No sheet or backup holds
  any ZIMRA key or certificate secret.
- Every receipt is signed on the phone and countersigned by ZIMRA, and its
  verification code lets anyone check it with ZIMRA. That signature, not the
  spreadsheet, is what proves a fiscal receipt is genuine.
- When a phone is replaced, the old device is retired and the new phone gets
  its own ZIMRA device (in the sample, P2 → P4 on 19–20 May 2026). The app
  warns early about unsent receipts, because receipts a lost phone never sent
  can't be sent from another phone.

### Keeping the records honest

- **Phones only add rows**, with IDs, and never delete. The only edits are
  status cells on a phone's own rows.
- **Activity** records who did what and on which phone, including every
  approval by the owner's PIN.
- **Google's version history** records every manual edit to a sheet, with the
  time, and can restore an older version. Every phone uses the shop's account,
  so it shows that account. The person is in each row's Seller or Who column.
- **The owner's edits are checked** before Dura uses them, and skipped rows are
  listed.
- **Formula tabs are locked** (warning only), so they aren't wiped by accident.

### Checklists

**A phone is lost or stolen**

1. Sign it out: Google Account → Security → *Your devices*.
2. On the owner's phone, under Phones, mark it **Retired**. Its rows stay in the
   sheets.
3. Tell ZIMRA about the device, and register a new one for the replacement.
4. Regenerate the payment integration key, and enter it on the remaining phones.
5. On the new phone, restore its backup, set PINs, and enter the new ZIMRA
   credentials.

**A seller leaves**

1. In Staff, set their end date. Their PIN is removed from the phones on the
   next sync, and Activity records it.
2. If they ever used the shop's account on their **own** phone, sign that
   device out (Google Account → Security → *Your devices*).

**The owner wants a seller to see stock or sales in the sheets**

- Raise that seller's access in Staff. The access is still through the shop's
  phone, and can be lowered again at any time.
- Alternatively, share one file view-only from Google Drive with the seller's
  own Google account.
