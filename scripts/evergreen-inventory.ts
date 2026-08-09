/**
 * evergreen-inventory.ts — READ ONLY.
 *
 * Reports the current state of everything the Evergreen restructure would
 * touch, so the migration can be reviewed before anything is written.
 *
 * Run: dotenv -e .env -- npx tsx scripts/evergreen-inventory.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

const db = createClient(url, key, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

async function main() {
  const { data: cats } = await db
    .from("categories")
    .select("id, name, slug, is_active, catalogue_id, catalogues(slug)")
    .order("sort_order");

  const veneerCats = (cats ?? []).filter((c: any) => c.catalogues?.slug === "veneers");
  console.log("=== veneer categories ===");
  for (const c of veneerCats) {
    const { count } = await db
      .from("collections")
      .select("id", { count: "exact", head: true })
      .eq("category_id", c.id);
    console.log(`  ${c.slug.padEnd(22)} ${c.name.padEnd(30)} active=${c.is_active} collections=${count}`);
  }

  console.log("\n=== collections in natural-veneers ===");
  const nat = veneerCats.find((c: any) => c.slug === "natural-veneers");
  if (nat) {
    const { data: cols } = await db
      .from("collections")
      .select("id, name, slug, is_active")
      .eq("category_id", nat.id);
    for (const col of cols ?? []) {
      const { count } = await db
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", col.id);
      console.log(`  ${col.slug.padEnd(26)} active=${col.is_active} products=${count}`);
    }
  } else {
    console.log("  (natural-veneers category not found)");
  }

  console.log("\n=== FC4 fan deck: products per series ===");
  const { data: fc4col } = await db
    .from("collections")
    .select("id, name, slug")
    .eq("slug", "turakhia-fc4-fan-deck")
    .maybeSingle();
  if (fc4col) {
    const { data: prods } = await db
      .from("products")
      .select("id, sku, name, short_description, is_active")
      .eq("collection_id", fc4col.id)
      .order("sku");
    const bySeries: Record<string, number> = {};
    for (const p of prods ?? []) {
      const s = (p.short_description ?? "").replace(/ series$/, "") || "(none)";
      bySeries[s] = (bySeries[s] ?? 0) + 1;
    }
    console.log(`  total=${prods?.length ?? 0}`);
    for (const [s, n] of Object.entries(bySeries).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${s.padEnd(14)} ${n}`);
    }
    const ever = (prods ?? []).filter((p) => /^Evergreen series$/i.test(p.short_description ?? ""));
    console.log(`\n  Evergreen products (${ever.length}):`);
    console.log("    " + ever.map((p) => p.sku).join("\n    "));
  } else {
    console.log("  (turakhia-fc4-fan-deck not found)");
  }

  console.log("\n=== duplicate FC4 Evergreen copy: founders-collection-4 ===");
  const { data: foun } = await db
    .from("collections")
    .select("id, name, slug, category_id")
    .eq("slug", "founders-collection-4")
    .maybeSingle();
  if (foun) {
    const { data: fp } = await db
      .from("products")
      .select("sku, name, is_active")
      .eq("collection_id", foun.id)
      .order("sku");
    console.log(`  products=${fp?.length ?? 0}`);
    console.log("    " + (fp ?? []).map((p) => `${p.sku} ${p.name}`).join("\n    "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
