---
name: dura-design-language
description: Maintain Dura POS design terminology, account headers and Owner/Cashier access clarity across screens and responsive variants. Use for product copy and role-view audits, not renaming technical identifiers.
---

# Dura design language and roles

The canonical terms are in `handbook/product/04-glossary.md`; current visual
rules and the access matrix are in
`handbook/design/prototype/cdx/-cdx-language-roles.md`.

- Label roles Owner and Cashier, with Cashiers as the collection. Staff, Seller
  and User are not alternate role labels. Technical compatibility keys can stay
  unchanged; do not rename routes or data properties to perform a copy change.
- Call an app installation Device, whether mobile or tablet. A contact has a
  mobile number. A till is the drawer/shift responsibility. A device is not a
  person: shared-device reports must use the recorded cashier.
- Stock names the destination and quantity held. Stock take is the physical
  counting task. Cash-up counts cash, not stock. Avoid Inventory as an alternate
  destination label.
- The compact account header shows shop, signed-in name and role. Location and
  device detail belong in the profile/task context. Healthy status does not need
  a permanent second bar. Offline or unresolved work remains discoverable.
- Mode is selected once, not re-explained in every header. Practice can use a
  small corner marker. A fictional account-layout preview must remain labelled
  Preview; never imply an account, payment or fiscal response is connected.
- Keep navigation positions consistent between roles. Show personal till/access
  to the cashier and business reports/settings to the owner; direct entry to an
  owner route must preserve the cashier's basket and explain the boundary.
- Check rendered text and accessible labels, including dialogs and hidden
  branches exposed by the catalog. Do not use a blind global replacement over
  IDs, selectors, icon names, source paths or historical decisions.

Use `dura-responsive-design` when the copy change affects layout. Record any
new permission or discount-limit assumption in the design status; do not turn a
demo limit into a production policy without the owner's instruction.
