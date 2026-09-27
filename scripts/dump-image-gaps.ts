/**
 * dump-image-gaps.ts — READ ONLY.
 * Writes scripts/image-gaps.json: every active veneer product with no
 * product_images row, grouped by collection, for the extractors to consume.
 *
 * Run: dotenv -e .env -- npx tsx scripts/dump-image-gaps.ts
 */
import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

async function main() {
  const { data: cat } = await db.from("catalogues").select("id").eq("slug", "veneers").maybeSingle();
  const { data: cats } = await db.from("categories")
    .select("id, slug").eq("catalogue_id", cat!.id).eq("is_active", true);
  const { data: cols } = await db.from("collections")
    .select("id, slug, category_id").in("category_id", (cats ?? []).map((c) => c.id)).eq("is_active", true);

  const out: Record<string, { sku: string; name: string }[]> = {};
  let total = 0;
  for (const col of cols ?? []) {
    const { data: ps } = await db.from("products")
      .select("sku, name, product_images(id)").eq("collection_id", col.id).eq("is_active", true).order("sku");
    const miss = (ps ?? []).filter((p) => (p.product_images ?? []).length === 0)
      .map((p) => ({ sku: p.sku, name: p.name }));
    if (miss.length) { out[col.slug] = miss; total += miss.length; }
  }
  writeFileSync(join(process.cwd(), "scripts", "image-gaps.json"), JSON.stringify(out, null, 1));
  console.log(`collections with gaps: ${Object.keys(out).length}   products: ${total}`);
  for (const [s, v] of Object.entries(out).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`   ${s.padEnd(32)} ${v.length}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
