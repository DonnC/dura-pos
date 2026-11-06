<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Testing the hub on a real Google account

The hub's tests run on fake Google services, so they can't prove what Google really
does. One command runs the real test: it installs a hub, waits for what only a person
can do, runs every check it can, and writes a report. Allow about 30 minutes the first
time. Nothing here touches a real shop. The first run's results are at the end.

## 1. Create the test account

1. Open a private browser window, go to <https://accounts.google.com/signup> and
   create a new Gmail account, such as `dura.hub.test@gmail.com`.
   - Use it only for this. Put no real shop or customer data in it.
   - Google may ask for a phone number to verify it.
2. Open <https://drive.google.com> once, to accept any first-run screens.
3. Open <https://script.google.com/home/usersettings> and turn on **Google Apps
   Script API**. `clasp`, the upload tool, can't work without it.

## 2. Check the templates are reachable

The hub downloads its templates from the repository's `develop` branch, so this needs
a public repository. In a fork, change `RAW` in `backend/hub/tools/try_hub.js`.

## 3. Run the trial

You'll need Node 22 or later. From the repository root:

```sh
cd backend/hub
npm ci
npm run trial
```

It stops twice for you:

1. **Signing in:** a browser opens for `clasp`. Use the **test account**. The script
   prints which account it's using, so check that.
2. **Authorising:** it prints a link and three short steps. Google warns that the app
   isn't verified; click **Advanced**, then **Go to Dura Shop Hub test (unsafe)**.
   Leave every permission ticked, because the hub needs all three. The script notices
   when you're done and carries on by itself.

Then it pairs, sets up the shop, runs the checks and prints each one as `PASS` or
`FAIL`. A failed check doesn't stop the rest.

Run `npm run trial` again at any time. It reuses the same hub and repeats the checks.

## 4. Check what only a person can

| Check | Where | Expected |
|---|---|---|
| Folders | Drive | `Dura POS/Test Corner Shop/` with `Journal`, `2026`, `business.json` and `My Shop` |
| Conversion | `My Shop` | Dropdowns, colours, formulas and charts survived |
| Month file | `2026/`, `Summary` | Its dates show the current month |
| The sale | The month file, `Sales` | Rows with totals of 1.00 |
| Timers | Apps Script, Triggers | `runViews` and `dailyJob` |
| Daily job | Apps Script: run `dailyJob` | No `Daily step failed` line in the log |

Then the shop page:

1. In `My Shop`, fill `Address` and `Phone` in Settings, and add rows to `Products` and
   `Locations`.
2. Run `npm run trial` again. It refreshes the page, and writes the `Stock` formulas.
3. Check that `Stock` calculates.
4. Open the shop page address it printed on a phone, in your normal browser. Try the
   search, Call, WhatsApp and Directions.
5. Set `Shop page` to `Off` in Settings, run the trial again and reload. The shop page
   check should now fail, because the page hides the shop.

## 5. Send back the results

Send `backend/hub/.try/report.md`, which is safe to share, plus anything from step 4
that was wrong and anything confusing on the permission screens.

Don't share the install code, any other file in `.try/`, or the account's password.

## 6. Paynow's sandbox: later

This needs a Paynow merchant account with an integration in test mode. Only ever use
test keys here, because they end up in your shell history.

```sh
node tools/try_hub.js keys USD <integration ID> <integration key> <merchant email>
node tools/try_hub.js pay 0771111111 ecocash
node tools/try_hub.js check <reference from pay>
```

Run these from `backend/hub`. Paynow's documentation lists the test numbers for each outcome. Check that a paid
test reaches `paid`, and that a row appears in `Payment Callbacks`.

## 7. Clean up

From `backend/hub/.try`:

```sh
npx clasp logout
```

Then delete the `.try` folder. You can keep the test account for the next round.

## If something goes wrong

| What you see | Likely cause |
|---|---|
| `clasp` says the Apps Script API isn't enabled | Step 1.3, or wait a few minutes after turning it on |
| `The templates are not public yet` | Step 2 |
| `Pairing failed` | This hub already has an owner. Delete `.try` to start a new hub |
| "Sorry, unable to open the file at present", with `/u/1/` in the address | Google's handling of several signed-in accounts, at the plain `/macros/s/` address. Use the shop page address, with `/a/~/` |
| `npx clasp` sits with no output | Press Ctrl+C and run it again |

## Results of the first run

5 November 2026, on a consumer Gmail account, with the repository public.

**Proven on real Google, run by hand with `tools/try_hub.js`:**

| Check | Result |
|---|---|
| Install with `clasp`, and the consent screen | Worked. Google asks for three permissions, each with its own tick box |
| Pairing and signed requests | Worked. A replayed request was refused |
| Setup: folders, template download and hash check, conversion, filling cells, timers | Worked in 16 seconds |
| `drive.file` alone for Sheets, and the `sheets` `v4` manifest entry | Worked: no `spreadsheets` scope is needed |
| `Values.batchGet` and `Values.batchUpdate` with the advanced service | Worked |
| A sale into the journal and Sheets views | Worked: `viewed` matched `through` |
| A batch of 200 sales | Accepted and viewed in about 4.5 seconds, twice |
| Re-sending a batch after a lost reply | Acknowledged, with nothing stored twice |
| `changes.pull` on the real template | Read every table, with no skipped rows |
| Photos, and Excel and CSV exports | Worked |
| Shop page | Answered an anonymous request with HTTP 200 and the shop's title |

In a private window the page rendered as designed, under Google's closable notice:
"This application was created by a Google Apps Script user".

The daily job ran by hand in 3 seconds and logged no failed step. Settings survived
conversion, and owner edits to them reached the page Google served.

The owner confirmed that `My Shop` and the month file survived conversion, the timers
are listed, and the shop page's buttons work on a phone.

**Still to run:** a timer firing by itself, Paynow's sandbox, and spikes 6 and 7.

**Learned:**

- Authorising took about 11 minutes the first time, longer than the install code
  lasts, so the code must be issued after authorising. An app install has to do the
  same.
- A browser signed in to two Google accounts got Google's own error page at the plain
  address, on a computer and a phone. `/a/~/macros/s/<ID>/exec` worked on both, and
  `?authuser=0` and `/a/macros/~/s/` didn't. That form isn't documented by Google.
- Sheets turned a typed phone number into a number, and the Call link needed `+`.
  Both are handled now.
- Google's screen lets an owner untick single permissions, and the app needs to
  explain that all three are needed. What the hub does with fewer isn't tested yet.
