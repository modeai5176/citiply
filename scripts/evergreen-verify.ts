/**
 * evergreen-verify.ts — READ ONLY post-migration check.
 * Run: dotenv -e .env -- npx tsx scripts/evergreen-verify.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

async function countIn(slug: string) {
  const { data: col } = await db.from("collections")
    .select("id, is_active, category_id").eq("slug", slug).maybeSingle();
  if (!col) return `${slug}: NOT FOUND`;
  const { count } = await db.from("products")
    .select("id", { count: "exact", head: true }).eq("collection_id", col.id);
  const { data: cat } = await db.from("categories").select("slug").eq("id", col.category_id).maybeSingle();
  return `${slug.padEnd(26)} active=${String(col.is_active).padEnd(5)} category=${(cat?.slug ?? "?").padEnd(18)} products=${count}`;
}

async function main() {
  console.log("=== collection state ===");
  for (const s of ["turakhia-fc4-fan-deck", "founders-collection-4", "evergreen-series",
                   "evergreen-walnut", "evergreen-dark-exotics", "evergreen-light-blonde"]) {
    console.log("  " + (await countIn(s)));
  }

  const { data: evCat } = await db.from("categories").select("id").eq("slug", "evergreen").maybeSingle();
  const { data: cols } = await db.from("collections").select("id, slug").eq("category_id", evCat!.id);
  let total = 0;
  for (const c of cols ?? []) {
    const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("collection_id", c.id);
    total += count ?? 0;
  }
  console.log(`\n=== evergreen category: ${cols?.length} collections, ${total} products ===`);

  // are any Evergreen-series products still pointing at the fan deck?
  const { data: fc4 } = await db.from("collections").select("id").eq("slug", "turakhia-fc4-fan-deck").maybeSingle();
  const { data: stray } = await db.from("products")
    .select("sku").eq("collection_id", fc4!.id).eq("short_description", "Evergreen series");
  console.log(`\nEvergreen-series products still in fan deck: ${stray?.length ?? 0}`);

  // is_active of the moved products
  const { data: inactive } = await db.from("products")
    .select("sku, is_active").like("sku", "FC4-%").eq("is_active", false);
  console.log(`FC4-* products with is_active=false: ${inactive?.length ?? 0}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
