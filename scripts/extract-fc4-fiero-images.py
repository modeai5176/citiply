"""
extract-fc4-fiero-images.py

Extracts the 52 Fiero swatch images from the Turakhia FC4 fan deck PDF
(divider p74, swatches pp76-115) into the layout that
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

Collection slugs mirror scripts/restructure-fiero.ts (the source of truth
for which species sits in which family).

Run:  python scripts/extract-fc4-fiero-images.py "<path to FC4 pdf>"
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
    (76, "FC4-EXOTIC-EBONY-OAK", "fiero-oak"),
    (103, "FC4-BUGGED-OAK", "fiero-oak"),
    (102, "FC4-EXOTIC-BUGGED-OAK", "fiero-oak"),
    (113, "FC4-TAN-OAK", "fiero-oak"),
    (77, "FC4-PATTERNWOOD-FIGURED", "fiero-patternwood"),
    (80, "FC4-PATTERNWOOD-POMELE", "fiero-patternwood"),
    (110, "FC4-GOLDEN-PATTERNWOOD", "fiero-patternwood"),
    (90, "FC4-KOSSIPO", "fiero-kossipo"),
    (91, "FC4-KOSSIPO-POMELE", "fiero-kossipo"),
    (111, "FC4-BOG-ELM", "fiero-bog"),
    (112, "FC4-BOG-ASH", "fiero-bog"),
    (106, "FC4-ROBUSTA", "fiero-robusta"),
    (99, "FC4-THERMO-ROBUSTA", "fiero-robusta"),
    (104, "FC4-MEXICAN-LAUREL", "fiero-laurel"),
    (108, "FC4-BROWN-LAUREL", "fiero-laurel"),
    (79, "FC4-THINWIN", "fiero-deep-smoked"),
    (78, "FC4-SASSAFRAS", "fiero-deep-smoked"),
    (100, "FC4-BOLIVIAN", "fiero-deep-smoked"),
    (101, "FC4-LAURA-PETRO", "fiero-deep-smoked"),
    (95, "FC4-BARWOOD", "fiero-deep-smoked"),
    (83, "FC4-SADDLE-TREE", "fiero-deep-smoked"),
    (88, "FC4-JAMIRE", "fiero-deep-smoked"),
    (97, "FC4-COFFEEBIN", "fiero-deep-smoked"),
    (89, "FC4-COCOBOLO", "fiero-deep-smoked"),
    (115, "FC4-COTTONWOOD", "fiero-deep-smoked"),
    (93, "FC4-SASSWOOD", "fiero-deep-smoked"),
    (107, "FC4-BLACKWOOD", "fiero-deep-smoked"),
    (81, "FC4-KOA", "fiero-deep-smoked"),
    (109, "FC4-IZOMBE", "fiero-mid-smoked"),
    (86, "FC4-YEWWOOD", "fiero-mid-smoked"),
    (94, "FC4-PEARWOOD", "fiero-mid-smoked"),
    (82, "FC4-TEATREE", "fiero-mid-smoked"),
    (85, "FC4-RAINWOOD", "fiero-mid-smoked"),
    (96, "FC4-SAPGUM", "fiero-mid-smoked"),
    (84, "FC4-RAINTREE", "fiero-mid-smoked"),
    (98, "FC4-ZITRONE", "fiero-mid-smoked"),
    (87, "FC4-BLACK-ALDER", "fiero-amber-light"),
    (105, "FC4-IRONWOOD", "fiero-amber-light"),
    (92, "FC4-ARC", "fiero-amber-light"),
    (114, "FC4-WINEWOOD", "fiero-amber-light"),
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
        sys.exit("usage: python scripts/extract-fc4-fiero-images.py <path to FC4 pdf>")

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
