<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Testing the hub on a real Google account

The hub's tests run on fake Google services, so they can't prove what Google really
does. This run covers spikes 1 to 3 in
[note 15](../../notes/15-apps-script-route.md), plus the shop page. Allow about an
hour. Nothing here touches a real shop. The first run's results are at the end.

`node tools/try_hub.js` stands in for a phone. It keeps the install code and the
device secret in `backend/hub/.try/`, which Git ignores.

## 1. Create the test account

1. Open a private browser window, go to <https://accounts.google.com/signup> and
   create a new Gmail account, such as `dura.hub.test@gmail.com`.
   - Use it only for this. Put no real shop or customer data in it.
   - Google may ask for a phone number to verify it.
2. Stay signed in to that account in the private window.
3. Open <https://drive.google.com> once, to accept any first-run screens.
4. Open <https://script.google.com/home/usersettings> and turn on **Google Apps
   Script API**. `clasp`, the upload tool, can't work without it.

## 2. Make the templates reachable

The hub downloads its templates from a public address. `prepare` uses the files on
`develop`, so the repository must be public first.

Then open this address in a browser. It should download a file:

```text
https://raw.githubusercontent.com/DonnC/dura-pos/develop/backend/templates/dist/USD/Month.xlsx
```

## 3. Install the hub

From the repository root, in a terminal:

```sh
cd backend/hub
npm ci
mkdir .try
cd .try
npx clasp login
npx clasp create-script --type standalone --title "Dura Shop Hub test" --rootDir .
```

`clasp login` opens a browser. Sign in with the **test account**, not your own.

Now fill in the hub, upload it and deploy it:

```sh
cd ..
node tools/try_hub.js prepare
cd .try
npx clasp push --force
npx clasp create-deployment --description "First test"
```

Ignore the install code `prepare` printed: the next step takes longer than it
lasts. You'll get a fresh one in step 5.

## 4. Authorise it

The hub runs as the account owner, so the owner has to approve it once.

1. Signed in as the test account, open <https://script.google.com/home> and open
   **Dura Shop Hub test**.
2. Pick the file `jobs.gs`, choose `runViews` in the function menu, and click **Run**.
3. Click **Review permissions** and choose the test account.
4. Google warns that the app isn't verified. Click **Advanced**, then **Go to Dura
   Shop Hub test (unsafe)**, then **Allow**.

Screenshot each of these screens. They're what a real owner will see, and the app
has to prepare them for it.

## 5. Try it

Go back to `backend/hub` in the terminal, and get a new install code. `fresh`
uploads it, redeploys, and prints your hub's address and the code:

```sh
node tools/try_hub.js fresh
```

Pair within 15 minutes, using what it printed:

```sh
node tools/try_hub.js pair "<address>" <code>
node tools/try_hub.js setup "Test Corner Shop" Africa/Harare USD
node tools/try_hub.js status
node tools/try_hub.js sale
node tools/try_hub.js status
```

If the install code runs out, run `fresh` again.

## 6. Look at what it made

Signed in as the test account:

| Check | Where | Expected |
|---|---|---|
| Folders | Drive | `Dura POS/Test Corner Shop/` with `Journal`, `2026`, `business.json` and `My Shop` |
| Conversion | `My Shop` | Dropdowns, colours, formulas and charts survived |
| Filling in | `My Shop`, Settings | The shop's name and `Data year` are filled |
| Month file | `2026/`, `Summary` | Its dates show the current month |
| The sale | The month file, `Sales` | A row with a total of 2.00 |
| Journal | `Journal/` | A file named `P1-000001.json` |
| Timers | Apps Script, Triggers | `runViews` and `dailyJob` |

Now the shop page:

1. In `My Shop`, fill `Address` and `Phone` in Settings, and add two rows to
   `Products`.
2. Run `node tools/try_hub.js pull`.
3. Open the hub's address on your phone, or in a private window. Don't use a browser
   signed in to several Google accounts: see the table at the end.

Check that the page loads, then try the search, Call, WhatsApp and Directions.
Note any banner Google adds at the top.

Finally, set `Shop page` to `Off` in Settings, run `pull` again and reload.

## 7. Send back the results

Note these, with a screenshot or the error text for anything that failed:

- how long steps 3 and 4 took;
- each row of the table in step 6;
- whether the shop page worked, and what Google's banner says;
- anything confusing on the permission screens.

Don't share the install code, the contents of `.try/`, or the account's password.

## 8. Paynow's sandbox: later

This needs a Paynow merchant account with an integration in test mode. Only ever use
test keys here, because they end up in your shell history.

```sh
node tools/try_hub.js keys USD <integration ID> <integration key> <merchant email>
node tools/try_hub.js pay 0771111111 ecocash
node tools/try_hub.js check <reference from pay>
```

Paynow's documentation lists the test numbers for each outcome. Check that a paid
test reaches `paid`, and that a row appears in `Payment Callbacks`.

## 9. Clean up

```sh
cd .try
npx clasp logout
cd ..
```

Then delete the `.try` folder. You can keep the test account for the next round.

## If something goes wrong

| What you see | Likely cause |
|---|---|
| `clasp` says the Apps Script API isn't enabled | Step 1.4, or wait a few minutes after turning it on |
| `The hub did not answer JSON` | Step 4 wasn't done, or the address is wrong |
| `bad_code` when pairing | The install code ran out. Run `fresh` again. If the hub already has an owner, it needs a new script project |
| `template_unavailable` during setup | Step 2: the template address isn't public, or `prepare` ran before the latest templates were pushed |
| "Sorry, unable to open the file at present", with `/u/1/` in the address | Google's handling of several signed-in accounts, not the hub. Open it in a private window. The hub's code never ran |
| `npx clasp` sits with no output | Press Ctrl+C and run it again |

## Results of the first run

5 November 2026, on a consumer Gmail account, with the repository public.

**Proven on real Google:**

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

**Still to confirm by eye:** the rest of the table in step 6, and the shop page with
products, on a phone.

**Still to run:** a timer firing by itself, Paynow's sandbox, and spikes 6 and 7.

**Learned:**

- Authorising took about 11 minutes the first time, longer than the install code
  lasts, so the code must be issued after authorising. An app install has to do the
  same.
- A browser signed in to two Google accounts got Google's own error page, while a
  signed-out request got the shop page.
- Sheets turned a typed phone number into a number, and the Call link needed `+`.
  Both are handled now.
- Google's screen lets an owner untick single permissions, and the app needs to
  explain that all three are needed. What the hub does with fewer isn't tested yet.
