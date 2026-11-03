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
  - accepting journal batches in order.
- **Planned:**
  - Sheets views;
  - files from templates;
  - the file registry;
  - payments;
  - scheduled jobs;
  - install and update.

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
    services.js        the services object and the script lock
    crypto.js          SHA-256, HMAC, random hex, constant-time compare
    canonical_json.js  the signing string
    protocol.js        version, limits, patterns, errors
    install_config.js  the install code's hash; replaced per shop by the installer
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
  into per-month folders comes with the file registry.
