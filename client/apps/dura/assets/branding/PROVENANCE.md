# Android launcher artwork

Source reference: handbook/design/branding/dura-silo-phone-dollar-v3.png, the owner's approved
unified silo/phone mark with a dollar symbol. launcher-source.png is its standalone
launcher adaptation of that approved mark.

Edit prompt (line-wrapped for readability):

Use case: precise-object-edit. Extract the APPROVED bottom-right app icon tile
from the reference brand board into ONE standalone square Android launcher
source asset. Preserve its existing tapered silo rising from wide base to narrow
roof, unified mobile phone on the right with clear $ sign, the white silo and
grain-gold phone on solid dark evergreen background. Keep the approved mark's
geometry and identity, no redesign. Remove all surrounding brand-board material,
all headings and wordmarks. Output square 1024x1024 full-bleed solid evergreen
background without pre-rounded corners. The mark centered and fully contained
in the middle 60% of the canvas so Android adaptive circular masks cannot cut
any part off. Crisp flat clean edges, no texture, no gradients, no shadows.
Only the $ symbol on the phone, no other text.

Run dart run tool/generate_launcher_icons.dart from client/ to resize
this source into Android legacy and adaptive resources. No Flutter placeholder
icons remain. This is launcher artwork, not a completed store media asset set.
Physical-device launcher mask appearance remains to be verified.
