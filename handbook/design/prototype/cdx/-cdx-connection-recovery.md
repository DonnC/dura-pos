# Shop connection, pairing and replacement recovery / CDX

10 November 2026. Interactive design only, inside `cdx`. No Google sign-in,
camera, QR token, archive import, phone registration or revocation is performed.
No Flutter, backend, protocol, workbook or production storage contracts change.

Choose **Connect & recover phones** in the preview board. The Device picker
shows phone, portrait tablet and landscape tablet viewports. The **Recovery
example** picker exposes failure states without needing a real account or file.
These examples are separate from the normal local till and never replace it.

## Three journeys

| Stage | Purpose / main action | Recovery |
|---|---|---|
| Connect the owner’s account | Explain owner account, shared records and local work; choose account | Offline → keep selling; cancel example chooser without changing work |
| Check the shop account | Review shop, currency, practice mode and owner control; preview checks | Back to account selection; no password entry |
| Connection result | Keep account, Hub, shared files, phone pairing and upload facts separate | Denied → choose account; unknown → check existing setup; preparing → keep selling |
| Add a phone | Owner names the separate phone and sees next steps; show example code | Empty name disables action; no staff or phone is silently added |
| Pairing code | Non-working illustration labelled as example; preview new phone scan | Expired/used → issue a fresh example; actual lifetime remains a Hub policy |
| New-phone shop check | Check name, currency and mode with owner; confirm before joining | Wrong shop/mode/currency, offline or unusable code stays blocked |
| New-phone next steps | Explain owner access, fresh PIN and opening count | Finish preview returns to the unchanged current till |
| Choose recovery snapshot | Replacement phone, source and dated example snapshot; review | Missing backup → ask owner; older snapshot → newer journal check required |
| Check what comes back | Identity, compatibility, snapshot coverage and missing work; acknowledge gap | Wrong shop/mode/currency, incompatible/unreadable/incomplete records stay blocked |
| Recovery next steps | Owner verifies new phone, fresh access, count and old-device review | No automatic seller sign-in, drawer opening or copied phone identity |
| Lost-phone follow-up | Device access is separate from seller access; preview block request | Hub not contacted / phone unconfirmed remain explicit; no erase or false recovery |

On phones these stages stack in one column with a fixed main action. At 900
CSS px, metadata and explanations sit alongside each other. Enlarged text uses
one column. New-phone examples show Dura’s approved wordmark without showing
the current till’s seller/account header as if it belonged to the new device.

## Decisions and assumptions

- **Preserve the active till:** every connection/pair/restore preview keeps the
  existing shop, pricing currency, signed-in person, drawer, basket, products,
  receipts, held work and unconfirmed payment references. There is no switch
  to another shop, restored session or new device. A working phone is not erased
  to make room for a replacement-phone demonstration.
- **Owner connects Google:** the owner uses an account they control to prepare
  their own Shop Hub and files. Other phones pair with that shop. The owner's
  Google sign-in/password is not shared with sellers. The account chooser here
  uses a generic example and collects no real email or credential.
- **Separate setup facts:** “example paired” does not mean a journal uploaded,
  files finished preparing, a provider confirmed payment or a fiscal receipt
  was accepted. The ordinary practice app's connection banner remains unchanged.
  A preview result never turns the browser into a live connected shop.
- **Unknown external outcome:** the owner checks an existing setup before
  another creation attempt. The example button demonstrates that check; it does
  not reinstall or contact Google. No retry policy or backend action changes.
- **Pairing identity:** a separate empty phone checks the expected shop,
  currency and mode before joining. The owner later assigns seller access;
  pairing alone does not give a staff PIN, open a drawer or copy the owner's
  Google account. Existing local work is not merged into a different shop.
- **Code lifetime:** a real pairing code is one-use and short-lived according
  to the issuer. This slice chooses no expiry duration, token format or secret
  storage policy. The displayed scan symbol is deliberately not a working QR.
  The local example's used/expired flags model the visible outcomes only.
- **Restore source trust:** Drive/Archive selections are named fixtures. No
  file is opened, authenticated, decrypted, hashed or replayed. In this example
  the alternate local archive is a separate compatible fixture, not a bypass
  that would make an arbitrary real archive trustworthy.
- **Restore compatibility:** the expected shop identity, practice/live mode,
  pricing currency, compatible format and accepted-record coverage must match.
  Older snapshots need newer journal records checked first. The prototype
  demonstrates those gates; real identity, schema and acknowledgement checks
  remain implementation work.
- **Offline limits:** existing authorised tills can keep selling offline.
  Connecting Google, checking a Drive backup and exchanging a new-phone pairing
  code require connectivity. A local archive may be checked locally, but it
  does not itself authorise a replacement phone or create its new credentials.
- **Missing work:** anything never uploaded from a lost phone may be absent.
  The owner acknowledges that gap before previewing recovery. A historical
  snapshot is not presented as a complete current shop total. No fiscal device
  identity, counters, keys or old PIN verifiers are restored in this design.
- **Lost device versus seller:** blocking Phone 2 is a device operation; the
  seller may still be allowed on other phones. A disconnected device cannot
  immediately learn a revocation. Blocking does not erase the phone or recover
  its unsent work. Staff permissions are not changed by this preview.

## Example data and storage effects

The shop is the current fictional shop, default Chipo’s corner shop. Prices
keep the selected shop currency, default USD only in the initial practice
fixture. The prospective device is Counter spare. The compatible example
snapshot is dated **10 Nov 2026, 08:12**; the older **9 Nov, 18:30** snapshot
requires a newer-record check. Moyo Market and Live/alternate-currency examples
demonstrate mismatches. These dates and compatibility statements are fixtures,
not results from actual backup contents or a remote API.

The interaction test starts with USD 70.50 cash, USD 86.50 sales, an unfinished
USD 3.50 basket and one unconfirmed payment. The complete preview journey,
including a lost-device block example, leaves all those values, shop identity,
products and role unchanged. No new financial or stock event is posted.

Optional `recoveryDemo` stores only UI selections and example flags: condition,
whether an example account was selected, phone name, code used/expired, source,
backup choice and preview completion. No token, email, PIN, QR contents, file
bytes or Google data is stored. Phone/source selections persist after input;
checkbox acknowledgements reset on re-entry and are revalidated on action.
Reset/new-shop setup clears the field. Existing practice sessions need no
migration. There is no production migration, restore or file lifecycle change.

## States and verification

The picker supports ready, offline, account access declined, setup unconfirmed,
records preparing, code expired/used, wrong shop/mode/currency, newer backup,
unreadable backup, record gap and missing backup. Cases apply to their relevant
stage. Cash selling stays reachable when setup waits. “Success” screens always
say **Example** and never claim a real upload/import/connection.

`-cdx-connection-check.cjs` covers account selection, setup result, one-use code,
explicit shop confirmation, mismatched/incomplete backup gates, older snapshot,
offline pairing/cash behaviour, alternate compatible fixture, preserved till
state and owner-only recovery screens. It renders twelve stages at 320, 390,
768 and 1024 CSS px, in light/dark and 200% text: 144 combinations.

- [Phone account review](-cdx-phone-connection-review.png) / [tablet account review](-cdx-tablet-connection-review.png).
- [Phone connection status](-cdx-phone-connection-status.png) / [tablet status](-cdx-tablet-connection-status.png).
- [Phone pairing](-cdx-phone-pair-code.png) / [tablet pairing](-cdx-tablet-pair-code.png).
- [Phone new-shop check](-cdx-phone-join-review.png) / [tablet shop check](-cdx-tablet-join-review.png).
- [Phone restore review](-cdx-phone-restore-review.png) / [tablet restore review](-cdx-tablet-restore-review.png).
- [Phone lost-device review](-cdx-phone-lost-phone.png) / [tablet device review](-cdx-tablet-lost-phone.png).

Final checks and the next design slice are in [status.md](status.md). Browser
rendering/interaction tests are not real OAuth, camera, secure pairing, backup
integrity, provider recovery, physical-device, keyboard, TalkBack or vendor
usability verification.
