<!--
Copyright (c) 2026, DonnC & contributors.
Please see the AUTHORS file for details. All rights reserved.
Use of this source code is governed by the MIT license that can be
found in the LICENSE file at the repository root.
SPDX-License-Identifier: MIT
-->

# Payments

How a mobile-money payment moves through Dura. The code is in
[`backend/hub/src/payments.js`](../../backend/hub/src/payments.js) and
[`paynow.js`](../../backend/hub/src/paynow.js), and the wire format is in
[`PROTOCOL.md`](../../backend/hub/PROTOCOL.md).

**Status:** the hub's side is built, for Paynow's mobile checkout, and tested
against a fake Paynow. It hasn't been tried against Paynow's sandbox, and there
is no payment screen in the app yet.

## The rules

1. **Paid comes only from the provider's status check.** A callback can't mark a
   payment paid. It only makes the hub check sooner.
2. **A charge is never repeated.** A reference is claimed before the provider is
   called, so a retry finds the same payment.
3. **An unknown outcome stays unknown.** If the provider gave no usable reply, the
   customer may have been charged. The seller asks them; Dura doesn't guess.
4. **A payment never blocks a sale.** If it fails or can't be checked, the seller
   takes another method, or records a manual reference.
5. **The shop's keys stay in the shop's hub.** Phones never hold them. Money goes
   straight to the shop's merchant account; it never passes through Dura.

## Who does what

```mermaid
flowchart LR
  Customer(["Customer's phone<br/>EcoCash, OneMoney, InnBucks, O'mari"])
  subgraph Shop["The shop's phone"]
    App["Dura app"]
    Journal[("Sale in the local<br/>journal")]
    App --> Journal
  end
  subgraph Google["The shop's Google account"]
    Hub["Shop Hub<br/>keys · payment state"]
    Callbacks[("Payment Callbacks tab")]
    Hub --> Callbacks
  end
  Paynow["Paynow<br/>the shop's merchant account"]
  App -- "signed: start, check" --> Hub
  Hub -- "hashed form, with the shop's keys" --> Paynow
  Paynow -- "PIN prompt" --> Customer
  Paynow -. "callback: a hint" .-> Hub
```

The hub moves the payment along. It doesn't record the sale: the phone does that
in its journal once it sees `paid`, and the sale reaches Sheets like any other.

## Setting up: once per currency

A Paynow integration belongs to one wallet, and Paynow's messages have no currency
field, so a shop that takes USD and ZWG sets two sets of keys.

```mermaid
sequenceDiagram
  actor Owner
  participant App as Dura app
  participant Hub as Shop Hub
  Owner->>App: Integration ID, key and merchant email
  App->>Hub: keys.set (signed, owner's phone only)
  Hub->>Hub: Saves paykey:paynow:USD in Script Properties
  Hub-->>App: set
  Note over Hub: No reply, log, sheet or export<br/>ever contains the key
  App->>Hub: status
  Hub-->>App: payments: paynow:USD
```

## A payment that goes through

```mermaid
sequenceDiagram
  actor Seller
  participant App as Dura app
  participant Hub as Shop Hub
  participant Paynow
  actor Customer

  Seller->>App: EcoCash, USD 2.50, 0771234567
  App->>Hub: payment.start (reference P2-PAY261103-0001)
  Hub->>Hub: Claims the reference under the lock
  Hub->>Paynow: remotetransaction, with a SHA-512 hash
  Paynow-->>Hub: Status=Ok, PollUrl, Hash
  Hub->>Hub: Checks the hash, saves PollUrl, drops the phone number
  Hub-->>App: pending
  Paynow->>Customer: Enter your PIN
  Customer->>Paynow: Approves
  loop Until paid, failed or timed out
    App->>Hub: payment.check
    Hub->>Paynow: Poll
    Paynow-->>Hub: Status, amount, Hash
    Hub->>Hub: Checks the hash and the amount
    Hub-->>App: pending or paid
  end
  App->>App: Completes the sale in its journal
  App-->>Seller: Paid
```

## States

```mermaid
stateDiagram-v2
  [*] --> unknown: reference claimed
  unknown --> pending: the provider accepted it
  unknown --> failed: the provider refused it
  unknown --> [*]: no usable reply, dropped after 3 days
  pending --> paid: status check, hash and amount correct
  pending --> failed: disputed, wrong amount or never confirmed
  pending --> cancelled: cancelled or refunded
  paid --> [*]: dropped after 3 days
  failed --> [*]: dropped after 3 days
  cancelled --> [*]: dropped after 3 days
```

A payment starts as `unknown` on purpose: if the hub stops between claiming the
reference and hearing back, the honest answer is that nobody knows.

| Paynow says | Dura reads |
|---|---|
| Paid, Awaiting Delivery, Delivered | `paid` |
| Created, Sent | `pending` |
| Cancelled, Refunded | `cancelled` |
| Disputed | `failed` |

A `paid` status with a different amount becomes `failed`, with a note. A poll reply
with a bad hash is ignored, and the payment stays `pending`.

## Callbacks are hints

Anyone on the internet can post to the hub's address, so nothing in a callback is
believed.

```mermaid
flowchart TD
  Post["Post to ?cb=paynow"] --> Known{"A reference this<br/>hub started?"}
  Known -- No --> Ignore["Ignored. Nothing written"]
  Known -- Yes --> Hash{"Hash correct for<br/>this currency's key?"}
  Hash -- No --> Reject["Logged as Rejected<br/>Payment unchanged"]
  Hash -- Yes --> Seen{"This status already<br/>logged?"}
  Seen -- Yes --> Skip["Skipped: the provider<br/>sent it again"]
  Seen -- No --> Check["Asks Paynow itself,<br/>at the saved poll address"]
  Check --> Log["Logged in Payment Callbacks<br/>with Paynow's own answer"]
```

Every path answers plain `ok`. Google answers every web app POST with a redirect,
but the hub's code has already run by then. Whether Paynow is happy with that is
spike 5 in [note 15](../../notes/15-apps-script-route.md).

## When it goes wrong

| What happens | What the hub does | What the seller does |
|---|---|---|
| Paynow refuses the payment | `failed`, with Paynow's reason | Fixes the number or changes method. A new attempt is a new reference |
| No reply to `payment.start` | `unknown_external_outcome`; state `unknown` | Asks the customer whether they were charged. **Never charges again automatically** |
| The app retries `payment.start` | Returns the same payment; Paynow isn't called | Nothing |
| Same reference, different amount | `integrity_conflict` | Nothing: the app has a bug |
| Paynow is down during a check | `retryable_unavailable`; still `pending` | The app checks again, or takes another method |
| The phone goes offline after starting | The daily pass checks payments over an hour old | Checks the payment when back online |
| Nothing confirms it within 3 days | Closes it as `failed`, with a note | Reviews it with the customer |
| No keys for that currency | `payments_not_set_up` | Takes another method |

```mermaid
sequenceDiagram
  participant App as Dura app
  participant Hub as Shop Hub
  participant Paynow
  App->>Hub: payment.start
  Hub->>Hub: Claims the reference
  Hub-xPaynow: Request, no usable reply
  Hub-->>App: unknown_external_outcome
  App->>Hub: payment.start, same reference
  Hub-->>App: state unknown, Paynow not called
  Note over App: The seller asks the customer,<br/>then records the sale by hand<br/>or starts a new attempt
```

## Adding a provider

Each provider is one file behind `paymentAdapter_`, so the phone's protocol doesn't
change. ZB Smile&Pay is next.

| Part | Job |
|---|---|
| `methods` | The payment methods it offers |
| `keys(body)` | Checks and returns the keys to store |
| `start(record, keys, hubUrl)` | Starts a payment. Throws if the outcome is unknown |
| `check(record, keys)` | Returns `state`, `status` and `amount`. The only source of `paid` |
| `callback(raw, keys)`, `callbackReference(raw)` | Reads a status update, and says whether its signature is valid |

Wallets with no public API are written privately for one client and installed in
that client's own account, so that code isn't in this repository.

## Not built yet

- The app's payment screen, and its polling and timeout.
- Paynow's trace call, which could settle an `unknown` payment.
- InnBucks' authorisation code, which isn't passed back to the phone.
- Settlement matching: comparing gross, fees and payouts.
- Manual references, which are the app's job.
