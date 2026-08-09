"""
extract-fc4-evergreen-images.py

Extracts the 52 Evergreen swatch images from the Turakhia FC4 fan deck PDF
(divider p20, swatches pp22-73) into the layout that
scripts/upload-veneer-images.ts expects:

    veneer-images/<collection-slug>/<SKU>.png

Each PDF page is a single flattened JPEG (600x1650, or 400x1100 on 7 pages)
containing the swatch above a white footer band with the logo, name and FC4
badge. This script:

  * pulls the EMBEDDED jpeg at native resolution (no re-rendering / no resample)
  * detects the first full-width near-white row below 85% height -- that is the
    top of the footer band -- and cuts 3px above it so no white sliver or
    anti-aliased transition row survives
  * normalises every output to 600x1500 (2:5) so the set is dimensionally
    uniform; the 7 pages that are natively 400x1100 are upscaled 1.5x (LANCZOS)
  * asserts the finished crop has no near-white edge row/column

Collection slugs mirror scripts/restructure-evergreen.ts (the source of truth
for which species sits in which family).

Run:  python scripts/extract-fc4-evergreen-images.py "<path to FC4 pdf>"
"""

import io
import os
import sys

import pymupdf
from PIL import Image

OUT_W, OUT_H = 600, 1500
# The swatch->footer boundary is a single anti-aliased row that measures roughly
# 0.75-0.95 near-white depending on the swatch. Detect at 0.5 so that row is
# always caught, then cut 6px above it so no partially-white row can survive.
FOOTER_THRESHOLD = 0.50
SAFETY_PX = 6

# (pdf page, SKU, collection-slug) -- mirrors restructure-evergreen.ts
ITEMS = [
    (36, "FC4-AMERICAN-WALNUT", "evergreen-walnut"),
    (37, "FC4-INDIAN-WALNUT", "evergreen-walnut"),
    (38, "FC4-EUROPEAN-WALNUT", "evergreen-walnut"),
    (50, "FC4-WHITE-OAK", "evergreen-oak"),
    (63, "FC4-RED-OAK", "evergreen-oak"),
    (45, "FC4-BURMESE-TEAK", "evergreen-teak"),
    (44, "FC4-SPALTED-TEAK", "evergreen-teak"),
    (23, "FC4-INDIAN-ROSEWOOD", "evergreen-rosewood"),
    (28, "FC4-SANTOS-ROSEWOOD", "evergreen-rosewood"),
    (51, "FC4-AMERICAN-MAPLE", "evergreen-maple"),
    (57, "FC4-BIRDS-EYE-MAPLE", "evergreen-maple"),
    (67, "FC4-EUROPEAN-CHERRY", "evergreen-cherry"),
    (69, "FC4-AFRICAN-CHERRY", "evergreen-cherry"),
    (61, "FC4-LEBANESE-CEDAR", "evergreen-cedar"),
    (70, "FC4-RED-CEDAR", "evergreen-cedar"),
    (25, "FC4-WENGE", "evergreen-wenge"),
    (46, "FC4-GOLDEN-WENGE", "evergreen-wenge"),
    (49, "FC4-ANIGRE", "evergreen-anigre"),
    (47, "FC4-ANIGRE-FIGURED", "evergreen-anigre"),
    (66, "FC4-SAPELI", "evergreen-sapeli"),
    (72, "FC4-SAPELI-POMELE", "evergreen-sapeli"),
    (48, "FC4-EUCALYPTUS-FIGURED", "evergreen-eucalyptus"),
    (73, "FC4-EUCALYPTUS-POMELE", "evergreen-eucalyptus"),

    (24, "FC4-MACASSAR-EBONY", "evergreen-dark-exotics"),
    (71, "FC4-PADAUK", "evergreen-dark-exotics"),
    (65, "FC4-KEVASINGO", "evergreen-dark-exotics"),
    (30, "FC4-ONTANO-ROSSO", "evergreen-dark-exotics"),
    (22, "FC4-BLACK-GUM", "evergreen-dark-exotics"),
    (31, "FC4-STONEWOOD", "evergreen-dark-exotics"),
    (34, "FC4-IPE", "evergreen-dark-exotics"),
    (27, "FC4-YEWTREE", "evergreen-dark-exotics"),
    (41, "FC4-BOCOTE", "evergreen-dark-exotics"),
    (32, "FC4-ZERICOATED", "evergreen-dark-exotics"),
    (26, "FC4-BARBASCO", "evergreen-dark-exotics"),
    (35, "FC4-SPILTED", "evergreen-dark-exotics"),
    (39, "FC4-LACEWOOD", "evergreen-dark-exotics"),

    (33, "FC4-SUCUPIRA", "evergreen-warm-mid-tones"),
    (52, "FC4-CHESTNUT", "evergreen-warm-mid-tones"),
    (62, "FC4-PLAINTREE", "evergreen-warm-mid-tones"),
    (64, "FC4-ROSEHEART", "evergreen-warm-mid-tones"),
    (40, "FC4-ZEBRANO", "evergreen-warm-mid-tones"),
    (59, "FC4-RIVERTREE", "evergreen-warm-mid-tones"),
    (68, "FC4-AFRICAN-MAHOGANY", "evergreen-warm-mid-tones"),
    (43, "FC4-RIVERWOOD", "evergreen-warm-mid-tones"),
    (42, "FC4-SASSNERO", "evergreen-warm-mid-tones"),

    (29, "FC4-ROSSO", "evergreen-light-blonde"),
    (58, "FC4-LARCH", "evergreen-light-blonde"),
    (60, "FC4-BEECH", "evergreen-light-blonde"),
    (54, "FC4-ASH", "evergreen-light-blonde"),
    (55, "FC4-HACKBERRY", "evergreen-light-blonde"),
    (53, "FC4-SYCAMORE", "evergreen-light-blonde"),
    (56, "FC4-POPLAR", "evergreen-light-blonde"),
]


def near_white_row(px, w, y, step=2):
    hits = total = 0
    for x in range(0, w, step):
        r, g, b = px[x, y]
        total += 1
        if r > 246 and g > 246 and b > 246:
            hits += 1
    return hits / total


def near_white_col(px, h, x, step=4):
    hits = total = 0
    for y in range(0, h, step):
        r, g, b = px[x, y]
        total += 1
        if r > 246 and g > 246 and b > 246:
            hits += 1
    return hits / total


def find_footer_top(im):
    """First full-width near-white row below 85% height = top of footer band."""
    w, h = im.size
    px = im.load()
    for y in range(int(h * 0.85), int(h * 0.96)):
        if near_white_row(px, w, y) > FOOTER_THRESHOLD:
            return y
    return None


def main():
    pdf = sys.argv[1] if len(sys.argv) > 1 else None
    if not pdf or not os.path.exists(pdf):
        sys.exit("usage: python scripts/extract-fc4-evergreen-images.py <path to FC4 pdf>")

    root = os.path.join(os.getcwd(), "veneer-images")
    doc = pymupdf.open(pdf)

    upscaled, problems, written = [], [], 0

    for page_no, sku, slug in ITEMS:
        page = doc[page_no - 1]
        images = page.get_images(full=True)
        if len(images) != 1:
            problems.append(f"{sku}: expected 1 embedded image, found {len(images)}")
            continue

        raw = doc.extract_image(images[0][0])["image"]
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        w, h = im.size

        cut = find_footer_top(im)
        if cut is None:
            problems.append(f"{sku}: could not locate footer band")
            continue

        swatch = im.crop((0, 0, w, cut - SAFETY_PX))
        if (w, h) != (600, 1650):
            upscaled.append(f"{sku} ({w}x{h})")

        out = swatch.resize((OUT_W, OUT_H), Image.LANCZOS)

        # no near-white edge may survive the crop
        px = out.load()
        checks = {
            "top": near_white_row(px, OUT_W, 0),
            "bottom": near_white_row(px, OUT_W, OUT_H - 1),
            "left": near_white_col(px, OUT_H, 0),
            "right": near_white_col(px, OUT_H, OUT_W - 1),
        }
        bad = {k: round(v, 3) for k, v in checks.items() if v > 0.01}
        if bad:
            problems.append(f"{sku}: white edge {bad}")

        folder = os.path.join(root, slug)
        os.makedirs(folder, exist_ok=True)
        out.save(os.path.join(folder, sku + ".png"), optimize=True)
        written += 1

    print(f"written        : {written} / {len(ITEMS)}  -> {OUT_W}x{OUT_H} png")
    print(f"upscaled 1.5x  : {len(upscaled)}")
    for u in upscaled:
        print(f"                 {u}")
    print(f"white-edge / other problems: {len(problems)}")
    for p in problems:
        print(f"   {p}")


if __name__ == "__main__":
    main()
