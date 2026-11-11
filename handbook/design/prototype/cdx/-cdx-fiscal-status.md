# Optional fiscal status and recovery

Design sandbox · 11 November 2026 · Shop Sign B.

The cashier needs a clear next step without taking payment twice. The owner
needs to find the original receipt, understand the problem and preserve its
history. Fiscal details stay behind an optional entry in My shop, with a
separate owner area for day close and device recovery.

Open [-cdx-preview.html](-cdx-preview.html), choose **Fiscal status & recovery**,
then Device, Tablet portrait or Tablet landscape. Individual screen selection
exposes the **Fiscal example** selector for waiting, uncertain, refused,
received-with-finding, accepted, day-close and device-access cases.

## Screen contracts

| Screen | Purpose and entry | Main action / exit | Recovery |
| --- | --- | --- | --- |
| Test setup | Owner settings; explain optional setup | Preview test-device status | No live activation or credential entry |
| Receipt queue | My shop; own records for worker, this device for owner | Open a receipt; return to till | Filters and explicit empty view; no invented complete shop history |
| Receipt status | Original reference and separate local/upload/fiscal facts | Check existing reference or ask owner | Unconfirmed remains unconfirmed; refused and findings are distinct |
| Existing result | Same document identity | Show a labelled example answer | No new sale, charge or fiscal submission |
| Owner issue review | Receipt needing attention | Check same reference | Preserve signed content; safe support details stay local |
| Fiscal day | Owner overview and configured deadline | Review day close | Till shift and fiscal day have separate outcomes |
| Close review | Same day, outstanding states visible | Request-close preview only after review | Pending/failed retain identity; no force-close or counter editing |
| Device recovery | Owner access or storage concern | Review shop-record recovery | Preserve old references; do not clone fiscal identity |

Device screens use one reading column and a reachable primary action. At tablet
landscape width, receipt facts and next steps use two columns; navigation stays
in the familiar rail. Large text returns to one column. The queue remains a
simple list rather than a dashboard of small status cards. Words carry every
status; colour is supporting feedback.

## Outcomes and interruptions

- **Waiting to send:** not delivered; later records retain their order.
- **Result not confirmed:** check the original identity before further action.
- **Needs owner review:** refused submission; a later record may wait behind it.
- **Received · Day-close issue:** this specific fixture has a close-blocking
  finding. It does not mean every validation warning blocks close.
- **Example accepted:** a successful test response, without a live receipt.
- **Close waiting / failed / closed:** independent results for example day 17.
  A request never becomes a confirmed close just because it was tapped.

Unconfigured is the default; it adds no queue entry to everyday My shop. Empty
filters offer Show all states. Offline/uncertain responses remain unresolved.
The response chooser is an explicit design-review device, not a production
button that lets a cashier declare acceptance. No real network/loading time is
simulated. The saved preview state can survive a reload; it offers no guarantee
of production recovery. Worker links to owner screens show the existing owner
access guard, and another cashier's reference cannot be opened by the worker.

## Assumptions and limits

- Examples use three fixed fictional documents, two cashiers and one fiscal day.
  `F-EX-*` identifiers are labels, not assigned authority identifiers. Sample
  sales retain 10 November dates; this design pass is dated 11 November.
- A linked credit-note fixture makes the document type explicit; this pass does
  not design legal correction rules, taxes or an issued credit-note document.
- Deadline wording comes from a future configured device policy. No statutory
  number of hours, automatic retry interval or legal workflow is invented here.
- Optional cash-selling availability follows the product promise; it is not
  advice about a business's permission to trade without fiscal receipts.
- Production setup, authority registration, device replacement and signed-data
  repair need separately verified procedures. This is no certification claim.
- Records restored for the shop do not imply restored fiscal keys, counters or
  device identity. Replacement handling shown here is an owner review prompt,
  not a verified deregistration or migration procedure.

`s.fiscalDemo` stores only the enabled flag, selected fixture, fixture condition,
first answer and day-preview state. The three document rows are fixed; no
unbounded journal is added. No production file, tab, schema or migration changes.
Sale history, basket, cash, stock, upload queue and active till are unaffected.
There is no network request, signed payload, fiscal number, working QR code,
credential storage, import, reset or message sent to support.

The authority's [invoice validation guidance](https://www.zimra.co.zw/frequently-asked-questions/2322-how-to-validate-and-review-of-details-on-fiscal-tax-invoices-debit-or-credit-note-on-fdms)
distinguishes validating a fiscal document from merely possessing an invoice.
The [local SDK troubleshooting guide](../../../../../zimra-fdms-android/docs/troubleshooting.md)
and [guide](../../../../../zimra-fdms-android/docs/guide.md) informed the queue,
finding and day-close distinctions. These references guide the design; no
integration was exercised and no compliance conclusion follows.

## Review captures

| View | Device | Tablet landscape |
| --- | --- | --- |
| Queue | [Device](-cdx-phone-fiscal-queue.png) | [Tablet](-cdx-tablet-fiscal-queue.png) |
| Unconfirmed receipt | [Device](-cdx-phone-fiscal-receipt.png) | [Tablet](-cdx-tablet-fiscal-receipt.png) |
| Owner issue review | [Device](-cdx-phone-fiscal-owner-review.png) | [Tablet](-cdx-tablet-fiscal-owner-review.png) |
| Fiscal day | [Device](-cdx-phone-fiscal-day.png) | [Tablet](-cdx-tablet-fiscal-day.png) |
| Close waiting | [Device](-cdx-phone-fiscal-close.png) | [Tablet](-cdx-tablet-fiscal-close.png) |
| Device recovery | [Device](-cdx-phone-fiscal-device.png) | [Tablet](-cdx-tablet-fiscal-device.png) |

Automated checks live in [-cdx-fiscal-check.cjs](-cdx-fiscal-check.cjs).
Physical devices, keyboard/insets, TalkBack, vendor observation and live fiscal
responses remain unverified. See [status.md](status.md) for completed checks.
