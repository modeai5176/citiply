/**
 * search-truncation-check.ts — READ ONLY.
 *
 * /search filters an in-memory list from getProducts() with no .limit(), so it
 * inherits PostgREST's default max-rows cap. This checks whether that cap is
 * silently truncating the catalogue, and where the cut-off lands alphabetically.
 *
 * Run: dotenv -e .env -- npx tsx scripts/search-truncation-check.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

async function main() {
  const { count: activeCount } = await db.from("products")
    .select("id", { count: "exact", head: true }).eq("is_active", true);
  console.log(`active products in DB:            ${activeCount}`);

  // exactly what getProducts() does: no limit, ordered by name asc
  const { data: asFetched } = await db.from("products")
    .select("sku, name").eq("is_active", true).order("name", { ascending: true });
  console.log(`rows actually returned unlimited:  ${asFetched?.length}`);

  const truncated = (activeCount ?? 0) - (asFetched?.length ?? 0);
  console.log(`SILENTLY DROPPED:                  ${truncated}\n`);

  if (asFetched?.length) {
    console.log(`last row search can see:  "${asFetched[asFetched.length - 1].name}"`);
    console.log(`  → anything sorting after that is invisible to /search\n`);
  }

  for (const sku of ["FC4-SANTOS-ROSEWOOD", "FC4-STONEWOOD", "FC4-SUCUPIRA",
                     "FC4-WHITE-OAK", "FC4-WENGE", "FC4-ASH", "FC4-TEAK"]) {
    const idx = (asFetched ?? []).findIndex((p) => p.sku === sku);
    const { data: exists } = await db.from("products")
      .select("sku, name, is_active").eq("sku", sku).maybeSingle();
    if (!exists) { console.log(`  ${sku.padEnd(22)} does not exist`); continue; }
    console.log(`  ${sku.padEnd(22)} active=${exists.is_active}  visibleToSearch=${idx >= 0}`);
  }

  // second issue: products whose collection is inactive are still served
  const { data: deadCols } = await db.from("collections")
    .select("id, slug").eq("is_active", false);
  const ids = (deadCols ?? []).map((c) => c.id);
  if (ids.length) {
    const { count } = await db.from("products")
      .select("id", { count: "exact", head: true })
      .in("collection_id", ids).eq("is_active", true);
    console.log(`\nactive products sitting in DEACTIVATED collections: ${count}`);
    console.log(`  (${(deadCols ?? []).map((c) => c.slug).join(", ")})`);
    console.log(`  these still show up in /search because getProducts() only`);
    console.log(`  filters products.is_active, never collections.is_active`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
