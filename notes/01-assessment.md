# Dura POS: assessment of the idea

> **28 Oct 2026:** the business model is settled: open source, no vendor cloud,
> the owner's own keys, and paid consulting on request. Sections 1 and 7 below
> are superseded. See `03-feature-design.md`. The technical corrections
> (section 2) and the ZIMRA questions still stand.

27 October 2026. Reviews the brainstorm in `../Free Open-Source ZIMRA POS Architecture.md`.
Facts were checked against ZIMRA's *Fiscal Device Gateway API v7.2* (the copy in
`zw_compliance/docs/`) and against the public sources listed at the end. Anything
that couldn't be verified is marked **unverified**.

## Verdict

Worth building, but not in the form the brainstorm describes.

The technology is the easy part, and most of the hard core already exists in
fzimra. Three things decide whether this works:

1. **How a business gets onto ZIMRA with a third-party app.** Every business has
   to pass ZIMRA's test-and-approval step before it can issue live receipts. This
   is what vendors are really paid for. Nobody knows yet whether the approval is
   per business or per software model. The answer changes the whole product, so
   ask ZIMRA before writing app code (see `02-questions-for-zimra.md`).
2. **Being better than the free options that already exist.** "Free" on its own
   is not a differentiator any more (see section 1).
3. **Paying for support without charging for the software.** A free product with
   a heavy support load burns out its founder. That needs a plan from day one.

## 1. The market is not what the brainstorm assumed

**Free already exists.** ZIMRA's own FAQ tells SMEs to download the **ZIMRA POS**
app from Google Play for free (Android or Windows), and ZIMRA offers virtual
fiscalisation through its public API at no cost. fiscalization.io advertises a
free virtual fiscal device ("Not a trial. Not freemium. Free."). Roundihmp
charges about US$10 a month. So the pitch can't be "free". It has to be "the free
one that actually works for a shop": offline-first selling, real retail
features, and data the owner holds.

**What paying customers actually buy** is a bundle: a handheld device with a
built-in printer, someone to walk them through ZIMRA's onboarding, and someone
to call when it breaks. The software is the smallest part of that bundle. A free
app takes away the software cost, not the onboarding or the support.

**Who must fiscalise:**

- VAT-registered operators, without doubt (SI 104 of 2010).
- Non-VAT operators: the sources disagree. Several cite section 90 of the Income
  Tax Act as making it mandatory; a vendor guide says it isn't.
- ZIMRA is reportedly targeting about 50,000 informal traders, and the VAT
  threshold is reportedly moving to US$25,000 (October 2026 news). Both would
  grow the group that is obliged to fiscalise.

So the app should also work as a plain, non-fiscal POS. That reaches traders who
aren't obliged yet, and they can switch fiscalisation on when they are.

**Penalty:** ZIMRA's published civil penalty is US$25 per point of sale per day,
capped at 181 days, after which it becomes a criminal offence. The brainstorm's
"up to US$15,000" figure is **unverified**.

**Before building**, install and use ZIMRA POS and fiscalization.io for a day
each. They are the real baseline, and no reviews of either were found.

## 2. Corrections to the brainstorm

| # | The brainstorm says | What's actually true | What it means for Dura |
|---|---|---|---|
| 1 | You can sell offline and sync later, sending the backlog with `submitFile`. | **In online mode** a receipt can be sent late, but every receipt must reach ZIMRA before the day is closed, and closing the day needs internet. A day can't run longer than `taxPayerDayMaxHrs`: after that the device must stop issuing receipts (spec §2.2, ch. 9 req. 4). `submitFile` belongs to the separate **offline mode**, which ZIMRA assigns per device in `getConfig`. fzimra implements online mode only. | In online mode, offline selling is limited to one fiscal day. Longer offline periods need offline-mode support in fzimra (new work) and ZIMRA assigning that mode to the device. Never promise "sell offline for days". The "72-hour grace window" used earlier is not in the spec either. |
| 2 | A fiscal day is limited to 24 hours. | The limit is `taxPayerDayMaxHrs`, which comes from ZIMRA's configuration. A warning `taxpayerDayEndNotificationHrs` before the limit is mandatory. | Read both values from the configuration and never hard-code them. fzimra already does this. |
| 3 | One receipt can be paid partly in USD and partly in ZiG. | A receipt has a single `receiptCurrency`. Each `paymentAmount` is stated in the receipt's currency, and the receipt total must equal the sum of the payments (RCPT039). | The fiscal receipt is in one currency. The physical cash in the drawer (USD notes, ZiG, EcoCash) has to be kept as a separate till record for cash-up. The data model needs two things: fiscal payments, and tender/drawer lines. |
| 4 | Restore the database from Drive onto a new phone. | That's fine for business data. Fiscal state must **never** be restored as live state, or receipt numbers and the hash chain get reused. fzimra's device key can't be exported, so receipts not yet sent from a lost phone can't be sent from another phone. A lost phone leaves its fiscal day open, and the supplier or ZIMRA has to close it manually (spec §2.3). The spec also says the app must not be uninstalled while receipts are unsent (ch. 9 req. 22). | The mitigations are aggressive syncing plus a clear warning when receipts are still unsent. A new phone is a new device and needs new credentials. Say this plainly in the app and the docs. |
| 5 | Loss of a device must be reported to ZIMRA within 8 hours. | Not in the spec. **Unverified.** | Confirm it in the regulations before showing it to users. |
| 6 | Users can't delete the hidden appDataFolder. | Users can delete an app's hidden data from Drive settings, under "Manage apps". | Treat the Drive backup as best effort, not as a guarantee. |
| 7 | `drive.file` is a "restricted" scope. | `drive.file` is the narrow scope: it only covers the files the app creates or the user opens with it. The choice is right; the wording is wrong. | Keep `drive.file` and `drive.appdata`. Check Google's current verification rules before release. |
| 8 | Google Sheets scales for free. | The Sheets API allows 300 writes per minute **per project**, shared by every installation, and 60 per minute per user. A spreadsheet holds at most 10 million cells. | Writing one row per sale stops working after a few hundred active shops. Batch the writes (one `batchUpdate` for each sync window or at day close), ask Google for a higher quota early, and keep monthly files. |
| 9 | The owner edits inventory in Sheets and the app syncs it. | The app must reject invalid items. VAT payers need HS codes (RCPT047/048). Taxes must come from ZIMRA's configuration. A non-VAT taxpayer may not sell VAT items (ch. 9 req. 9). | Don't sync both ways live. Use an explicit "Apply changes" import that lists the errors, and refuse the bad rows. |
| 10 | Keep it closed-source, or forks will commit VAT fraud. | ZIMRA verifies every signature against a certificate it issued itself, so being able to read the source doesn't let anyone forge receipts. The fraud that matters is not issuing receipts at all, and no app can prevent that. The real risk is the model name: requests carry the `DeviceModelName` registered with ZIMRA, and ZIMRA can blacklist a model (DEV04). A bad fork shipping under your model name could get your model blacklisted for every user. | Keep the registered model name for official builds only, protect the name, and make forks register their own model. See section 6. |
| 11 | Use Firebase Analytics now, then use the data later for ads or credit scoring. | This contradicts the core promise that "we never see your data". Processing personal data in Zimbabwe also requires a data controller licence from POTRAZ (SI 155 of 2024), with inspections running since 1 September 2026. | Opt-in crash reports without business data are reasonable. Usage analytics collected for future monetisation spends the trust that this product is built on. |
| 12 | Print receipts on any Bluetooth printer. | The spec's Receipt48 layout has 48 characters a line, which is 80 mm paper. Many cheap Bluetooth printers use 58 mm paper (about 32 characters). fzimra deliberately leaves receipt rendering to the app, and ZIMRA reviews the sample documents. | Ask ZIMRA whether 58 mm layouts and digital receipts (PDF or WhatsApp) are accepted. Implement the chapter 10 layouts exactly. |

What the brainstorm gets **right**, and should be kept:

- The local database is the source of truth, and checkout never waits for the network.
- Money is held in integer cents (or exact decimals).
- IDs are UUIDs.
- Deletes are soft.
- Each receipt keeps a snapshot of the item names and prices at the time of sale.
- Stock is an event ledger.
- Changes are sent through an outbox.
- The owner's data lives in the owner's own Drive.
- Cashier PINs are hashed and kept on the device, never in the spreadsheet.

## 3. The real onboarding path, which is the main feature

ZIMRA's FDMS compliance page describes the virtual route like this:

1. The taxpayer asks for a **test device** by email.
2. The taxpayer tests on the FDMS test environment.
3. The taxpayer closes a fiscal day with no errors.
4. The taxpayer sends ZIMRA sample documents for approval: a fiscal tax invoice
   and a credit/debit note.
5. Once approved, the device is registered in the live environment and gets a
   device ID and activation key.

This is the step vendors are paid to carry. If Dura POS turns it into a
checklist, it becomes the product's strongest feature, worth more than Drive.
The checklist would have:

- a built-in test mode;
- a "make my sample documents" button that issues the sample receipts in test
  mode and exports them;
- a progress view of what's done and what's left.

The open question that matters most: **is the approval per business or per
software model?** If ZIMRA approves the Dura POS model once, onboarding becomes
nearly frictionless for every later business, and that is a real moat. If every
business must be approved separately, the checklist is still the best feature,
but onboarding always involves ZIMRA turnaround time.

## 4. What it takes

| Part | Already exists | Still to build |
|---|---|---|
| Fiscal engine | fzimra 0.1.0 (online mode): Keystore key, numbering, hash chain, queue, day open and close, certificate renewal, simulator. | End-to-end runs against ZIMRA's **test** environment on a real phone. Offline mode (`submitFile`, file export) only if pilots need it; that is a substantial addition. |
| Selling | Example Compose app (a demo, not a product). | Catalogue, checkout, a tender and cash-up screen, receipt printing to spec (ESC/POS over Bluetooth, QR code, chapter 10 layouts), credit notes, X and Z reports, staff PINs and roles, settings. |
| Onboarding | Registration through fzimra. | The guided test → sample documents → live flow described in section 3, with plain-language errors. |
| Stock | — | A stock ledger, receiving stock, stock take with the camera as barcode scanner, variance log. |
| Owner's Drive | — | Batched monthly-sheet export, backup of business data (never of fiscal state), validated inventory import. |
| Operations | — | ZIMRA engagement, Play Store listing, a support channel (likely WhatsApp), short guides in English, Shona and Ndebele, a POTRAZ position if any personal data is processed. |

The rough size: a minimum product that sells, fiscalises, prints, credits, and
does cash-up and the Z report is a few months of focused solo work, on top of
fzimra. The long pole is ZIMRA's approval turnaround and pilot feedback, not the
code. Drive sync and stock take are each smaller than they look, as long as
inventory changes go only one way at a time.

## 5. Architecture notes for the existing schema

- **Don't duplicate fzimra's outbox.** The brainstorm's `sync_outbox` has a
  `ZIMRA_FDMS` target. fzimra already owns fiscal sending with its own durable,
  ordered outbox, so a second one would fight it. The app's outbox should only
  handle Drive and other non-fiscal targets.
- **Keep the business sale and the fiscal receipt separate.** The invoice
  references fzimra's receipt record (global number and fiscal day); it doesn't
  restate the fiscal fields. A sale that hasn't been fiscalised yet must still
  exist and be visible.
- **No "USD base" columns** (`price_usd_cents`, `total_usd_cents`). Each amount
  carries its own currency, prices are kept per currency, and exchange rates go
  in an effective-dated table that records which rate the cashier used.
- **Keep two kinds of payment.** The fiscal payment lines are in the receipt's
  currency. The tender/drawer lines record what physically changed hands. Cash-up
  comes from the drawer lines; the ZIMRA counters come from the fiscal lines.
- **Taxes and HS codes come from ZIMRA's configuration and the item**, never
  from a hard-coded rate (the 15.5% in the brainstorm will change again).

## 6. Open source or closed

This is your call. My recommendation is to make the app **open source**:

- It matches fzimra and zw_compliance.
- It is the only way to prove "we can't see your data", because anyone can read
  the code.
- Closing the source doesn't buy security (see correction 10).

To stop competitors re-skinning it and selling it:

- Use a copyleft licence (GPL-3.0), so anyone shipping a modified version must
  publish their changes.
- Protect the name and logo.
- Keep the ZIMRA-registered model name for official builds only.

One more check: search the Play Store and the trademark register for "Dura", in
case the name collides with something.

## 7. Paying for support without charging for the app

The brainstorm ends with a mandatory onboarding fee, which contradicts "free".
Some alternatives that keep the app free:

- **Hardware partners.** Resellers of handheld Android POS units (models with
  built-in printers) preinstall Dura POS. They earn on the hardware; you get
  distribution.
- **Accountants and consultants** who charge for the onboarding they carry out.
  The app itself stays free.
- **Grants and sponsorship** from SME formalisation and financial-inclusion
  programmes.
- **Later, optional paid extras** for multi-branch businesses, as long as no
  feature that was free becomes paid.

Never monetise the shop's data.

## 8. Suggested order of work

**Phase 0: validate, with no app code.**

- Send ZIMRA the questions in `02-questions-for-zimra.md`.
- Use ZIMRA POS, fiscalization.io and one paid vendor's product.
- Talk to about 10 shops, VAT and non-VAT, and 2 or 3 accountants.
- Go if:
  - a third-party app can be onboarded without becoming an "approved supplier"
    (or that status is reachable); and
  - shops name problems the free options don't solve.

**Phase 1: minimum fiscal POS on one phone.** Sell, receipts printed to spec,
credit notes, cash-up, Z report, and the guided onboarding. Pilot it with 3 to 5
real shops.

**Phase 2: owner's Drive.** Monthly export and the business-data backup.

**Phase 3: stock and staff.** Stock ledger, stock take, staff and roles.

**Phase 4: offline mode,** only if the pilots show they need it.

Each phase follows the usual routine: agree the scope, build it with tests, add
a changelog entry, commit.

## Sources

- ZIMRA, *Fiscal Device Gateway API v7.2*: §2.2, §2.3, §4 (request headers,
  DEV04), §4.9, the payment fields, chapter 9 requirements 4, 9 and 22, chapter 10.
- [ZIMRA FAQ: free ZIMRA POS app and virtual fiscalisation](https://www.zimra.co.zw/frequently-asked-questions/1966-why-is-zimra-not-issuing-fiscal-gadgets-to-clients-as-it-is-their-brain-child)
- [ZIMRA: Compliance with the FDMS (test → sample documents → live)](https://www.zimra.co.zw/news/2307-compliance-with-the-zimra-fiscalisation-data-management-system-fdms)
- [ZIMRA Public Notice 26 of 2024: virtual fiscalisation and API](https://www.zimra.co.zw/public-notices?download=3847%3Apublic-notice-26-of-2024-zimra-virtual-fiscalisation-and-api-fdms)
- [fiscalization.io (free virtual fiscal device)](https://www.fiscalization.io/)
- [TechCabal: Roundihmp at about US$10 a month](https://techcabal.com/?p=157643)
- [rateweb: VAT registration and fiscalisation for small businesses (2026)](https://zw.rateweb.africa/vat-registration-fiscalisation-zimbabwe/)
- [fiscalisation.co.zw: requirements and penalties](https://www.fiscalisation.co.zw/what-is-fiscalisation)
- [Ghanamma: informal traders and the US$25,000 VAT threshold (Oct 2026)](https://www.ghanamma.com/2026/10/19/zimra-goes-after-50000-informal-traders-as-5-withholding-tax-and-us25000-vat-threshold-loom/)
- [Google: Sheets API usage limits](https://developers.google.com/sheets/api/limits)
- [MISA: data controller obligations under SI 155 of 2024](https://zimbabwe.misa.org/2025/03/14/navigating-the-data-protection-act-requirements-ensuring-compliance-for-zimbabwean-data-controllers)
- [Michalsons: overview of Zimbabwe's Cyber and Data Protection Act](https://www.michalsons.com/blog/zimbabwes-cyber-and-data-protection-act-overview/78795)
