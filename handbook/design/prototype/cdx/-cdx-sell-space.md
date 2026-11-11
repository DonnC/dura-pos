# Sell screen: use the counter space

11 November 2026 · Design prototype only.

The previous wide Sell view expanded four Favourites into two oversized columns.
It also allowed an empty basket to consume 32% of a very wide viewport. Both
choices reduced the useful shelf space.

## Revised layout

- Mobile retains two product columns and the reachable payment action.
- Tablet and wide counters use an adaptive grid, with a 148 px minimum track
  and compact cards. A short category leaves empty grid positions instead of
  stretching its products into large panels.
- The basket stays visible, between 280 and 380 px wide. Its quantity controls,
  Hold sale and payment total keep their existing responsibilities.
- Tablet search shares the top row with the compact Sell heading. Search and
  categories remain available while scrolling products. Large text uses a
  flowing toolbar and larger cards, with its existing single-pane fallback.
- Category buttons show counts and scroll horizontally on mobile; their words
  and counts are not squeezed into partially visible button contents.
- Favourites uses explicit product flags in the full-shop example. It no longer
  silently cuts the shelf off at four products. Search finds products across
  categories, and resizing preserves the basket and search entry.

## Representative shop example

The main preview now opens Sell with `shelf=full`: 24 fictional products across
Food, Drinks and Household, with 12 marked Favourites. It starts on All items so
the review demonstrates a full shelf. This is sample content, not a requirement
that shops sell these products or a new production catalogue policy.

The original six-product fixture remains available when `shelf=full` is omitted.
The larger example is created only for a fresh preview and uses the existing
bounded browser state when edited. Additional items use letter placeholders for
missing product pictures; no unrelated branded photo is presented as the item.
No app data, production record, migration or restore contract changes.

## Actual captures

| Layout | Columns | Fully visible cards | Preview |
| --- | ---: | ---: | --- |
| Mobile, 390 × 844 | 2 | 4 | [Mobile](-cdx-sell-density-mobile.png) |
| Tablet portrait, 768 × 1024 | 2 | 8 | [Portrait](-cdx-sell-density-tablet-portrait.png) |
| Tablet landscape, 1024 × 768 | 3 | 9 | [Landscape](-cdx-sell-density-tablet-landscape.png) |
| Wide counter, 1440 × 900 | 5 | 20 | [Wide](-cdx-sell-density-wide.png) |
| Supplied screenshot size, 1913 × 915 | 8 | 24 | [Full width](-cdx-sell-density-full-width.png) |

These counts describe the normal-text sample at these exact browser sizes, not
fixed product limits. Larger text and longer product names can show fewer cards.
The [empty-basket wide view](-cdx-sell-density-empty-basket.png) keeps the same
shelf density. [Updated payment](-cdx-preview-updated-payment.png) and
[owner report](-cdx-preview-updated-reports.png) captures are also available.

Open [-cdx-preview.html](-cdx-preview.html), choose a mobile/tablet size or the new
Wide counter size, and use the journey/screen controls for the other designs.
The [complete catalog](-cdx-coverage.html) includes the full-shop shelf example.

`-cdx-sell-density-check.cjs` checks six sizes in light, dark and large text,
visible-product targets, category-label fit, search, filtering and basket/resize
preservation. It refreshes eight captures. Results and next steps are recorded
in [status.md](status.md). Physical-device checks and Figma remain separate.
