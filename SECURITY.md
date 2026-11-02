<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Security reporting

The application is an early foundation and has no live payment/fiscal integration.
Before public release, the maintainer must enable and verify a private reporting
channel. No mailbox or GitHub private reporting capability is asserted here.

Do not post credentials, PIN data, fiscal keys, customer information or live
transaction payloads in public issues. If repository private vulnerability
reporting is enabled, use it. Otherwise obtain a verified private maintainer
contact before sending sensitive details. A non-sensitive request for a private
contact is sufficient; do not include exploit details affecting other shops.

The same private channel is used for code-of-conduct reports.

## What matters most

Dura handles other people's money and records. Treat as high impact anything
that could:

- expose a shop's Google token, merchant keys, ZIMRA keys or pairing secrets;
- mark a payment paid without the provider's confirmation, or charge twice;
- issue, replay or alter a fiscal receipt;
- let a seller's PIN unlock owner actions;
- mix test or practice data with live records;
- lose or duplicate a sale during upload or restore.

## Reporting details

Reports should identify version/platform, impact, prerequisites and a minimal
reproduction with fictitious data. Do not test another business or live provider
without authorisation.

The owner-managed shop phone/account and app locks complement app permissions;
Dura's PIN is not an operating-system kiosk boundary. Logs are local, bounded
and metadata-only, but exported ZIPs are not encrypted and should be shared only
with trusted recipients. See handbook/engineering/04-security-and-diagnostics.md.
