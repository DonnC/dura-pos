# Copyright (c) 2026, DonnC & contributors.
# Please see the AUTHORS file for details. All rights reserved.
# Use of this source code is governed by the MIT license that can be
# found in the LICENSE file at the repository root.
# SPDX-License-Identifier: MIT

"""Placeholder product and supplier-invoice photos, so the folders look as
they would in Drive.
"""

from __future__ import annotations

from dura_templates.sample.business import PRODUCTS, business_dir
from dura_templates.sample.records import purchases_y


CATEGORY_COLOURS = {"Bakery": (237, 201, 140), "Dairy": (220, 235, 247), "Groceries": (226, 239, 218),
                    "Drinks": (189, 215, 238), "Snacks": (255, 230, 153), "Toiletries": (234, 209, 220),
                    "Household": (217, 217, 217)}


def write_photos():
    """Placeholder product photos (a coloured square with the name) and supplier
    invoice photos, where the records link to them.
    """
    from PIL import Image, ImageDraw
    folder = business_dir() / "Product photos"
    folder.mkdir(parents=True, exist_ok=True)
    for pid, name, cat, *_ in PRODUCTS:
        img = Image.new("RGB", (240, 240), CATEGORY_COLOURS.get(cat, (240, 240, 240)))
        d = ImageDraw.Draw(img)
        d.rectangle([8, 8, 231, 231], outline=(90, 90, 90), width=2)
        d.text((18, 20), pid, fill=(40, 40, 40))
        for i, word_line in enumerate([name[j:j + 26] for j in range(0, len(name), 26)]):
            d.text((18, 100 + i * 16), word_line, fill=(20, 20, 20))
        d.text((18, 210), "sample photo", fill=(110, 110, 110))
        img.save(folder / f"{pid}.jpg", quality=60)
    for year, rows in purchases_y.items():
        for r in rows:
            if not r[15]:
                continue
            path = business_dir() / r[15]
            path.parent.mkdir(parents=True, exist_ok=True)
            img = Image.new("RGB", (200, 280), (252, 252, 248))
            d = ImageDraw.Draw(img)
            d.text((12, 12), r[6], fill=(0, 0, 0))
            d.text((12, 32), f"Invoice {r[7]}", fill=(0, 0, 0))
            d.text((12, 52), f"{r[1]:%d %b %Y}", fill=(0, 0, 0))
            for i in range(8):
                d.line([12, 90 + i * 18, 188, 90 + i * 18], fill=(200, 200, 200))
            d.text((12, 250), f"Total USD {r[10]:.2f}", fill=(0, 0, 0))
            img.save(path, quality=50)
