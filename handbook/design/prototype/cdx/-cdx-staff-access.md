# Cashier access, removal and offline work / CDX

10 November 2026. Browser design prototype only. All changes are inside `cdx`;
no Flutter, Shop Hub, protocol, credentials or production permission rules change.
The Dura project and mobile product design skills guided this pass, including
the engineering contract's requirement to distinguish cached access and remote
revocation. This is not a security implementation.

## Journeys

Choose **Manage cashier access** in the preview board and use Device to inspect
device, tablet portrait or tablet landscape. The role/condition examples are
separate fictional sessions, not live views of connected devices.

| Screen | Purpose / main action | Recovery |
|---|---|---|
| Cashiers & devices | Choose a cashier or add a person; keep person/device responsibility separate | Owner-only; existing receipts remain attributed to their original cashier |
| Cashier access | Fixed Cashier role, allowed devices, two optional permissions; review access | Name/device selection validation, duplicate-name recovery, persisted edit draft |
| Check cashier access | Show permissions and where the change applies; save locally | Back retains edits; restoring removed access is explicitly labelled |
| Access update | Show local save and unconfirmed remote delivery; back to people | Explicit preview of a device receiving a change; never presented as a real acknowledgement |
| Remove selling access | Explain local effect, offline device and preserved records; remove | Keep access for now; no erase, automatic drawer close or Android lock |
| My access | Cashier sees current permissions and last check; return to selling | A check with no connected Hub reports no update and does not renew access |
| Owner check needed | Explain next offline shift and work kept; owner checks this device | No new cashier shift without a local owner check; ordinary authorised open shift continues |
| Selling access removed | Block new cashier operations, retain work; owner takes over | Local owner PIN → supervised cash-up → explicit owner handover |
| Owner check | Either allow one offline shift or supervise a removed cashier's handover | Wrong PIN feedback; removal cannot be undone by the one-shift approval |

Devices use a single scrollable column with a fixed main action. Cashier editing,
review, removal and recovery are focused flows without bottom tabs. At 900 CSS
px, permissions and device selection, or status and explanation, sit alongside
each other. Enlarged text returns to one column.

## Permissions

The cashier's base work stays familiar: sell, view stock, find own receipts and
count their own drawer. The owner can allow **sales on account** and **keeping /
using customer change**, only when those shop features are enabled. New cashiers
start with those two optional permissions off. Existing practice Rudo keeps
them on for compatibility with earlier design journeys.

Refunds, kept-change payouts and money out continue to require owner approval.
Stock changes, settings, cashier management and owner records remain owner-only.
There is no manager/promote-to-owner editor or discount override in this slice.
When a permission is off, the payment entry disappears and the direct screen
offers ordinary cash checkout with the basket intact.

The cashier sets their own PIN on an allowed device. The owner form does not ask
for the cashier's PIN or create/send an invitation. Actual enrolment, PIN setup,
reset and sign-in for newly added names remain future screens; the current
interactive role switch retains the two existing Chipo/Rudo practice personas.

## Decisions and assumptions

- **Offline expiry is shift-based:** an already-authorised open shift continues
  without network. Before another offline shift, an owner can approve one shift
  on this device using local credentials. That approval ends when the shift
  closes. It neither changes the cashier's role nor authorises another device.
  This is a proposed UX policy, not a settled production decision. There is no
  timed cut-off within a long open shift in this example. Time limits, trusted
  clocks, crash recovery and owner absence need validation before implementation.
- **Received removal takes precedence:** a removed cashier or a cashier no longer
  allowed on this device cannot save a new sale or regain access via an offline
  shift approval. The owner can supervise the existing drawer and start their
  own shift after counting/handover. Saved cashier attribution is not rewritten.
- **Remote removal is not immediate:** Device 1 applies its local change; Device
  2 may keep its old cached permissions until it receives the update. The owner
  sees the last-seen time and an unconfirmed state. A device removed from the
  allowed list remains a pending delivery target until receipt is demonstrated.
- **No fabricated delivery:** the sandbox has no Hub connection. The optional
  receiving-device button explicitly opens an example outcome. It does not
  contact another device, verify delivery or alter a real cashier account.
- **Owner recovery is supervised:** removed cashier cash-up remains attributed to
  that cashier. An owner supervision banner is shown, the unfinished basket is
  held on close, and the handover permits only the owner. Cash and sales do not
  change merely because access was removed. A count difference still needs an
  explanation. Owner check records name Chipo as the practice approver and the
  current cashier as requester; no PIN is stored in those records.
- **Device access is separate from device control:** removing access does not
  sign out Google, lock Android, wipe a device or erase unsent records. Physical
  custody, Android security and lost-device recovery need their own procedures.
- **Two sample devices:** Device 1 is Front counter; Device 2 is the Counter spare,
  last seen at 08:12 in the fictional day. Normal old sessions start with Rudo
  on Device 1 only; `access=sample` demonstrates both devices. These times are
  example data, not actual refresh results.
- **No server/security claim:** action/page checks make the prototype consistent.
  Real permission enforcement must live in application use cases and Hub
  operations, with protected PIN verification and reviewed caching/revocation
  rules. Browser JavaScript and the public practice PIN provide none of that.

## States, sample data and storage effects

The preview picker can open permission editing, review, removal, delivery,
current access, an expired offline grant, received removal and local recovery.
`access=pending` is the owner's example of removal saved on Device 1 while Device
2 is unconfirmed. `access=expired` shows a closed shift needing an owner check;
`access=removed` shows received removal. These are deliberate practice states.

The checks use an unchanged owner till (USD 70.50 cash, USD 86.50 sales), an
unfinished USD 3.50 basket and an unconfirmed payment. Removing cashier access
keeps all of them. In a separate removed-worker case, Rudo's USD 20.50 drawer is
counted and USD 5.00 left for handover; the basket is held and Rudo stays removed.
The owner then starts their own opening count. A valid offline Rudo shift still
takes a USD 3.50 cash sale: worker till cash USD 20.50 → USD 24.00.

There is no network loading spinner or false success. Empty/new-person fields,
no device selected, duplicate names, denied feature, wrong PIN, offline cached
access, unconfirmed delivery and received removal each have a next step.

Optional `staffAccess` and `staffAccessDraft` fields extend only existing browser
practice data. Existing Rudo/extra cashier names are copied lazily; no old receipts
are renamed or deleted. Up to nine cashiers are retained, matching the previous
one plus eight practice cashier limit. Owner edits persist after input; a draft
does not apply permission changes until reviewed/saved. PIN inputs and active
supervision do not persist. Reload after removal requires another owner check;
an unfinished cash-up count must be entered again under the existing prototype's
count-screen behaviour. A saved one-shift grant persists until that shift closes.
Reset/new-shop setup clears the optional fields.

This introduces no production record format, workbook, protocol, migration or
restore contract. Pending provider references remain untouched; owner resolution
of an unconfirmed provider payment is not implemented by the access-recovery
screens, and must not be treated as another payment request.

## Verification and captures

`-cdx-access-check.cjs` covers reviewed permission changes, removed-device delivery
targets, preserved money/basket/payment, known removal, authorised offline cash,
one-shift grant expiry, wrong PIN, supervised owner takeover, held work and
cashier/owner boundaries. It renders eight scenes at 320, 390, 768 and 1024 CSS
px in light/dark and 200% text: 96 layout combinations.

- [Device cashier access](-cdx-phone-staff.png) / [tablet cashier access](-cdx-tablet-staff.png).
- [Device delivery](-cdx-phone-access-status.png) / [tablet delivery](-cdx-tablet-access-status.png).
- [Device removal review](-cdx-phone-access-remove.png) / [tablet removal](-cdx-tablet-access-remove.png).
- [Device own access](-cdx-phone-my-access.png) / [tablet own access](-cdx-tablet-my-access.png).
- [Device offline check](-cdx-phone-access-expired.png) / [tablet offline check](-cdx-tablet-access-expired.png).
- [Device received removal](-cdx-phone-access-removed.png) / [tablet received removal](-cdx-tablet-access-removed.png).
- [Device local recovery](-cdx-phone-access-recovery.png) / [tablet recovery](-cdx-tablet-access-recovery.png).

Results and the next task are in [status.md](status.md). Browser checks are not
physical-device, TalkBack, secure-PIN, real offline-cache or remote-revocation
verification.

## Subsequent design pass

The later language/report/discount pass adds manual discounts. See
[-cdx-language-roles.md](-cdx-language-roles.md),
[-cdx-discounts.md](-cdx-discounts.md) and
[-cdx-owner-report-details.md](-cdx-owner-report-details.md) for the current
contract. Earlier limitations above describe that original slice.
