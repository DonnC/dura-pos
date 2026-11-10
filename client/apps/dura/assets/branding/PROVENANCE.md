# Android launcher artwork / The Shop Sign

The owner selected B / The Shop Sign and approved its charcoal/chalk/sign-red
application on 10 November 2026. This supersedes the silo/phone/dollar artwork
for the app. The original exploration remains in the handbook as history.

Source reference: `handbook/design/branding/shop-sign/approved-direction-b.png`.
The path-only `shop-sign-wordmark.svg` traces the large approved wordmark;
`shop-sign-mark.svg` isolates that same d, rather than substituting a font.

- `shop-sign-launcher.svg` / `launcher-source.png`: full-square sign-red
  (`#C3452D`) background and white d; PNG is 1024 × 1024.
- `shop-sign-foreground.svg` / `launcher-foreground.png`: 1024 × 1024 transparent
  white mark, inset to fit Android's 66 dp safe circle on a 108 dp layer.
  The smaller adaptive geometry accounts for masking; it is not a different d.

The raster sources are SVG exports. No headings, rounded outer mask, textures,
gradients or shadows are part of the artwork. Regenerate Android resources from
`client/` using `dart run tool/generate_launcher_icons.dart`. The locked image
dependency produces five legacy sizes, transparent adaptive foreground,
monochrome wiring, splash and red colour resources. PNG sources are committed;
SVG rendering is only needed when editing the approved artwork.

The [brand guide](../../../../../handbook/design/branding/04-shop-sign.md)
and [decision 0011](../../../../../handbook/decisions/0011-shop-sign-identity.md)
document application and scope. Launcher tests check density, alpha and mask
containment. Physical-device launcher caching, masks and startup transitions
remain unverified. This is not a completed store-media asset set.
