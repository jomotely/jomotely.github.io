"""Regenerate Siftly's PWA icon set in the Signal blue (#3B9EFF).

Draws the same sieve mark as favicon.svg / Logo.tsx: a rounded tile with three
descending bars and one falling grain. Run once; output overwrites the PNGs in
public/icons/.
"""

from PIL import Image, ImageDraw

BLUE = (59, 159, 255, 255)  # #3B9EFF
WHITE = (255, 255, 255, 255)


def rounded_tile(size: int, radius_frac: float, inset_frac: float = 0.0) -> Image.Image:
    """A Signal-blue rounded square covering the full canvas (or an inset of it)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    inset = int(size * inset_frac)
    radius = int(size * radius_frac)
    box = (inset, inset, size - inset, size - inset)
    draw.rounded_rectangle(box, radius=radius, fill=BLUE)
    return img


def sieve(size: int) -> Image.Image:
    """Standard icon: tile + bars + dot, same geometry as the SVG (viewBox 64)."""
    img = rounded_tile(size, 16 / 64)
    draw = ImageDraw.Draw(img)
    s = size / 64.0

    def bar(x, y, w, h, opacity):
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle(
            (x * s, y * s, (x + w) * s, (y + h) * s),
            radius=3.5 * s,
            fill=(255, 255, 255, int(255 * opacity)),
        )
        return Image.alpha_composite(img, overlay)

    img = bar(16, 17, 32, 7, 1.0)
    img = bar(20, 29, 24, 7, 0.92)
    img = bar(24, 41, 16, 7, 0.85)

    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    cx, cy, r = 32 * s, 52.5 * s, 3.5 * s
    od.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, int(255 * 0.75)))
    img = Image.alpha_composite(img, overlay)
    return img


def maskable(size: int) -> Image.Image:
    """Maskable icon: full-bleed square, mark shrunk into the 80% safe zone."""
    img = Image.new("RGBA", (size, size), BLUE)
    inner = sieve(size)
    # Rebuild the mark at 78% scale, centered, on the full-bleed tile.
    scale = 0.78
    small = inner.resize((int(size * scale), int(size * scale)), Image.LANCZOS)
    offset = ((size - small.width) // 2, (size - small.height) // 2)
    img.alpha_composite(small, offset)
    return img


if __name__ == "__main__":
    sieve(192).save("public/icons/icon-192.png")
    sieve(512).save("public/icons/icon-512.png")
    maskable(512).save("public/icons/maskable-512.png")
    sieve(180).save("public/icons/apple-touch-icon.png")
    print("icons regenerated")
