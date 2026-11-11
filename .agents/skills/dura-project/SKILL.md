---
name: dura-project
description: The facts about Dura POS: its goal, users, promises, settled business model, architecture, what is built today, the delivery order and the future plan. Use this before planning, scoping or explaining any Dura work, when a contributor asks what Dura is or what to do next, when a change might touch a product decision, and whenever you're unsure whether something is built or only designed.
---
# Dura POS: goal, architecture and plan

Status below is as of 5 November 2026. Before relying on it, check the code and
`handbook/product/02-capabilities.md`. A document describing something doesn't
mean it exists.

## The goal

Give vendors and small shops, starting in Zimbabwe, a point of sale that is free,
works offline, and keeps the shop's records in the shop's own Google account, so the
owner never has to pay, trust or ask anyone to keep trading.

Dura was born from Zimbabwean trading conditions, which set its first priorities. The
design isn't limited to them, and contributors elsewhere are welcome.

*Dura* is the Shona word for a granary. The reasons are in
`handbook/product/01-vision.md`.

**Who it's for:** street vendors, tuck shops, and small shops with up to about
ten phones, plus the owner's accountant. **Not for:** chains, warehouses,
table-service restaurants or enterprise administration.

**The promises every change must keep:**

1. Free, with no vendor cloud.
2. The records belong to the shop.
3. Selling never waits for the network: nothing optional can stop a cash sale.
4. The shop's own keys.
5. Honest numbers: currencies are never added together.
6. Easy enough for anyone: the five-second rule.

## Settled: don't reopen these

- **Business model:** no vendor cloud, bring your own keys, consulting revenue,
  small shops.
- **Backend:** the Shop Hub, in the shop's own account (decision 0005).
- **Records:** an append-only journal, with Sheets as views (decision 0003).
- **Languages:** Flutter for the app, plain JavaScript for the hub, Python for
  the templates (decisions 0001 and 0006).
- **Pricing currency:** the owner chooses it. Never assume USD.
- **Public claims:** don't claim ZIMRA certification, and credit Shaun
  Chivandire for the original TypeScript SDK.

When a change does contradict a decision, write a new record in
`handbook/decisions/`; don't quietly drift.

## How it fits together

```text
Phones (Flutter)                 The shop's Google account
  sale saved on the phone          Shop Hub (Apps Script, runs as the owner)
  outbox of sealed batches  --->     checks signatures, stores batches
  one port in dura_core              Drive: Dura POS/<shop>/Journal
  hub adapter in dura_hub  <---      Sheets: My Shop, one file per month
                                     timers, payments, photos, exports
ZIMRA  <--- fzimra on each phone (never through the hub)
Paynow <--- the hub, with the shop's keys
```

- **Phones** pair by QR code, sign every request and never hold a Google token.
- **Dura's Google Cloud project** is used only to install and update a hub. All
  other usage counts against the shop's account.
- **The journal** is the shared history. Sheets are built from it, plus input
  tabs the owner edits, which are checked before they're accepted.
- **Events are never rewritten.** A correction is a new linked event.
- **The hub is never needed to complete a sale,** and never touches ZIMRA.
- **The app is server-agnostic.** Moving away from Google means writing one new
  adapter behind the port. No Google type appears above it.
- **Templates:** `backend/templates` generates the Excel files, the hub converts
  them to Sheets, and the same files stay Excel-compatible.

## What exists today

| Part | State |
|---|---|
| `backend/hub` | All protocol actions are written and tested against fakes: pairing, journal, setup, views, master data, status, timers, Paynow, photos, exports, plus the public shop page. Its main path has run on a real Google account (results in `handbook/engineering/10-real-account-test.md`); **timers and Paynow's sandbox haven't** |
| `backend/templates` | Sample shop, clean templates per pricing currency, contract, checks. Not yet published, so the hub's template URLs are empty |
| `client/packages/dura_core` | Money types, the cash-sale calculation, posting rules, sale events, the outbox port and uploader, the analytics port, safe stack frames |
| `client/packages/dura_data` | Local preferences and the durable outbox in Drift; the rotating problem log and usage log |
| `client/packages/dura_ui` | The Counter design's theme tokens and 17 wrapper components, with golden, leak and contrast tests |
| `client/apps/dura` | The four-tab shell (owner and seller words, bar or rail), Problem reports with the usage switch. The tabs are shells; progress is in `handbook/design/ui-tracker.md` |
| `client/packages/dura_hub` | The hub adapter behind the backend port in `dura_core`, tested against a live hub. No screen uses it yet |
| Not started | Selling screens, hub install and update, usage upload to Drive, fiscalisation |

GitHub Actions runs on pull requests (`verify`, `hub`, `templates`). Don't
report anything above as proven beyond what the tests show.

## The order of work

1. **Finish proving the backend on a real account,** following
   `handbook/engineering/10-real-account-test.md`: consent, converting templates,
   `drive.file` for Sheets, the advanced-service calls, the shop page and Paynow's
   sandbox. This needs a throwaway Google account and a public repository.
2. **Flutter against the backend:** the outbox, one-tap hub install, pairing, then
   the one-phone sale.
3. **Then the roadmap phases** in `handbook/engineering/06-roadmap.md`:

| Phase | Scope |
|---|---|
| 2 | One-phone practice sale |
| 3 | Owner records and exit |
| 4 | Cashiers and shifts |
| 5 | Fiscalisation (optional, and deferred) |
| 6 | Hub, staff sync and payments |
| 7 | Inventory, reporting and a supervised pilot |
| 8 | Desktop and web owner views |

Work one agreed slice at a time: test first, update the changelog, commit when
asked. There are no calendar promises before a pilot has been observed.

## Future logic already decided

- **Fiscalisation** runs on the phone through fzimra
  (`DonnC/zimra-fdms-android`), one fiscal device per phone. Each business
  passes ZIMRA's own tests before going live. Check fzimra, the TypeScript
  `zimra-fdms` SDK and the `zw_compliance` ERPNext app before building anything
  for ZIMRA, and read ZIMRA's spec strictly: never offer an option that can stop
  a shop from trading.
- **More providers** go behind the hub's adapter contract: ZB Smile&Pay next.
  Wallets with no public API become private adapters in that client's own
  account, through consulting; that code isn't in the public repo.
- **Test mode** never touches live data: a separate folder and database, `T-`
  IDs, ZIMRA's test environment, gateway sandboxes.
- **"Ask Dura"** (`notes/14-ai-assistant-plan.md`) comes later, starting with the
  owner's own key. The phone works out the numbers with tools; the model only
  explains.
- **Financial records** are planned in `notes/13-financial-records.md`.

## Which document wins

Code, then decisions, then the handbook, then notes (`12`, then `10`), then
research. `handbook/README.md` maps every document. `notes/` is design reasoning
from the Kotlin era, so it isn't current where a decision differs.

## Where to go next

| Work | Skill |
|---|---|
| The Shop Hub | `dura-hub` |
| The workbook generator | `dura-templates` |
| Sheet layout and file lifecycle | `dura-records` |
| Offline sync and recovery | `dura-sync` |
| Business behaviour, test first | `dura-tdd` |
| Flutter code | `flutter-product-engineering` |
| Screens | `premium-mobile-product-design`, `dura-ui` |
| Releases | `dura-release` |
