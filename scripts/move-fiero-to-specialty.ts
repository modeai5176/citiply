/**
 * move-fiero-to-specialty.ts
 *
 * Re-files the 9 FC4 Fiero family collections (and their 40 products) from
 * Exotic to "Smoked / Fumed / Specialty".
 *
 * Why: the FC4 divider calls Fiero "premium smoked veneer species ... put
 * through hi-end fuming process", and the parallel `citiply-fiero` collection
 * already sits in specialty-series. Exotic was inherited from the old partial
 * `fiero` (FIER-*) collection's filing, which looks like a mis-file.
 *
 * Both collections.category_id and products.category_id are updated, because
 * products carry their own category_id and the category page reads it.
 *
 * Idempotent. Nothing is deleted or deactivated by this script.
 *
 * Dry run (default):  dotenv -e .env -- npx tsx scripts/move-fiero-to-specialty.ts
 * Apply:              dotenv -e .env -- npx tsx scripts/move-fiero-to-specialty.ts --apply
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const APPLY = process.argv.includes("--apply");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

const TARGET_CATEGORY = "specialty-series";
const SLUGS = [
  "fiero-oak", "fiero-patternwood", "fiero-kossipo", "fiero-bog", "fiero-robusta",
  "fiero-laurel", "fiero-deep-smoked", "fiero-mid-smoked", "fiero-amber-light"
];

async function main() {
  const mode = APPLY ? "APPLY" : "DRY RUN";
  console.log(`=== move-fiero-to-specialty (${mode}) ===\n`);

  const { data: target } = await db.from("categories")
    .select("id, name, slug, is_active").eq("slug", TARGET_CATEGORY).maybeSingle();
  if (!target) throw new Error(`category '${TARGET_CATEGORY}' not found`);
  console.log(`target category: ${target.name} (${target.slug}) active=${target.is_active}\n`);

  let movedCollections = 0;
  let movedProducts = 0;

  for (const slug of SLUGS) {
    const { data: col } = await db.from("collections")
      .select("id, name, category_id").eq("slug", slug).maybeSingle();
    if (!col) {
      console.log(`  ${slug.padEnd(22)} NOT FOUND, skipping`);
      continue;
    }

    const { data: prods } = await db.from("products")
      .select("id, sku, category_id").eq("collection_id", col.id);
    const stale = (prods ?? []).filter((p) => p.category_id !== target.id);

    if (col.category_id === target.id && stale.length === 0) {
      console.log(`  ${slug.padEnd(22)} already in ${TARGET_CATEGORY} (${prods?.length} products)`);
      continue;
    }

    if (APPLY) {
      if (col.category_id !== target.id) {
        const { error } = await db.from("collections").update({ category_id: target.id }).eq("id", col.id);
        if (error) throw error;
        movedCollections++;
      }
      for (const p of stale) {
        const { error } = await db.from("products").update({ category_id: target.id }).eq("id", p.id);
        if (error) throw error;
        movedProducts++;
      }
      console.log(`  ${slug.padEnd(22)} MOVED  collection + ${stale.length} products`);
    } else {
      console.log(`  ${slug.padEnd(22)} would move  collection + ${stale.length} products`);
      movedCollections += col.category_id !== target.id ? 1 : 0;
      movedProducts += stale.length;
    }
  }

  console.log(`\ncollections: ${movedCollections}   products: ${movedProducts}`);
  console.log(`\n=== ${mode} complete ===`);
  if (!APPLY) console.log("re-run with --apply to write.");
}

main().catch((e) => { console.error(e); process.exit(1); });
