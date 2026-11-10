---
name: premium-mobile-product-design
description: Design or review Dura POS mobile journeys, Flutter or Android screens, theme tokens, accessibility and visual consistency. Use for mobile UX and visual implementation, complementing engineering rules.
---
# Mobile product design and UX

## Read first

- `handbook/product/03-experience-principles.md`: the five-second rule,
  states, language, identity, targets and the UI pull-request checklist.
  **This is the standard.**
- `handbook/product/01-vision.md`, for who the users are.
- `handbook/design/mobile-concept.md` and its prototype, before repeating
  discovery.

## Rules

- **Users:** small-shop owners and cashiers on cheap Android phones, often
  outdoors and one-handed, with patchy connectivity.
  - Keep research evidence apart from hypotheses.
  - Never invent interviews, competitor findings or compliance results.
- **For a major screen, define:**
  - its purpose;
  - entry and exit;
  - its hierarchy and one main action;
  - the input it needs;
  - how it recovers.

  Cover the loading, empty, populated, offline, error, disabled and
  interrupted states.
- **Navigation and actions:** familiar navigation, progressive disclosure,
  and reachable actions. Amounts show their currency; quantities show units.
- **No decoration that slows selling:** no generic gradients, glass,
  gratuitous cards or shadows, or long animations.
- **Tokens and components:**
  - colours, type, spacing, radius, status and motion come from `dura_ui`
    tokens;
  - compose existing components;
  - business rules stay behind controllers.
- **Identity:** the approved Shop Sign wordmark and d; charcoal, chalk and
  sign red. Follow `handbook/design/branding/04-shop-sign.md` and decision 0011.
  Preserve the approved letterforms; don't redesign the mark.
- **Accessibility:** check SafeArea and insets, 320 px width, 200% text,
  semantic labels, focus order, feedback that doesn't rely on colour, and
  reduced motion.
- **Don't redesign screens** when only engineering work was asked for.

## Done when

- An actual render was inspected and golden diffs reviewed. A screen that
  compiles isn't verified.
- Interaction and semantics are tested separately (see `dura-ui`).
- Audit findings are ranked by user impact, and unverified device or
  accessibility conditions are reported.
