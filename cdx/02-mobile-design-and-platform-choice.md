# Dura POS: mobile concept and platform choice

30 October 2026. Interactive design prototype, not an implemented POS.

> 2 November 2026: the platform direction is now Flutter with an Android-native
> fzimra adapter, reflecting desktop/web owner access. The Kotlin-first
> recommendation below is historical reasoning for the earlier Android-only
> assumption. Follow [the current engineering contract](engineering/00-engineering-contract.md)
> for implementation. The visual prototype remains useful regardless of framework.

## Recommendation

Use native Kotlin with Jetpack Compose for the first Android release. Flutter
can deliver the same visual design. The recommendation concerns integration
and maintenance rather than appearance or an unmeasured performance claim.

The existing sibling fzimra SDK is Kotlin-based and already owns Android
Keystore integration and background fiscal submission. Native Kotlin avoids
introducing a Dart-to-Kotlin boundary for this critical path. Room, background
work, camera scanning, printing, lifecycle recovery and account authorisation
also need close Android integration.

Flutter supports Kotlin/Java integration through platform channels and Pigeon.
It remains viable, particularly for a team already strong in Flutter or with
funded requirements for multiple platforms. It would require a maintained
fzimra plugin, explicit error/event contracts, and restart/recovery tests across
the boundary. An iOS interface alone would not port fzimra's Android device
integration. Cross-platform UI does not remove platform-specific work.

Do not choose between the two on guessed app size, battery usage, low-end phone
speed or development time. Measure representative release builds on the actual
phones before making those claims. Keep money rules, event formats, exports,
and gateway contracts documented and separate from UI code either way.

Primary references checked 30 October 2026:

- [Android Compose](https://developer.android.com/compose)
- [Flutter platform channels and Pigeon](https://docs.flutter.dev/platform-integration/platform-channels)
- Local sibling: `../zimra-fdms-android/README.md` and its guide.

## Design direction

- Sell is the default operational screen. Setup and owner reports do not slow
  the next customer.
- Restrained green, clear text, substantial touch targets, and familiar bottom
  navigation: Sell, Stock, Money, My shop.
- Start with product tiles; explore a compact list with the optional design
  control. Photos are unnecessary for recognising the sample catalogue.
- Label the active currency. The example uses USD; first-time setup requires
  an explicit choice, with no default currency.
- Charge shows the complete amount. Cash checkout shows change before saving.
- Keep saved locally, uploaded, provider verified, and fiscal accepted distinct.
- Export includes a readable preview and a completeness warning.
- Do not imply that an unconnected gateway has processed a payment.

## Screens and sample data

| Screen | Data preview | Primary action |
|---|---|---|
| First launch | Free core POS, offline selling, Excel/CSV access | Set up my shop |
| Quick setup | Chipo's Shop; pricing currency explicitly selected | Continue to practice selling |
| Sell | Bread USD 1.00; oil USD 4.50; sugar USD 2.50; mealie meal USD 3.80 | Charge the basket |
| Cash payment | Two loaves: total USD 2.00; received USD 5.00; change USD 3.00 | Complete cash sale |
| Confirmation | Sale ID, total, received, change, record status | Start next sale |
| Stock | Bread starts at 18 loaves; two sold leaves 16 | Receive stock |
| Cash-up | Opening USD 10; seed net sales USD 40; expenses USD 3; expected USD 47 | Save cash-up |
| My records | October sample sales table and field explanations | Preview export |
| Export | Excel, CSV, archive; provisional October records | Select export type |

Completing the USD 2.00 sample sale raises expected cash to USD 49.00. The
cash-up seed data are illustrative, not reconstructed from the displayed sample
sales table. That table is deliberately a preview, not a complete ledger.

## Prototype files

- `dura-mobile-concept.html`: inline interactive source; browser-local state only.
- `dura-mobile-preview.html`: generated standalone inspection wrapper. Its iframe
  contains the same source. Regenerate after changing the source.
- `dura-mobile-sell.png`: rendered visual preview after verification.
- `check-mobile-concept.cjs`: interaction and narrow-width checks for the wrapper.

The prototype does not connect Google, create merchant accounts, charge money,
print, export records, persist business data, or issue fiscal receipts. These
actions show previews or explanatory feedback. Practice data are fictitious.
The scan control demonstrates finding Bread; it does not access a camera.

Quick setup is a visual sketch, not the whole five-minute flow. Production must
also include owner-access protection, Google connection/deferred upload status,
first-product entry, and fiscal-readiness checks. Currency changes in this
preview relabel a demonstration catalogue; they are not a currency-conversion
workflow. No current exchange rates are represented.

## What to validate with shop owners

Observe adding two products, correcting a basket, taking cash, finding change,
handling uncertain mobile payments, receiving stock, cashing up with a
difference, and exporting a month. Measure mistakes and task completion before
polishing decoration.

Outstanding production design includes line-level quantity editing, actual
barcode scanning, PIN/role enforcement, tax classification, refund and fiscal
recovery, payment verification, counted-cash variance explanations, accessibility
with larger system text, localisation, and device/keyboard insets.
