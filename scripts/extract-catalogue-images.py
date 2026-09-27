"""
extract-catalogue-images.py

Generic swatch extractor for the Citiply/Turakhia brochures in the exported
Drive folders. Reads scripts/image-gaps.json (written by dump-image-gaps.ts),
matches each missing product to a page in its source PDF by the design code in
the page text, and writes veneer-images/<collection-slug>/<SKU>.png.

Matching: each collection declares how to turn a SKU/name into the code that
appears in the brochure. Codes are matched on word boundaries so "B1" never
matches inside "B16". Page text is squashed to remove the letter-spacing some
catalogues use ("F L U T E" -> "FLUTE").

Extraction: the swatch is taken as the largest JPEG on the page at native
resolution. If a page has no usable JPEG the page is rendered and auto-cropped
to its non-white bounding box instead.

Reports every unmatched product rather than guessing.

  python scripts/extract-catalogue-images.py                # all configured
  python scripts/extract-catalogue-images.py karnav barcode # some
"""

import io
import json
import os
import re
import sys

import pymupdf
from PIL import Image, ImageChops

ROOT = os.getcwd()
DRIVE = [
    r"C:\Users\aadit\Downloads\Veneer-20260923T172901Z-1-001\Veneer",
    r"C:\Users\aadit\Downloads\Veneer-20260923T172901Z-1-002\Veneer",
]

MIN_SIDE = 200


def find_pdf(name):
    for d in DRIVE:
        p = os.path.join(d, name)
        if os.path.exists(p):
            return p
    return None


def code_from_sku(prefix):
    """SKU -> the trailing code, e.g. BARCODE-B9 -> B9, FURROW-C10 -> C10."""
    def f(sku, name):
        return [sku[len(prefix):]] if sku.startswith(prefix) else []
    return f


def code_from_name_word(sku, name):
    """Last word of the product name, e.g. 'Karnav Antique' -> ANTIQUE."""
    w = name.strip().split()
    return [w[-1].upper()] if w else []


def code_reganto_prem(sku, name):
    # REGANTOPREM-305 -> 305 ; name 'Reganto Gris Chene 305'
    c = sku.replace("REGANTOPREM-", "")
    return [c]


def code_chroma_comp(sku, name):
    # CHROMACOMP-CC2-2901 -> both 'CC2' and '2901'
    m = re.match(r"CHROMACOMP-(CC\d+)-(\d+)", sku)
    return [m.group(1), m.group(2)] if m else []


def code_furrow_vivid(sku, name):
    # FURROWVIVID-C10-7098 -> 'C10' and '7098'
    m = re.match(r"FURROWVIVID-(C\d+)-(\w+)", sku)
    return [m.group(1), m.group(2)] if m else []


def code_prism(sku, name):
    # PRISM-ASH-7029 -> '7029'
    m = re.search(r"(\d{3,5}[A-Z]?)$", sku)
    return [m.group(1)] if m else []


# collection slug -> (pdf filename, code extractor, first content page)
CONFIG = {
    "karnav-designer-panels":      ("CITI- KARNAV Textured Veneers.pdf", code_from_name_word, 4),
    "barcode":                     ("Barcode Jan 2025.pdf",              code_from_sku("BARCODE-"), 15),
    "furrow-finest-hybrid-flutes": ("Furrow Jan 2025.pdf",               code_from_sku("FURROW-"), 10),
    "reganto-premier-collection":  ("Reganto Premier June 25.pdf",       code_reganto_prem, 4),
    "reganto-deziner-collection":  ("Reganto Dezigner May 25.pdf",       code_from_sku("REGANTO-"), 4),
    "chroma-composite":            ("Chroma Composite Apr 2025.pdf",     code_chroma_comp, 10),
    "legnoluxe":                   ("CITIPLY 2026 LegnöLuxé  Textured catalog  .pdf", code_from_name_word, 4),
    "furrow-vivid-dyed-flutes":    ("Furrow Vivid May 25.pdf",           code_furrow_vivid, 3),
    "prism-dyed-veneer-palette":   ("PRISM Jan 2025.pdf",                code_prism, 2),
    "dyed-veneers-turakhia":       ("CITIPLY DYED COLLECTION.pdf",       code_from_name_word, 2),
    "chroma-bunito":               ("Chroma Bunito May 25.pdf",          code_from_name_word, 3),
}

SQUASH = re.compile(r"(?<=\b\w) (?=\w\b)")


def page_texts(doc, start):
    out = {}
    for i in range(start - 1, doc.page_count):
        t = (doc[i].get_text() or "").strip()
        if not t:
            continue
        flat = t.upper().replace("\n", " ")
        # collapse letter-spaced headings: "F L U T E" -> "FLUTE"
        prev = None
        while prev != flat:
            prev = flat
            flat = SQUASH.sub("", flat)
        out[i + 1] = flat
    return out


def autocrop(im):
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im.convert("RGB"), bg).convert("L")
    mask = diff.point(lambda v: 255 if v > 9 else 0)
    box = mask.getbbox()
    return im.crop(box) if box else im


def swatch_from_page(doc, page_no):
    page = doc[page_no - 1]
    best = None
    for img in page.get_images(full=True):
        meta = doc.extract_image(img[0])
        if meta["ext"].lower() not in ("jpeg", "jpg"):
            continue
        if meta["width"] < MIN_SIDE or meta["height"] < MIN_SIDE:
            continue
        area = meta["width"] * meta["height"]
        if best is None or area > best[0]:
            best = (area, meta)
    if best:
        return Image.open(io.BytesIO(best[1]["image"])).convert("RGB")
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5))
    return autocrop(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    gaps = json.load(open(os.path.join(ROOT, "scripts", "image-gaps.json"), encoding="utf-8"))

    grand_hit = grand_miss = 0
    for slug, items in gaps.items():
        if slug not in CONFIG:
            continue
        if only and not any(o in slug for o in only):
            continue
        fname, coder, start = CONFIG[slug]
        pdf = find_pdf(fname)
        if not pdf:
            print(f"{slug.ljust(32)} PDF NOT FOUND: {fname}")
            continue

        doc = pymupdf.open(pdf)
        texts = page_texts(doc, start)
        out_dir = os.path.join(ROOT, "veneer-images", slug)
        os.makedirs(out_dir, exist_ok=True)

        hit = 0
        missed = []
        for it in items:
            codes = coder(it["sku"], it["name"])
            if not codes:
                missed.append(f"{it['sku']} (no code)")
                continue
            page = None
            for p in sorted(texts):
                txt = texts[p]
                if all(re.search(r"(?<![A-Z0-9])" + re.escape(c.upper()) + r"(?![A-Z0-9])", txt) for c in codes):
                    page = p
                    break
            if not page:
                missed.append(f"{it['sku']} [{'/'.join(codes)}]")
                continue
            swatch_from_page(doc, page).save(os.path.join(out_dir, it["sku"] + ".png"), optimize=True)
            hit += 1

        grand_hit += hit
        grand_miss += len(missed)
        print(f"{slug.ljust(32)} matched {str(hit).rjust(3)}/{str(len(items)).ljust(3)}  unmatched {len(missed)}")
        for m in missed[:6]:
            print(f"      {m}")
        if len(missed) > 6:
            print(f"      ... and {len(missed) - 6} more")

    print(f"\nTOTAL matched {grand_hit}, unmatched {grand_miss}")


if __name__ == "__main__":
    main()
