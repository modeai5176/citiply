"""
extract-citiveneers-images.py

Extracts swatch images from "CITIVENEERS 2025 2.pdf" for every product mapped by
scripts/match-citiveneers.ts, writing them to
veneer-images/<collection-slug>/<SKU>.png for upload-veneer-images.ts.

Page layout: each species page carries three embedded images — the swatch as a
JPEG occupying the left ~2/3, plus an info sidebar and a logo, both PNG. So the
swatch is taken as the largest JPEG on the page, at native resolution (no
re-render, no resample).

Run: python scripts/extract-citiveneers-images.py "<path to citiveneers.pdf>"
"""

import io
import json
import os
import sys

import pymupdf
from PIL import Image

MIN_SIDE = 200          # anything smaller is a logo/icon, not a swatch


def near_white_edge(im, side):
    """Fraction of near-white pixels along one edge."""
    px = im.load()
    w, h = im.size
    hits = total = 0
    if side in ("top", "bottom"):
        y = 0 if side == "top" else h - 1
        rng = range(0, w, max(1, w // 200))
        for x in rng:
            r, g, b = px[x, y][:3]
            total += 1
            if r > 246 and g > 246 and b > 246:
                hits += 1
    else:
        x = 0 if side == "left" else w - 1
        rng = range(0, h, max(1, h // 200))
        for y in rng:
            r, g, b = px[x, y][:3]
            total += 1
            if r > 246 and g > 246 and b > 246:
                hits += 1
    return hits / max(total, 1)


def main():
    pdf = sys.argv[1] if len(sys.argv) > 1 else None
    if not pdf or not os.path.exists(pdf):
        sys.exit("usage: python scripts/extract-citiveneers-images.py <path to pdf>")

    root = os.getcwd()
    mapping = json.load(open(os.path.join(root, "scripts", "citiveneers-pages.json"), encoding="utf-8"))
    doc = pymupdf.open(pdf)

    written = 0
    problems = []
    per_slug = {}

    for sku, info in mapping.items():
        page = doc[info["page"] - 1]
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

        if best is None:
            problems.append(f"{sku}: no JPEG swatch on page {info['page']}")
            continue

        im = Image.open(io.BytesIO(best[1]["image"])).convert("RGB")
        edges = {s: round(near_white_edge(im, s), 3) for s in ("top", "bottom", "left", "right")}
        bad = {k: v for k, v in edges.items() if v > 0.25}
        if bad:
            problems.append(f"{sku}: white edge {bad} (p{info['page']}, {im.size[0]}x{im.size[1]})")

        folder = os.path.join(root, "veneer-images", info["slug"])
        os.makedirs(folder, exist_ok=True)
        im.save(os.path.join(folder, sku + ".png"), optimize=True)
        written += 1
        per_slug[info["slug"]] = per_slug.get(info["slug"], 0) + 1

    print(f"written : {written} / {len(mapping)}")
    for slug, n in sorted(per_slug.items()):
        print(f"   {slug.ljust(30)} {n}")
    print(f"problems: {len(problems)}")
    for p in problems[:25]:
        print(f"   {p}")


if __name__ == "__main__":
    main()
