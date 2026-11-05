<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# The Shop Hub

The shop's own backend: a standalone Apps Script web app that the Dura app
installs in the owner's Google account, and that runs as the owner
([decision 0005](../../handbook/decisions/0005-shop-hub-as-the-backend.md)).
It speaks the protocol in [PROTOCOL.md](PROTOCOL.md). The full design and its
open questions are in [note 15](../../notes/15-apps-script-route.md).

**Status:**

- **Built and tested, not yet deployed anywhere:**
  - signed requests;
  - pairing by one-time code;
  - removing a phone;
  - accepting journal batches in order;
  - writing journal rows into the Sheets views, queued and retried;
  - shop setup: folders, `My Shop` and this month's workbook from checked
    templates, `business.json` and the file registry;
  - handing master data to phones, with bad rows skipped and listed;
  - `Stock` rows per product and location;
  - timers that catch views up, make next month's and next year's files, move
    `Data year` on and keep the `Months` tab current, with every phone off;
  - a health report for the owner's screen;
  - mobile payments through the shop's own Paynow keys;
  - product and supplier-invoice photos, and Excel and CSV exports;
  - `Balances` rows and the Summary breakdowns, once a day;
  - a public one-page shop page, which the owner can turn off.
- **Planned:**
  - ZB Smile&Pay;
  - install and update, which the Flutter app drives.

## Set up and verify

You'll need Node 22 or later.

```sh
cd backend/hub
npm ci
npm run verify      # type check, then every test
```

| Command | What it does |
|---|---|
| `npm test` | Runs `test/*_test.js` on Node's built-in test runner. The hub's files run in one shared context with fake Google services, as in Apps Script |
| `npm run check` | Type-checks `src/` with TypeScript, using JSDoc types and the Apps Script type definitions. Nothing is compiled |
| `npm run verify` | Both |
| `npm run push` | Pushes `src/` to your own test script with `clasp` |

**To try it in your own Google account:**

1. Run `npx clasp login`.
2. Create a standalone script, or use an existing test one.
3. Add a `.clasp.json` with `{"scriptId": "<your test script>", "rootDir": "src"}`.
4. Run `npm run push`.

`.clasp.json` and `.clasprc.json` are ignored by Git. Never push to a shop's
account.

## Language and tools

JavaScript on Apps Script's V8 runtime, with no build step
([decision 0006](../../handbook/decisions/0006-backend-folder-and-uniform-conventions.md)).

- The code in `src/` is exactly the code that runs, and what Google's editor
  and error traces show.
- **Shared scope:** every file shares one global scope.
  - Internal functions end with `_`, which Apps Script hides from the Run
    menu and from `google.script.run`.
  - Shared constants use `var`, so load order doesn't matter.
- **Handlers never touch Google globals directly.** They receive a
  `services` object (`createServices_`), which tests replace.

## Layout

```text
backend/hub/
  PROTOCOL.md          the backend-neutral protocol
  package.json         pinned dev tools; package-lock.json locks them
  tsconfig.json        type checking only
  src/
    appsscript.json    manifest: V8, scopes, Drive advanced service, web app settings
    web_app.js         doPost, routing, replies
    request_auth.js    envelope checks, signatures, clock window, nonces
    devices.js         pairing codes, install code, device records, revoking
    journal.js         batch acceptance and per-device batch numbers
    journal_drive.js   stores batches as JSON files in Drive
    views.js           journal rows into Sheets, exactly once, by heading
    master_data.js     changes.pull, and the Stock and Balances rows
    attachments.js     photos and exports in the shop's Drive
    storefront.js      doGet: the shop page, from a fixed list of public fields
    brand_mark.js      Dura's small mark, embedded for the shop page
    jobs.js            timers, the daily pass, the Months tab, status
    payments.js        keys, start, check, callbacks; provider-neutral
    paynow.js          the Paynow adapter: forms, SHA-512 hashes, statuses
    view_contract.js   generated: tables and fields phones may write
    services.js        the services object and the script lock
    property_store.js  Script Properties read once per execution, reloaded under the lock
    setup.js           setup.run: folders, workbooks, business.json, registry; resumable
    templates.js       parallel template download, checked against pinned SHA-256
    template_manifest.js  the release's template URLs and hashes
    drive_files.js     Drive v3 folder, conversion and JSON helpers; asks only for ids
    sheet_cells.js     Sheets v4 cell writes in one call; month date serials
    crypto.js          SHA-256, HMAC, random hex, constant-time compare
    canonical_json.js  the signing string
    protocol.js        version, limits, patterns, errors
    install_config.js  the install code's hash; replaced per shop by the installer
  tools/
    try_hub.js         acts as a phone against a real hub; see the real-account test
  test/
    *_test.js          one file per behaviour
    support/           fake Google services, an independent protocol client, fixtures
```

## Rules

- **The protocol comes first.** Any change to a message is a `PROTOCOL.md`
  change with a version, implemented by both the hub and `dura_hub`.
- **Tests run without Google:** fake services, deterministic fixtures.
  - The test client is written from `PROTOCOL.md`, not from the hub's code,
    so the tests check interoperability.
  - Sandbox checks with providers are separate, and CI never uses production
    keys.
- **No secrets in replies or logs.** Unexpected errors are reported only as
  `internal_error`.
- **Releases are pinned and hashed.** Each shop runs a known version; updates
  are approved by the owner and keep the same deployment address.
- **Never deploy into anyone's account** just because tests ran.

## Known limits

- **Random secrets** come from hashing `Utilities.getUuid()`, because Apps
  Script has no random-bytes API. That assumes Google's UUIDs come from a
  secure source; a spike should confirm it.
- **Re-sending batch `n` with different content is acknowledged** as a
  duplicate, because the hub keeps only the highest batch number per phone.
  The phone must never reuse a batch number.
- **The Drive writer stores batches in one journal folder.** Routing them
  into per-month folders comes later.
- **Folders are created with a `null` upload** and `{fields: 'id'}`, a call
  shape not shown in Google's samples. Spike 2 in note 15 must confirm it
  against the real Drive advanced service.
- **If setup fails between creating a file and recording its ID,** the next
  run creates that one file again. The earlier copy is left behind; nothing
  else is duplicated.
- **The template manifest's URLs are empty** until templates are published in
  a release, so `setup.run` answers `template_unavailable` on a real install
  until then. The hashes come from `backend/templates/dist/manifest.json`.
- **`Values.batchGet(id, {ranges, ...})`** is inferred from how the advanced
  services order their arguments; it's not on Google's pages. Spike 2 must
  confirm it, along with `USER_ENTERED` formulas in a converted sheet.
- **Paynow has only been tested against a fake.** Its documentation doesn't
  show the mobile checkout's first reply, so the hub assumes it matches the
  ordinary one (`Status`, `PollUrl`, `Hash`). InnBucks' authorisation code
  isn't passed on yet. Spike 5 in note 15 must try the sandbox, including a
  callback through Google's redirect.
- **An `unknown` payment stays unknown.** Paynow's trace call could settle it;
  the hub doesn't use it yet.
- **Summary breakdowns and Balances refresh daily,** so they can be a day
  behind the rows they're built from. A Summary lists 10 locations and phones,
  20 sellers, 30 payment methods and the 100 best-selling products.
- **Kept change has no limit in `Balances`,** because Settings has no number
  for it yet.
- **A new photo for the same product is a new file;** the old one stays.
- **Google limits a Drive export to 10 MB.** A larger workbook answers
  `export_failed`; a CSV of one tab still works.
- **The shop page has been rendered in a browser, not served by Google.** Its
  buttons and any banner Google adds need the real-account test.
- **A daily step that fails** is logged and tried again the next day. Nothing
  reports it to the owner yet.
- **The Sheets advanced service's manifest entry** (`sheets`, `v4`) follows
  Google's Drive example; the pages don't state it. Using `drive.file` alone
  for Sheets writes follows the API reference. Spike 2 must confirm both on a
  real account.

## Keeping inside Google's limits

Apps Script counts calls per day, so each request is built to make as few as
possible:

- **Script Properties:** one `getProperties()` per request, plus one more
  after taking the lock. Several values are written with one
  `setProperties()`.
- **The file registry** lives in Script Properties, so finding a file costs
  no Drive or Sheets call.
- **Templates:** fetched in parallel with one `fetchAll`, and only those still
  needed.
- **Drive:** every create asks for `fields: 'id'` only.
- **Views:** one `batchUpdate` per workbook per batch; headings and row counts
  come from one cached `Spreadsheets.get`.
- **Sheets:** setup makes one `batchUpdate` per file, and none on a repeat. The
  cell addresses come from the template manifest, so no sheet is read to find
  them.
- **Master data:** one `batchGet` per pull. `Stock`, `Balances` and Summary
  labels are written only when their hash changes.
- **Timers:** `runViews` runs every 15 minutes and stops after one property
  read if the queue is empty, and `dailyJob` runs once. Timers share a daily
  runtime budget, 90 minutes on a Gmail account.
- **Payments:** the reference is claimed under the lock, and the provider is
  called outside it, so a slow provider doesn't hold up uploads. Payment
  records are dropped after 3 days, since Script Properties hold 500 KB.
- **The shop page:** a visit that finds the cached page reads no properties and no
  sheet. A cold visit makes one `batchGet`.
- **Replay checks** use `CacheService`, not properties.
- **The script lock** is held only around writes.
