"""
extract-marquetry-images.py

Extracts the 22 Marquetry designs from "Marquetry by CITIPLY.pdf" (pages 4-25)
into veneer-images/marquetry-veneers/<SKU>.png for upload-veneer-images.ts.

The PDF has no text labels on the design pages, so page -> SKU was matched
visually against the descriptive names already in the DB.

Unlike the FC4 fan deck, these pages are NOT full-bleed: the artwork is placed
with white bands above/below (and p14 is a two-panel composition made of two
separate embedded images). So each page is rendered and then auto-cropped to
its non-white bounding box, rather than extracting a single embedded image.

Run: python scripts/extract-marquetry-images.py "<path to Marquetry pdf>"
"""

import os
import sys

import pymupdf
from PIL import Image, ImageChops

SCALE = 3.0        # 540x780pt -> 1620x2340px, comfortably above the 1200px main
WHITE = 246        # anything at/above this on all channels counts as page white
PAD = 2            # trim this much extra off each side after the bbox

# (pdf page, SKU) — matched visually to the DB's descriptive names
ITEMS = [
    (4,  "MARQUETRY-ABSTRACT-GEO"),
    (5,  "MARQUETRY-CUBE-PARQUET"),
    (6,  "MARQUETRY-HEX-INTERLOCK"),
    (7,  "MARQUETRY-ARTDECO-FAN"),
    (8,  "MARQUETRY-STAR-PARQUET"),
    (9,  "MARQUETRY-FEATHER-LEAF"),
    (10, "MARQUETRY-SUNBURST-SCALE"),
    (11, "MARQUETRY-WAVE-FLOW"),
    (12, "MARQUETRY-SWIRL-INLAY"),
    (13, "MARQUETRY-CAMO-ORGANIC"),
    (14, "MARQUETRY-DIAMOND-CHEVRON"),
    (15, "MARQUETRY-MUGHAL-FLORAL"),
    (16, "MARQUETRY-MUSICIAN-PORTRAIT"),
    (17, "MARQUETRY-DURGA-ART"),
    (18, "MARQUETRY-TENNIS-PORTRAIT"),
    (19, "MARQUETRY-WOMAN-POP"),
    (20, "MARQUETRY-WINE-POUR"),
    (21, "MARQUETRY-MONO-FLORAL"),
    (22, "MARQUETRY-BAMBOO-SCENE"),
    (23, "MARQUETRY-RABBIT-ART"),
    (24, "MARQUETRY-LION-PORTRAIT"),
    (25, "MARQUETRY-TROPICAL-SAFARI"),
]

SLUG = "marquetry-veneers"


def autocrop(im):
    """Trim uniform near-white page margins, keeping the artwork."""
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im.convert("RGB"), bg).convert("L")
    # treat near-white as background
    mask = diff.point(lambda v: 255 if v > (255 - WHITE) else 0)
    box = mask.getbbox()
    if not box:
        return im
    l, t, r, b = box
    l, t = min(l + PAD, im.width), min(t + PAD, im.height)
    r, b = max(r - PAD, 0), max(b - PAD, 0)
    if r - l < 50 or b - t < 50:
        return im
    return im.crop((l, t, r, b))


def main():
    pdf = sys.argv[1] if len(sys.argv) > 1 else None
    if not pdf or not os.path.exists(pdf):
        sys.exit("usage: python scripts/extract-marquetry-images.py <path to Marquetry pdf>")

    out_dir = os.path.join(os.getcwd(), "veneer-images", SLUG)
    os.makedirs(out_dir, exist_ok=True)
    doc = pymupdf.open(pdf)

    written = 0
    small = []
    for page_no, sku in ITEMS:
        pix = doc[page_no - 1].get_pixmap(matrix=pymupdf.Matrix(SCALE, SCALE))
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        cropped = autocrop(im)
        if min(cropped.size) < 600:
            small.append(f"{sku} {cropped.size}")
        cropped.save(os.path.join(out_dir, sku + ".png"), optimize=True)
        written += 1

    print(f"written : {written} / {len(ITEMS)}  -> veneer-images/{SLUG}/")
    print(f"small (<600px on a side): {len(small)}")
    for s in small:
        print(f"   {s}")


if __name__ == "__main__":
    main()
