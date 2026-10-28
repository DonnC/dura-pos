# Assessment: Apps Script as the shop's gateway

28 October 2026. This assesses `../GeminiAppScriptResearchHistory.md` against the
current design (`03-feature-design.md`, `04-data-files.md`,
`05-archiving-and-security.md`).

## What the research proposes

The phones never talk to Google Sheets directly. The owner deploys an Apps
Script web app (run as the owner, open to anyone with the URL), and every phone
sends its batches, stock pulls and payment requests to that URL. The script
writes the sheets, holds the payment keys, starts payments and receives the
provider's callbacks.

## Verdict

**The gateway idea is worth taking seriously.** It answers the question we
settled today by compromise: with it, a seller's phone needs **no Google
account at all**. Nobody on a shop phone can open Drive or Sheets, and the
payment keys sit in one place instead of on every phone.

**Most of the detail around it is wrong or unsafe**, and should not be copied.
It needs a prototype before it replaces the current sign-in decision.

## What's right

- **No Google account on sellers' phones.** This is the one thing the current
  design can't give. Today, the shop account on every phone means anyone with
  an unlocked phone can open Drive; `05` can only soften that with a shop-only
  account.
- **Payment keys in one place.** Keys live in the script, not on each phone. A
  lost phone no longer means regenerating the integration key and re-entering
  it everywhere; you revoke that phone's access instead.
- **One script does both jobs.** The callback receiver we already planned as
  optional becomes the same deployment.
- **Each shop runs on its own Google quota.** For 1–10 phones the limits don't
  matter: 30 simultaneous runs, 6 minutes per run, 20,000 outside calls a day.
- **Local database, batch upload, morning stock pull.** These match the
  current design.
- **`LockService` around writes.** That's the right tool, and phones batching
  means the lock is rarely contended.

## What's wrong or unsafe

| Claim in the research | Problem | Do instead |
|---|---|---|
| Direct Google APIs mean "baking client secrets into the APK" | False. Android OAuth clients have no secret; Google identifies the app by its package name and signing certificate. This is not a reason to choose Apps Script | Choose on the merits below |
| Web app open to "Anyone, even anonymous", checked by device ID | The URL becomes the only password. Device IDs aren't secret, and Android apps can't read the IMEI since Android 10. Anyone holding the URL could post fake sales or read the price list | Pair each phone once, from the owner's phone, to get its own random token. Sign every request with it (HMAC over body + time), reject old timestamps, and revoke a phone by deleting its token |
| Paynow ID and key in a `Config` sheet tab | Anyone who can open the sheet sees the keys. That contradicts `05` | Script Properties only |
| `PIN_Hash` column in a `Registry` tab (`e10adc39…` is unsalted MD5 of `123456`) | A 4-digit PIN in a readable sheet is cracked instantly, salted or not | PINs stay on the phone, as in `05` |
| Callback handler appends a row when `status === "Paid"` | No hash check and no re-confirmation, so anyone can post "Paid". There's no duplicate check, and the lock is never released on error | Follow `05`: verify the SHA-512 hash, confirm by polling, record each reference once, release the lock in `finally` |
| A script bound to each yearly file; "point the app to the new script URL" each January | Every phone needs reconfiguring every year, and one missed phone stops syncing | One script, bound to `My Shop`, opening the month and year files by ID |
| A ZIMRA "middleware" in the script picks up `PENDING_ZIMRA` rows | **Impossible.** FDMS needs the device's private key and a client certificate (mutual TLS). Apps Script's `UrlFetchApp` can't present a client certificate, and the key must never leave the phone. Receipts are signed on the phone at the moment of sale | Fiscalisation stays on the phone with fzimra; the script never touches it |
| `INV-27-00001` invoice numbers | Two offline phones would make the same number | Phone-prefixed IDs, as in `04` |
| `Total_USD` and one payment method per sale | Not multicurrency, and no split payments or change | The Sales and Payments tabs in `04` |
| Year-only database file | It works, but a year of sales in one file gets slow to open on a phone | Keep the monthly Sales files |
| Code samples (Paynow URL `https://paynow.co.zw`, `resulturl` of google.com) | Placeholders that wouldn't work | Write from Paynow's documentation |

## What it costs: the real trade-offs

1. **Setup is harder.**
   - The owner must open the script, deploy it as a web app, and approve it.
   - For their own unverified script, Google shows a "Google hasn't verified
     this app" screen, and the owner has to click *Advanced → Go to … (unsafe)*.
     A shop owner may stop there.
   - Doing the deployment from the app needs the Apps Script API. The owner
     must turn that on by hand in their Apps Script settings, and its scopes
     need Google's verification of Dura.
   - Compare the current design: one ordinary Google sign-in screen with the
     narrow `drive.file` permission.
2. **Updates are harder.**
   - Every shop runs its own copy of the script. A bug fix means every owner
     has to update and redeploy.
   - Options:
     - the app checks the script's version, and refuses or warns when it's
       too old;
     - the shop's script calls a shared Dura library at a pinned version.
       Updating is still a manual step, and library calls are slower.
   - The current design has no server code to update.
3. **The phones depend on the script.**
   - Requests are slower: a cold start takes a second or two, and every POST
     comes back as a redirect. That's fine for background batches, but not
     for anything a seller waits on.
   - If the owner breaks or removes the deployment, every phone stops syncing.
     They keep selling offline.
4. **Limits move from Sheets API quotas to Apps Script quotas.** Both are far
   above what a 1–10 phone shop uses.

## Recommendation

Prototype both before choosing. Phase 0 already includes prototypes, and the
second-phone `drive.file` test in `03` is still open.

1. **Gateway prototype:**
   - a template sheet with its bound script;
   - deploy it from a fresh consumer Google account, timing the steps and
     screenshotting the "unverified" screen;
   - pair one phone by token, post one signed batch, receive one Paynow
     sandbox callback.
2. **Decide on what the owner actually goes through.**
   - If a shop owner can get through the deploy in a few guided minutes,
     switch:
     - sellers' phones have no Google account;
     - the owner's phone still signs in, to create files and to deploy;
     - payment keys sit in the script;
     - ZIMRA stays on each phone.
   - If not, keep today's decision (the shop account on every phone). Offer the
     gateway later as an option for shops that want locked-down phones.

**Either way, these hold:**

- the files and tabs in `04`;
- fiscalisation on the phone;
- PINs on the phone;
- confirming payments by polling.

The gateway changes only *how* rows reach the sheets and where the payment keys
live.

If the gateway is chosen, `03` (sign-in) and `05` (who can reach the data,
payment keys, the lost-phone checklist) need updating.

## Second excerpt: onboarding, updates, several files

Assessed 28 October 2026, from a further Gemini answer the user pasted.

### Agrees with the design (`04`, `07`)

- Columns found by heading, never by position.
- Migrations that check before acting ("add the column only if it's missing").
- Several files opened by ID, with the IDs recorded in one place: its
  "Strategy A" is our files-found-by-ID rule.

### Wrong or unsafe

| Claim | Problem | Do instead |
|---|---|---|
| A shared Apps Script library means "every business is updated instantly and automatically" | False. Each shop's script uses the library version it has selected, and moving to a new version is a manual edit in every shop. Development mode (always the latest code) only works for people with edit access to the library. If it did work as described, one bad push would break every shop at once, and it would run the publisher's code inside every shop's Google account | A thin script, updated in place from the owner's phone (`07`) |
| The owner types a device token into a `Device_Registry` sheet tab (6 characters, or the hardware ID; example `HRE-01`) | Slow for the owner, and guessable. Anyone who can read the sheet can read it. Hardware IDs aren't secret, and apps can't read them on modern Android | A QR code from the owner's phone, carrying a long random token. Only its hash is stored, and every request is signed with it |
| "One-click authorization" | It's about seven steps (Extensions → Apps Script → Deploy → New deployment → Web app → Execute as me / Anyone → authorize past the "unverified" screen), then pasting the URL into the app | If the gateway is used, guide it with screenshots and hand the URL to the phones by QR. Prototype it first (above) |
| Each sale deducts stock in a separate `Stock_Levels` file | A read-then-write across two files, with no transaction. A failure between the two writes leaves sales and stock disagreeing, and two writers can overwrite each other | Append-only Ledger rows; stock is the sum, worked out by formula |
| "Strategy B": find files by name across Drive | Breaks on a rename or a second file with the same name. Needs full-Drive access ("see and delete all your files") | IDs recorded when the file is created |
| Migration fills formulas down a data column | Mixes formulas into data tabs | Formulas only in Dura tabs, which are rebuilt (`07`) |
| Code samples | `getRange(1, 1, 1, getLastRow())` should use `getLastColumn()`. `appendRow` one row at a time is slow. A `waitLock` timeout throws and isn't caught. A header the owner renamed silently drops that value | Batch `setValues`, and catch lock timeouts. Fail loudly on unknown fields, and protect header rows |

### One real decision it exposes

The "make a copy" template link and the current design don't mix:

- **Template copy:** the files are copied by the owner in the browser, not
  created by Dura. Under `drive.file`, the app can't open them directly, so
  every read and write must go through the script.
- **Current design:** Dura creates the files from code, which `drive.file`
  allows. A script can't be attached to those files without the Apps Script
  API.

So the gateway is all or nothing:

- **Either** the template copy, with the script doing every read and write;
- **or** files created by the app, with the script only as the optional
  callback receiver.

The prototype in this note decides between them.
