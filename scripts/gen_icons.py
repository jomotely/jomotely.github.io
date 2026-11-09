#!/usr/bin/env python3
"""Generate Siftly PWA icons (PNG) from the brand geometry used in favicon.svg.

Run: python3 scripts/gen_icons.py
Outputs into public/icons/: icon-512.png, icon-192.png, maskable-512.png,
apple-touch-icon.png.
"""

from PIL import Image, ImageDraw
import os

OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "public", "icons"))
BLUE = (29, 155, 240)  # signal blue


def solid(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            px[x, y] = BLUE
    return img


def glyph_layer(size: int) -> Image.Image:
    """The sieve mark: three narrowing bars and a falling dot, in white."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    s = size / 512.0
    bar = lambda x1, y1, x2, y2, alpha: d.rounded_rectangle(
        [x1 * s, y1 * s, x2 * s, y2 * s],
        radius=28 * s,
        fill=(255, 255, 255, alpha),
    )
    bar(128, 150, 384, 206, 255)
    bar(160, 236, 352, 292, 235)
    bar(192, 322, 320, 378, 217)
    d.ellipse(
        [228 * s, 402 * s, 284 * s, 458 * s],
        fill=(255, 255, 255, 191),
    )
    return layer


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    base = solid(512).convert("RGBA")

    # Standard icon: rounded-square tile with transparent corners.
    mask = Image.new("L", (512, 512), 0)
    ImageDraw.Draw(mask).rounded_rectangle([32, 32, 480, 480], radius=120, fill=255)
    tile = base.copy()
    tile.putalpha(mask)
    icon = Image.alpha_composite(tile, glyph_layer(512))
    icon.save(os.path.join(OUT, "icon-512.png"))
    icon.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, "icon-192.png"))

    # Maskable icon: full-bleed background, glyph inside the 80% safe zone.
    maskable = base.copy()
    glyph = glyph_layer(512).resize((410, 410), Image.LANCZOS)
    maskable.alpha_composite(glyph, ((512 - 410) // 2, (512 - 410) // 2))
    maskable.save(os.path.join(OUT, "maskable-512.png"))

    # Apple touch icon: opaque, full-bleed, 180x180.
    apple = solid(180).convert("RGBA")
    apple.alpha_composite(glyph_layer(180))
    apple.convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))

    for name in ("icon-512.png", "icon-192.png", "maskable-512.png", "apple-touch-icon.png"):
        path = os.path.join(OUT, name)
        print(name, os.path.getsize(path), "bytes")


if __name__ == "__main__":
    main()
