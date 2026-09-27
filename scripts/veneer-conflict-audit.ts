/**
 * veneer-conflict-audit.ts — READ ONLY.
 *
 * Checks whether the FC4 Fiero 40 now sitting in Exotic conflict with anything
 * else in the veneers catalogue:
 *   1. species names that appear in more than one ACTIVE collection
 *   2. which categories those duplicates straddle
 *   3. collection display-name collisions across categories
 *   4. where the parallel citiply-* series live, for comparison
 *
 * Run: dotenv -e .env -- npx tsx scripts/veneer-conflict-audit.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

const FIERO_40 = ["Exotic Ebony Oak","Patternwood Figured","Sassafras","Thinwin","Patternwood Pommele",
"Koa","Teatree","Saddle Tree","Raintree","Rainwood","Yewwood","Black Alder","Jamire","Cocobolo",
"Kossipo","Kossipo Pomele","Arc","Sasswood","Pearwood","Barwood","Sapgum","Coffeebin","Zitrone",
"Thermo Robusta","Bolivian","Laura Petro","Exotic Bugged Oak","Bugged Oak","Mexican Laurel",
"Ironwood","Robusta","Blackwood","Brown Laurel","Izombe","Golden Patternwood","Bog Elm","Bog Ash",
"Tan Oak","Winewood","Cottonwood"];

/** strip suffixes/prefixes that mark a treatment rather than a different species */
const base = (s: string) =>
  s.replace(/\s*\(FC4\)\s*$/i, "")
   .replace(/\s+Panello$/i, "")
   .replace(/\s+PRO$/i, "")
   .toLowerCase()
   .replace(/mm/g, "m")
   .replace(/[^a-z]/g, "");

async function main() {
  const { data: cat } = await db.from("catalogues").select("id").eq("slug", "veneers").maybeSingle();
  const { data: cats } = await db.from("categories").select("id, name, slug, is_active").eq("catalogue_id", cat!.id);
  const catById = new Map((cats ?? []).map((c) => [c.id, c]));

  const { data: cols } = await db.from("collections")
    .select("id, name, slug, is_active, category_id").in("category_id", (cats ?? []).map((c) => c.id));
  const colById = new Map((cols ?? []).map((c) => [c.id, c]));

  // NOTE: collections.is_active comes back from PostgREST as the STRING
  // "true"/"false" (the live column drifted from the boolean in schema.sql), and
  // "false" is truthy in JS. So never filter it in JS — ask the database.
  const { data: activeRows } = await db.from("collections")
    .select("id").in("category_id", (cats ?? []).filter((c) => c.is_active).map((c) => c.id))
    .eq("is_active", true);
  const activeIds = new Set((activeRows ?? []).map((r) => r.id));
  const activeCols = (cols ?? []).filter((c) => activeIds.has(c.id));

  const { data: prods } = await db.from("products")
    .select("sku, name, collection_id, is_active").in("collection_id", activeCols.map((c) => c.id));

  // --- 1 & 2: species names appearing in more than one active collection ---
  const byBase = new Map<string, { sku: string; name: string; col: string; cat: string }[]>();
  for (const p of (prods ?? []).filter((x) => x.is_active)) {
    const col = colById.get(p.collection_id)!;
    const c = catById.get(col.category_id)!;
    const k = base(p.name);
    const row = { sku: p.sku, name: p.name.replace(/\s*\(FC4\)$/, ""), col: col.slug, cat: c.slug };
    const arr = byBase.get(k);
    if (arr) arr.push(row); else byBase.set(k, [row]);
  }

  const fieroKeys = new Set(FIERO_40.map(base));
  const fieroDupes = Array.from(byBase.entries()).filter(([k, v]) => fieroKeys.has(k) && v.length > 1);

  console.log("=== 1. FC4 Fiero species that ALSO exist elsewhere (active only) ===\n");
  if (!fieroDupes.length) console.log("  none\n");
  for (const [, rows] of fieroDupes.sort((a, b) => a[1][0].name.localeCompare(b[1][0].name))) {
    console.log(`  ${rows[0].name}`);
    for (const r of rows) console.log(`      ${r.sku.padEnd(34)} ${r.col.padEnd(28)} [${r.cat}]`);
  }

  const allDupes = Array.from(byBase.entries()).filter(([, v]) => v.length > 1);
  const crossCat = allDupes.filter(([, v]) => new Set(v.map((r: { cat: string }) => r.cat)).size > 1);
  console.log(`\n  duplicate species names overall (active): ${allDupes.length}`);
  console.log(`  of those, spanning 2+ categories        : ${crossCat.length}`);

  // --- 3: collection display-name collisions across categories ---
  console.log("\n=== 2. collection display names used in more than one category ===\n");
  const byName = new Map<string, { slug: string; cat: string }[]>();
  for (const c of activeCols) {
    const k = c.name.toLowerCase();
    const row = { slug: c.slug, cat: catById.get(c.category_id)!.slug };
    const arr = byName.get(k);
    if (arr) arr.push(row); else byName.set(k, [row]);
  }
  const nameClashes = Array.from(byName.entries()).filter(([, v]) => new Set(v.map((r: { cat: string }) => r.cat)).size > 1);
  if (!nameClashes.length) console.log("  none");
  for (const [n, v] of nameClashes) {
    console.log(`  "${n}"  ->  ${v.map((r: { slug: string; cat: string }) => `${r.slug} [${r.cat}]`).join("   ")}`);
  }

  // --- 4: where do the parallel citiply-* series live? ---
  console.log("\n=== 3. where each Fiero-ish / series collection sits ===\n");
  for (const c of (cols ?? []).filter((c) => /fiero|metallico|weathered|rough|volcano|burl|faded|thunder|torched|smoked/i.test(c.slug))) {
    const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("collection_id", c.id);
    const cc = catById.get(c.category_id)!;
    console.log(`  ${c.slug.padEnd(28)} colActive=${String(c.is_active).padEnd(5)} n=${String(count).padEnd(4)} category=${cc.slug} (active=${cc.is_active})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
