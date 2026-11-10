# Decision: the Shop Sign identity

Status: Accepted
Date: 2026-11-10
Roadmap slice: shared presentation and Android identity

## Problem and evidence

The owner rejected the evergreen/gold palette and selected direction B,
“The Shop Sign”, after reviewing monochrome logos, a colour treatment and
Sell, Payment and My till. The owner authorised every `prototype/cdx` design
screen plus the actual app's icon and colours. App workflows stay unchanged.

## Decision and alternatives

Use the custom lowercase **dura** wordmark and its distinctive **d** as the
compact mark. Colours are charcoal ink `#252525`, chalk `#F4F0E8` and sign red
`#C3452D`. White work surfaces, neutral dividers and restrained red actions keep
the work readable. Errors retain words and separate burgundy tokens. Dark mode
uses neutral dark surfaces and readable light text, with red/white buttons.

This supersedes the foundation's silo/phone/dollar and green/gold identity.
A standalone granary and a D/granary monogram were considered; the owner chose
the wordmark. The name's meaning and product promises remain unchanged.

SVG masters live in `client/apps/dura/assets/branding`; the prototype references
the same wordmark. Android uses the matching d on red, with transparent inset
adaptive/monochrome artwork and a matching splash.
See [assets and provenance](../design/branding/04-shop-sign.md).

## Compatibility and migration

Only presentation tokens, artwork, Android resources and prototype branding
change. No routes, controllers, permissions, integrations, currency behaviour,
databases, journals or workbooks change. No business-data migration or restore
change is needed. Existing prototype sessions retain their state. Historical
artwork remains; this is not a store-media or repository-banner replacement.

## Acceptance and reversal

Run theme contrast and icon density/alpha/safe-circle checks, review all four
light/dark/text-scale golden changes, run Flutter workspace verification and
rerender/check both prototype entry points. Physical-device launcher caching,
masks and splash transitions remain device checks.

Reversal restores the old palette and generated resources together, without
rolling back business records. A later identity decision supersedes this one.
