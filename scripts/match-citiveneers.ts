/**
 * match-citiveneers.ts — READ ONLY.
 *
 * "CITIVENEERS 2025 2.pdf" is the Citiply master catalogue: one species per
 * page, with the product name as the first line of the page text. This matches
 * every image-less citiply-* product in the DB to its page number and writes
 * scripts/citiveneers-pages.json for the extractor to consume.
 *
 * Run: dotenv -e .env -- npx tsx scripts/match-citiveneers.ts <path to citiveneers.pdf>
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const PDF = process.argv[2];
if (!PDF) throw new Error("usage: match-citiveneers.ts <path to pdf>");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

/** Panello/PRO are layup variants of the same page's species, so drop them. */
const norm = (s: string) =>
  s.replace(/\s*\(FC4\)\s*$/i, "")
   .replace(/\s+Panello\b/gi, "")
   .replace(/\s+PRO\b/gi, "")
   .replace(/\s+\(\d+ft\)\s*$/i, "")
   .toLowerCase()
   .replace(/mm/g, "m")
   .replace(/[^a-z0-9]/g, "");

function pageTitles(): Map<number, string> {
  const py = `
import pymupdf, json, sys
d = pymupdf.open(sys.argv[1])
out = {}
for i in range(d.page_count):
    t = (d[i].get_text() or "").strip()
    if not t:
        continue
    lines = [l.strip() for l in t.split("\\n") if l.strip()]
    if not lines:
        continue
    title = lines[0]
    # names wrap onto a second line before DENSITY
    if len(lines) > 1 and lines[1].upper() not in ("DENSITY",) and len(lines[1]) < 22 and "(" not in lines[1]:
        if lines[1].upper() != "PANELLO":
            pass
        title = title + " " + lines[1]
    out[i + 1] = title.strip()
print(json.dumps(out))
`;
  const raw = execFileSync("python", ["-c", py, PDF], { maxBuffer: 64 * 1024 * 1024 }).toString();
  const obj = JSON.parse(raw) as Record<string, string>;
  return new Map(Object.entries(obj).map(([p, t]) => [Number(p), t]));
}

async function main() {
  const titles = pageTitles();
  console.log(`pages with a title: ${titles.size}`);

  // index by normalised title; first page wins
  const byTitle = new Map<string, number>();
  for (const [page, title] of Array.from(titles.entries()).sort((a, b) => a[0] - b[0])) {
    const k = norm(title);
    if (k && !byTitle.has(k)) byTitle.set(k, page);
  }

  const { data: cat } = await db.from("catalogues").select("id").eq("slug", "veneers").maybeSingle();
  const { data: cats } = await db.from("categories").select("id, slug").eq("catalogue_id", cat!.id).eq("is_active", true);
  const catSlug = new Map((cats ?? []).map((c) => [c.id, c.slug]));
  const { data: cols } = await db.from("collections")
    .select("id, slug, category_id").in("category_id", (cats ?? []).map((c) => c.id)).eq("is_active", true);

  const mapping: Record<string, { page: number; slug: string }> = {};
  const unmatched: string[] = [];
  const perCol: Record<string, { hit: number; miss: number; cat: string }> = {};

  for (const col of cols ?? []) {
    const { data: prods } = await db.from("products")
      .select("sku, name, product_images(id)").eq("collection_id", col.id).eq("is_active", true);
    for (const p of prods ?? []) {
      if ((p.product_images ?? []).length) continue;           // already has one
      const cs = catSlug.get(col.category_id)!;
      perCol[col.slug] ??= { hit: 0, miss: 0, cat: cs };
      const page = byTitle.get(norm(p.name));
      if (page) {
        mapping[p.sku] = { page, slug: col.slug };
        perCol[col.slug].hit++;
      } else {
        perCol[col.slug].miss++;
        unmatched.push(`${col.slug.padEnd(28)} ${p.sku.padEnd(40)} ${p.name}`);
      }
    }
  }

  console.log("\ncollection                     category             matched  unmatched");
  let H = 0, M = 0;
  for (const [slug, v] of Object.entries(perCol).sort()) {
    if (!v.hit && !v.miss) continue;
    H += v.hit; M += v.miss;
    console.log(`${slug.padEnd(30)} ${v.cat.padEnd(20)} ${String(v.hit).padStart(7)} ${String(v.miss).padStart(10)}`);
  }
  console.log(`${"TOTAL".padEnd(30)} ${"".padEnd(20)} ${String(H).padStart(7)} ${String(M).padStart(10)}`);

  writeFileSync(join(process.cwd(), "scripts", "citiveneers-pages.json"),
                JSON.stringify(mapping, null, 1));
  console.log(`\nwrote scripts/citiveneers-pages.json with ${Object.keys(mapping).length} entries`);

  if (unmatched.length) {
    console.log(`\nunmatched (${unmatched.length}), first 40:`);
    for (const u of unmatched.slice(0, 40)) console.log("   " + u);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
