<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Dura hub protocol, version 1

The messages between a Dura phone and the shop's backend. They describe
business operations, not Google APIs, so any backend can implement them. The
Apps Script Shop Hub is the first implementation; the Flutter `dura_hub`
adapter is the client ([decision 0005](../../handbook/decisions/0005-shop-hub-as-the-backend.md)).

Status of each part:

- **Implemented in this folder:**
  - the envelope;
  - signing;
  - errors;
  - `pair`;
  - `pairing.create`;
  - `device.revoke`;
  - `journal.put`;
  - `setup.run`.
- **Specified only:** the rest is marked *planned*.

## Transport

- **HTTPS POST** of one JSON object to the backend's address. For the Apps
  Script hub, that's its web app address, ending `/exec`.
- **Follow redirects.** Apps Script replies with a redirect to a one-time
  `script.googleusercontent.com` address; the client follows it with GET.
- **Headers are not used** for anything, because Apps Script can't read them.
  Everything is in the body.
- **Content:** UTF-8 JSON in both directions.
- **Amounts and quantities are decimal strings** (`"2.00"`), never JSON
  numbers.

## Request envelope

```json
{
  "v": 1,
  "device": "P2",
  "ts": 1793700000,
  "nonce": "3f9c2a7b4d1e8f60a2b3c4d5e6f70819",
  "action": "journal.put",
  "body": { },
  "sig": "<64 lower-case hex characters>"
}
```

| Field | Rule |
|---|---|
| `v` | Protocol version, an integer. This document is `1` |
| `device` | The ID the backend gave the phone when it paired, e.g. `P2` |
| `ts` | The phone's clock, in Unix seconds |
| `nonce` | 32 to 64 lower-case hex characters, new for every request |
| `action` | One of the actions below |
| `body` | The action's input; an object, possibly empty |
| `sig` | HMAC-SHA256 of the signing string, with the device secret as the key, in lower-case hex |

**The signing string** is the canonical JSON of the envelope without `sig`:

- object keys sorted by UTF-16 code unit (the default string order in JavaScript and Dart), at every depth; keys are ASCII;
- no spaces or line breaks;
- strings escaped as `JSON.stringify` does;
- integers written without a decimal point;
- no other number types.

Example: `{"action":"x","body":{},"device":"P2","nonce":"…","ts":1793700000,"v":1}`.

**The device secret** is 64 hex characters (32 bytes). The HMAC key is that
hex text itself, as UTF-8 bytes.

**The backend rejects** a signed request when any of these fail, in this
order:

| Check | Error |
|---|---|
| The envelope is well formed | `validation` / `bad_envelope` |
| `v` is supported | `validation` / `unsupported_version` |
| The device exists and isn't revoked | `authentication_required` / `unknown_device` |
| `ts` is within 300 seconds of the backend's clock | `authentication_required` / `stale_request` |
| The signature matches, compared in constant time | `authentication_required` / `bad_signature` |
| The nonce hasn't been seen for this device in the last 600 seconds | `authentication_required` / `replayed_request` |

## Reply envelope

```json
{ "v": 1, "ok": true, "result": { } }
{ "v": 1, "ok": false, "error": { "category": "validation", "code": "bad_envelope", "message": "Plain words for logs" } }
```

The error categories match the app's typed errors, so the client maps them
directly.

| Category | The client should |
|---|---|
| `validation` | Fix the request; never retry it unchanged |
| `permission` | Show that the action needs the owner |
| `authentication_required` | Re-pair or check the phone's clock |
| `retryable_unavailable` | Retry later, with backoff |
| `unknown_external_outcome` | Keep the operation open and check it again; never repeat a payment |
| `integrity_conflict` | Stop, keep the local data, and report it |

`message` is for logs. The app shows its own words.

## Actions

### `pair`: unsigned

A phone exchanges a one-time code for its identity. This is the only action
without a signature: `device`, `nonce` and `sig` are omitted.

```json
{"v":1,"ts":1793700000,"action":"pair","body":{"code":"<32 hex>","name":"Back counter"}}
→ {"v":1,"ok":true,"result":{"device":"P2","secret":"<64 hex>","role":"seller","business":"shop-demo-001"}}
```

- **The code** is either a pairing code from `pairing.create`, or the
  install code set when the backend was installed.
- **An install code** pairs the first phone as the owner. It works only while
  no device is paired, and only within 15 minutes of install.
- **A pairing code** works once, within 10 minutes, and pairs a seller.
- **The secret** is returned exactly once.
- **Errors:** `authentication_required` / `bad_code` covers every failure, so
  a guess learns nothing.

### `pairing.create`: owner only

```json
body: {}
→ result: {"code":"<32 hex>","expires":1793700600}
```

The owner's phone shows the result as a QR code:

```json
{"v":1,"hub":"<backend address>","business":"<id>","code":"<32 hex>"}
```

A non-owner device gets `permission` / `owner_only`.

### `device.revoke`: owner only

```json
body: {"device":"P2"}
→ result: {"device":"P2","revoked":true}
```

- The device's next request fails with `unknown_device`.
- An owner can't revoke their own device: `validation` / `cannot_revoke_self`.

### `journal.put`

Uploads one sealed batch of events.

```json
body: {
  "batch": 124,
  "events": [ { "id": "P2-E261103-0611", "type": "sale.completed", "at": "2026-11-03T16:20:00+02:00", "data": { } } ],
  "hash": "<sha256 hex of the canonical JSON of events>"
}
→ result: {"status":"accepted","through":124}
```

| Situation | Result |
|---|---|
| `batch` is the next number for this device | Stored; `{"status":"accepted","through":124}` |
| `batch` was already accepted | Nothing stored again; `{"status":"accepted","through":<highest accepted>}` |
| `batch` skips ahead | Nothing stored; `{"status":"gap","need":<next expected>}` |
| `hash` doesn't match `events` | `integrity_conflict` / `hash_mismatch` |
| `events` is empty, or over 500 events | `validation` / `bad_batch` |

- **Numbering:** batches start at 1 for each device. The batch is stored
  durably before the result is sent.
- **A lost reply is safe:** the phone sends the same batch again and gets the
  same acknowledgement.
- **"Accepted" means stored in the journal.** Building the Sheets views is a
  separate, later step, reported by `status`.

### `setup.run`: owner only

Builds the shop's files in its Google Drive, from the released templates.

```json
body: {"name": "Chipo's Corner Shop", "timeZone": "Africa/Harare"}
→ result: {
  "status": "ready",
  "business": "chipos-corner-shop-261103-a1b2",
  "period": "2026-11",
  "files": {"business": "<folder id>", "journal": "<folder id>", "myShop": "<file id>", "month": "<file id>"}
}
```

- **It creates:**
  - `Dura POS/<name>/`;
  - `business.json`, with no secrets;
  - `My Shop`;
  - `Journal/`;
  - the year folder;
  - this month's workbook, e.g. `2026-11 November`, in the business time
    zone.
- **Safe to repeat.** A second call creates nothing and returns the same
  result. A call that failed part-way resumes from the first missing file.
- **Templates come from the backend's pinned release.** Each is checked
  against its SHA-256 before use:
  - a mismatch is `integrity_conflict` / `template_mismatch`;
  - a download failure is `retryable_unavailable` / `template_unavailable`.
- **Errors:**
  - a name outside 1 to 80 characters, or a time zone not in the form
    `Area/City`, is `validation` / `bad_setup`;
  - a Drive failure is `retryable_unavailable` / `storage_unavailable`.
- **Before setup,** `journal.put` answers `retryable_unavailable` /
  `not_set_up`. The phone keeps its batches until setup is done.

### Planned

| Action | Purpose |
|---|---|
| `changes.pull` | Master data changed since a version: products, prices, rates, staff, settings |
| `attachment.put` | A product or supplier-invoice photo |
| `export.request` | An Excel or CSV export of a period |
| `payment.start`, `payment.check` | Payments with the shop's provider keys |
| `status` | View lag, registry health, last seen per device, backend version |
| `keys.set` | Owner only: store payment-provider keys |

## Versioning

- **Within version 1,** fields may be added. Clients ignore fields they don't
  know.
- **Changing or removing a field,** or changing the signing string, needs
  version 2.
- **A backend states** the versions it supports in `status`, and keeps
  serving older versions for as long as paired phones use them.
