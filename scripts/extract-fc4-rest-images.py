"""
extract-fc4-rest-images.py

Extracts the remaining 92 FC4 swatch images from the Turakhia FC4 fan deck PDF
(Weathered, Roughcut, Volcano, Metallico, Burl, Faded, Thunder) into the layout that
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

Collection slugs mirror scripts/fc4-catalogue.json (the source of truth
for which species sits in which family).

Run:  python scripts/extract-fc4-rest-images.py "<path to FC4 pdf>"
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
    (118, "FC4-CRISPA", "weathered-deep"),
    (119, "FC4-NYSSA", "weathered-light"),
    (120, "FC4-KELLOGGI", "weathered-deep"),
    (121, "FC4-BUR-OAK", "weathered-oak"),
    (122, "FC4-CORALBEAN", "weathered-deep"),
    (123, "FC4-CORDIA-BURL", "weathered-burl"),
    (124, "FC4-COCOPLUM", "weathered-light"),
    (125, "FC4-BLACK-LOCUST", "weathered-light"),
    (126, "FC4-IRONBARK", "weathered-light"),
    (127, "FC4-TOMENTOSA", "weathered-light"),
    (128, "FC4-PIN-OAK", "weathered-oak"),
    (129, "FC4-VOILET-ARMANI", "weathered-armani"),
    (130, "FC4-CALABASH-BURL", "weathered-burl"),
    (131, "FC4-COCCINEA", "weathered-deep"),
    (132, "FC4-COWANIA", "weathered-light"),
    (133, "FC4-PLICATA", "weathered-light"),
    (134, "FC4-GINKO", "weathered-deep"),
    (135, "FC4-JAPONICA", "weathered-light"),
    (136, "FC4-BOLIVIER", "weathered-bolivier"),
    (137, "FC4-GREY-ARMANI", "weathered-armani"),
    (138, "FC4-SAND-BOLIVIER", "weathered-bolivier"),
    (141, "FC4-ROUGH-EBONY-OAK", "roughcut-oak"),
    (142, "FC4-ROUGH-TEATREE", "roughcut-deep"),
    (143, "FC4-ROUGH-BUR-OAK", "roughcut-oak"),
    (144, "FC4-ROUGH-COCOPLUM", "roughcut-deep"),
    (145, "FC4-ROUGH-YEWWOOD", "roughcut-deep"),
    (146, "FC4-ROUGH-COREAL", "roughcut-deep"),
    (147, "FC4-EXOTIC-ROUGH-BUGGED-OAK", "roughcut-oak"),
    (148, "FC4-ROUGH-AMERICAN-WALNUT", "roughcut-deep"),
    (149, "FC4-ROUGH-BUGGED-OAK", "roughcut-oak"),
    (150, "FC4-ROUGH-BURMESE-TEAK", "roughcut-deep"),
    (151, "FC4-ROUGH-KOSSIPO", "roughcut-deep"),
    (152, "FC4-ROUGH-SAPELI", "roughcut-deep"),
    (153, "FC4-ROUGH-WHITE-OAK", "roughcut-oak"),
    (154, "FC4-ROUGH-ASH", "roughcut-light"),
    (155, "FC4-ROUGH-OLIVE-BEECH", "roughcut-light"),
    (158, "FC4-VOLCANO-YEWWOOD", "volcano-diagonal"),
    (159, "FC4-VOLCANO-BUGGED-OAK", "volcano-diagonal"),
    (160, "FC4-VOLCANO-KOSSIPO", "volcano-diagonal"),
    (163, "FC4-BLACK-OAK", "metallico-black"),
    (164, "FC4-BLACKSTONE", "metallico-black"),
    (165, "FC4-BLACKNUT", "metallico-black"),
    (166, "FC4-BLACKTREE", "metallico-black"),
    (167, "FC4-FLAME-KOA", "metallico-flame"),
    (168, "FC4-COCOTREE", "metallico-choco"),
    (169, "FC4-CHOCONUT", "metallico-choco"),
    (170, "FC4-FLAME-LARCH", "metallico-flame"),
    (171, "FC4-LIMED-OAK", "metallico-limed-firoze"),
    (172, "FC4-CHOCO-EUCALYPTUS-FIGURED", "metallico-choco"),
    (173, "FC4-CHOCO-BIRDS-EYE-MAPLE", "metallico-choco"),
    (174, "FC4-CHOCO-ASH-BURL", "metallico-choco"),
    (175, "FC4-CHOCO-POPLAR-BURL", "metallico-choco"),
    (176, "FC4-TORCHED-CHARCOAL-OAK", "metallico-torched"),
    (177, "FC4-TORCHED-HAGBURRY", "metallico-torched"),
    (178, "FC4-TORCHED-EUCALYPTUS-FIGURED", "metallico-torched"),
    (179, "FC4-TORCHED-IRONWOOD", "metallico-torched"),
    (180, "FC4-TORCHED-TANNED-OAK", "metallico-torched"),
    (181, "FC4-TORCHED-YEWTREE", "metallico-torched"),
    (182, "FC4-TORCHED-FLAME-LARCH", "metallico-torched"),
    (183, "FC4-TORCHED-FLAMED-OAK", "metallico-torched"),
    (184, "FC4-TORCHED-TAMO-ASH", "metallico-torched"),
    (185, "FC4-TORCHED-POPLAR-BURL", "metallico-torched"),
    (186, "FC4-TORCHED-FLAMED-OAK-BURL", "metallico-torched"),
    (187, "FC4-EXOTIC-ROUGH-WHITE-OAK", "metallico-torched"),
    (188, "FC4-TORCHED-ELM", "metallico-torched"),
    (189, "FC4-TORCHED-MAPLE", "metallico-torched"),
    (190, "FC4-TORCHED-SYCAMORE", "metallico-torched"),
    (191, "FC4-TORCHED-ASH", "metallico-torched"),
    (192, "FC4-TORCHED-BIRCH", "metallico-torched"),
    (193, "FC4-TORCHED-BEECH", "metallico-torched"),
    (194, "FC4-TORCHED-RED-OAK", "metallico-torched"),
    (195, "FC4-TORCHED-SAPELI", "metallico-torched"),
    (196, "FC4-FIROZE-OAK", "metallico-limed-firoze"),
    (197, "FC4-FIROZE-MAPPA-BURL", "metallico-limed-firoze"),
    (200, "FC4-VAVONA-BURL", "burl-dark"),
    (201, "FC4-WALNUT-BURL", "burl-dark"),
    (202, "FC4-ELM-BURL", "burl-dark"),
    (203, "FC4-MAPLE-BURL", "burl-light"),
    (204, "FC4-OLIVE-ASH-BURL", "burl-light"),
    (205, "FC4-WHITE-OAK-BURL", "burl-light"),
    (206, "FC4-POPLAR-BURL", "burl-light"),
    (209, "FC4-FADED-ANTIC-OAK", "faded-natural"),
    (210, "FC4-FADED-BLUE-MOON", "faded-natural"),
    (211, "FC4-FADED-DYED-SYCAMORE", "faded-dyed"),
    (212, "FC4-FADED-DYED-ASH", "faded-dyed"),
    (213, "FC4-FADED-DYED-BEECH", "faded-dyed"),
    (214, "FC4-FADED-DYED-MAHOGANY", "faded-dyed"),
    (217, "FC4-GOLD-INLAY-COFFEETREE", "thunder-gold-inlay"),
    (218, "FC4-GOLD-INLAY-COFFEEBIN", "thunder-gold-inlay"),
    (219, "FC4-GOLD-INLAY-SASSAFRAS", "thunder-gold-inlay"),
    (220, "FC4-ACRYLICO-BLACKSTONE", "thunder-acrylico"),
    (221, "FC4-ACRYLICO-SASSAFRAS", "thunder-acrylico"),
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
        sys.exit("usage: python scripts/extract-fc4-rest-images.py <path to FC4 pdf>")

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
