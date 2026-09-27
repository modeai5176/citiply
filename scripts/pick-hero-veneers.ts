// Picks the veneer photos shown on the homepage hero globe and writes them to
// lib/hero-veneers.json. Re-run after adding products:
//   npx dotenv -e .env -- npx tsx scripts/pick-hero-veneers.ts
//
// Many product "main" images are crops of catalogue pages with white margins,
// labels or swatch strips — they look broken on the globe. Each thumbnail is
// scored with sharp and only clean, full-bleed veneer photos are kept.
import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import sharp from "sharp";
import ws from "ws";
import { writeFileSync } from "node:fs";
import path from "node:path";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

// Warm naturals and exotics lead; bright dyed veneers stay an accent so the globe stays on-palette.
const QUOTAS: Record<string, number> = {
  Exotic: 40,
  Natural: 27,
  "Smoked / Fumed / Specialty": 45,
  Evergreen: 35,
  Textured: 30,
  Fluted: 15,
  "Dyed / Coloured": 12
};

type Candidate = { src: string; alt: string; category: string; position?: "bottom" };

/** Mean brightness (0-255) and saturation of the outer 8% frame, plus whole-image saturation. */
async function score(url: string) {
  const buffer = Buffer.from(await (await fetch(url)).arrayBuffer());
  const meta = await sharp(buffer).metadata();
  const aspect = (meta.height ?? 1) / (meta.width ?? 1);
  const size = 64;
  const { data } = await sharp(buffer).resize(size, size, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const band = Math.round(size * 0.08);
  let edgeBright = 0, edgeCount = 0, whiteEdge = 0, satSum = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      satSum += max === 0 ? 0 : (max - min) / max;
      if (x < band || y < band || x >= size - band || y >= size - band) {
        edgeBright += (r + g + b) / 3;
        edgeCount++;
        if (min > 225) whiteEdge++;
      }
    }
  }
  return { edge: edgeBright / edgeCount, whiteEdgeRatio: whiteEdge / edgeCount, saturation: satSum / (size * size), aspect };
}

async function main() {
  const { data, error } = await db
    .from("product_images")
    .select("thumbnail_url, products!inner(name, is_active, categories!inner(name, catalogues!inner(slug)))")
    .eq("kind", "main")
    .eq("products.is_active", true)
    .eq("products.categories.catalogues.slug", "veneers")
    .like("thumbnail_url", "%amazonaws.com%")
    .limit(3000);
  if (error) throw error;

  type Row = { thumbnail_url: string; products: { name: string; categories: { name: string } } };
  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const row of (data ?? []) as unknown as Row[]) {
    if (seen.has(row.thumbnail_url) || !(row.products.categories.name in QUOTAS)) continue;
    seen.add(row.thumbnail_url);
    candidates.push({ src: row.thumbnail_url, alt: `${row.products.name} veneer`, category: row.products.categories.name });
  }
  console.log(`scoring ${candidates.length} thumbnails...`);

  const clean: Candidate[] = [];
  let rejected = 0;
  for (let i = 0; i < candidates.length; i += 16) {
    const batch = candidates.slice(i, i + 16);
    const scores = await Promise.all(batch.map((c) => score(c.src).catch(() => null)));
    batch.forEach((candidate, index) => {
      const s = scores[index];
      // Reject white page margins/labels and near-grey scans with no wood character.
      if (!s || s.whiteEdgeRatio > 0.04 || s.edge > 215 || s.saturation < 0.05) rejected++;
      // Tall (1:2) thumbnails are two-panel catalogue composites: a raw-veneer strip on top and
      // the finished sheet below. Anchor the square crop to the bottom so only the finish shows.
      else clean.push(s.aspect > 1.6 ? { ...candidate, position: "bottom" } : candidate);
    });
  }

  const picked: { src: string; alt: string; position?: "bottom" }[] = [];
  for (const [category, quota] of Object.entries(QUOTAS)) {
    const list = clean.filter((c) => c.category === category).sort((a, b) => a.src.localeCompare(b.src));
    // Evenly spaced picks across each category, so no single collection dominates.
    const step = Math.max(1, list.length / quota);
    for (let i = 0; i < Math.min(quota, list.length); i++) {
      const { src, alt, position } = list[Math.floor(i * step)];
      picked.push(position ? { src, alt, position } : { src, alt });
    }
    console.log(`${category}: ${Math.min(quota, list.length)} of ${list.length} clean`);
  }

  const out = path.join(process.cwd(), "lib", "hero-veneers.json");
  writeFileSync(out, JSON.stringify(picked, null, 2) + "\n");
  console.log(`rejected ${rejected}; wrote ${picked.length} images to lib/hero-veneers.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
