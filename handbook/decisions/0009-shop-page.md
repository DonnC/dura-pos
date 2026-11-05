<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Decision 0009: the hub serves a one-page shop page

Status: Accepted
Date: 5 November 2026
Roadmap slice: 6 (hub)

## Problem and evidence

The Shop Hub is already a public web app, so every shop has an address that costs
nothing to run. Small shops rarely have a web page, and customers ask for prices
and directions on WhatsApp. An Apps Script web app can answer a GET with an HTML
page, with inline CSS and JavaScript.

## Decision

Opening the hub's address shows a one-page shop page: the shop's name and address,
Call, WhatsApp and Directions buttons, and a searchable list of products and prices.

1. **It's built from a fixed list of fields:** business name, address, phone,
   accepted currencies, and each active product's name, category, unit and price.
   Costs, stock, notes, tax numbers, staff and customers can't reach it.
2. **The owner controls it.** A new Settings row, `Shop page`, turns it `On` or
   `Off`. It's `On` by default, and `Off` shows a neutral page saying nothing about
   the shop. The address is long and only reaches people the owner gives it to, but
   it is public, so setup must tell the owner it exists.
3. **Visits cost no quota.** The finished page is cached for six hours, and a visit
   that finds it reads no properties and no sheet. A `changes.pull` or the daily
   pass refreshes it.
4. **It's a shop window, not a shop.** There's no ordering, payment or stock on it.
   Those would need the hub to trust anonymous visitors, which it never does.
5. **It's never needed to trade,** and a failure shows the neutral page, never an
   error's text.

## Compatibility and migration

- `Shop page` is added after `Data year`, so no cell address the hub uses moves. A
  shop without the row is treated as `On`.
- `doGet` is new. The protocol is unchanged, and phones don't use the page.

## Limits

- **Photos aren't shown.** They're private in the owner's Drive, and making them
  public is a separate decision.
- **Google's frame:** the page runs in Google's sandbox, and consumer accounts are
  expected to show a Google notice above it. The real-account test confirms this.
- **The page shows prices in the pricing currency only.** Rates change daily, and a
  cached page shouldn't quote them.
- **The address is a long `script.google.com` link.** The app can share it as a QR
  code; a short name would need a service Dura doesn't run.

## Acceptance and reversal

- Tests show that private fields never appear, that owner text is escaped, and that
  50 visits read nothing from Sheets or Script Properties.
- Google has served it to an anonymous request. Its buttons, and any banner Google
  adds, still need checking on a phone.
- To reverse it, remove `doGet`; the web app then answers GET with an error.
