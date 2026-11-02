<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Cashier access, device arrangement and diagnostics

## Supported dedicated shop-phone arrangement

An owner can buy a phone, create a dedicated business Google account, set up
Dura, and allow cashiers to use Dura. The owner keeps the device/account recovery
details and may use supported phone/app locks to restrict other apps/settings.
This is a reasonable small-shop operating arrangement and does not require the
cashier to own an email address.

Dura does not claim its PIN locks the entire phone. An account present on an
unrestricted device may be accessible through other apps, notifications, browser,
settings or recovery flows. App locks and screen pinning have device-specific
limits; managed kiosk/device-owner controls are a separate optional deployment.
Never promise that a cashier cannot leave Dura unless that device configuration
has actually been applied and tested.

Modes:

- Owner-only: direct owner Google access, local owner profile.
- Dedicated controlled shop phone: direct access is an explicit owner-managed
  trust choice; explain the boundary, keep PIN roles inside Dura.
- Paired restricted staff client: use business hub mediation without signing the
  owner's Google account into the staff device.

No mode exposes merchant secrets or fiscal private keys to spreadsheet users.

## Access rules

Owner enrols staff and allowed devices; cashier sets their own PIN locally.
Use a reviewed slow salted PIN-verification scheme, increasing attempt delays,
and protected local storage. A six-digit default is a usability starting point,
not strong protection without rate limits and device security. Do not publish
PIN hashes in sheets/logs or restore them blindly onto another device.

Authentication/session, cashier shift and cash-drawer responsibility are distinct.
Keep the current cashier visible, allow quick locking, preserve draft/unsynced
work on lock, and require explicit switch/handover rules. Owner overrides record
requester and approver. Enforce permissions in use cases and hub endpoints, not
just UI visibility.

Offline clients use authorised cached permissions under an explicit policy.
Revocation elsewhere cannot immediately reach a disconnected device. Show the
last refresh, define expiry/owner recovery behaviour and avoid pretending that
remote revocation is instantaneous.

## Restore and exit

Restore verifies business/mode, schema and journal acknowledgements before
replaying pending events. A replacement device receives a new installation
identity so old IDs/counters cannot collide. Fiscal-device replacement follows
its own procedure; never restore old fiscal counters or export private keys.
Encrypted backups need an owner-held recovery path independent of a lost phone.

Signing out or switching business must not silently delete queued records.
Exports contain business data and documentation but no private keys, merchant
credentials, session tokens, pairing secrets or PIN verifiers.

## Network middleware / interceptors

With http, use composable client wrappers rather than adding a second HTTP stack
solely to obtain a class called Interceptor. Standardise request correlation ID,
approved authentication injection, timeouts, response/error mapping, cancellation
and bounded retries. Retry safe reads; retry writes only under their explicit
idempotency contract. Payment initiation and fiscal issuance never receive a
blanket retry. Unknown outcomes enter reconciliation.

Restrict auth/header injection to the intended provider/host. Never forward an
authorisation header to an arbitrary redirect or poll URL supplied by untrusted
input. Gate provider callback validation and poll verification through adapter
contracts. Keep payment credentials in the business's authorised hub.

## Debugging and support

Development-only diagnostics: fake gateway, fiscal simulator, transport fault
injection, deterministic clock/IDs, pending-operation inspector and event replay.
Compile out dangerous controls in production; hiding a menu is insufficient.
Practice mode can remain available with isolated fake services and conspicuous
labels, separate from engineering bypasses.

Owner-facing health preview:

| Item | Value |
|---|---|
| Saved on this device | 3 transactions waiting to upload |
| Journal upload | Last verified 16:30 |
| Spreadsheet views | Updated through event P1-E1842 |
| Fiscal queue | 1 awaiting external result |
| Provider payment | PAY031 unconfirmed; recheck same reference |
| Other till | P2 last contacted 14:05; later activity unknown |

Structured diagnostics include operation IDs, app/schema/protocol versions,
safe error codes and timings. Redact tokens, secrets, PINs and personal/business
payloads by default. A support pack is local, previewed and explicitly shared by
the owner. No automatic public issue includes transaction payloads. Telemetry
is optional and separate from business-record sync.

The repository security-report template must not invent a private email address.
Use a verified private GitHub reporting channel if enabled; document the actual
channel before release.
