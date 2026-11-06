<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Backend

Everything that runs in, or is created in, the shop's own Google account.
Dura hosts nothing: this code is installed into each shop's account and runs
there ([decision 0005](../handbook/decisions/0005-shop-hub-as-the-backend.md)).

| Folder | What it is | Language |
|---|---|---|
| [`hub/`](hub/README.md) | The Shop Hub: the Apps Script web app that accepts uploads, builds the Sheets, holds payment keys and runs scheduled jobs | JavaScript (Apps Script V8) |
| [`templates/`](templates/README.md) | The workbook generator, its checks, and the sample shop. It produces the templates the hub converts into each shop's Google Sheets | Python 3 |

The Flutter app in `../client/` never depends on this folder's code. It
speaks the hub protocol through one adapter, so a different backend could
replace this one. Conventions shared with the rest of the repository are in
[`../handbook/engineering/09-conventions.md`](../handbook/engineering/09-conventions.md).
