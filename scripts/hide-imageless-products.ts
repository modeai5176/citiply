/**
 * hide-imageless-products.ts
 *
 * Interim tidy-up: deactivates veneer products that have no product_images row,
 * so the expanded category pages stop showing the "coming soon" placeholder.
 *
 * Reversible — it only flips products.is_active, never deletes. A collection or
 * category that would be left with nothing visible is REPORTED, not touched, so
 * you can decide whether to retire it too rather than leaving an empty page.
 *
 *   dotenv -e .env -- npx tsx scripts/hide-imageless-products.ts            # dry run
 *   dotenv -e .env -- npx tsx scripts/hide-imageless-products.ts --apply
 *   dotenv -e .env -- npx tsx scripts/hide-imageless-products.ts --apply exotic-veneers
 *   dotenv -e .env -- npx tsx scripts/hide-imageless-products.ts --restore   # undo
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const APPLY = process.argv.includes("--apply");
const RESTORE = process.argv.includes("--restore");
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

async function main() {
  const mode = RESTORE ? "RESTORE" : APPLY ? "APPLY" : "DRY RUN";
  console.log(`=== hide-imageless-products (${mode}) ===\n`);

  const { data: cat } = await db.from("catalogues").select("id").eq("slug", "veneers").maybeSingle();
  const { data: cats } = await db.from("categories")
    .select("id, slug").eq("catalogue_id", cat!.id).eq("is_active", true).order("sort_order");

  let totalHidden = 0;
  const emptied: string[] = [];

  for (const c of cats ?? []) {
    if (ONLY.length && !ONLY.includes(c.slug)) continue;

    // collections.is_active is TEXT in the live DB, so filter server-side only
    const { data: cols } = await db.from("collections")
      .select("id, slug").eq("category_id", c.id).eq("is_active", true);

    let catKept = 0;
    let catHidden = 0;

    for (const col of cols ?? []) {
      const { data: prods } = await db.from("products")
        .select("id, sku, is_active, product_images(id)")
        .eq("collection_id", col.id).eq("category_id", c.id);

      const imageless = (prods ?? []).filter((p) => (p.product_images ?? []).length === 0);
      const withImage = (prods ?? []).filter((p) => (p.product_images ?? []).length > 0);
      catKept += withImage.length;

      if (RESTORE) {
        const off = imageless.filter((p) => !p.is_active);
        if (off.length && APPLY) {
          for (const p of off) {
            const { error } = await db.from("products").update({ is_active: true }).eq("id", p.id);
            if (error) throw error;
          }
        }
        if (off.length) console.log(`  ${col.slug.padEnd(30)} ${APPLY ? "restored" : "would restore"} ${off.length}`);
        totalHidden += off.length;
        continue;
      }

      const toHide = imageless.filter((p) => p.is_active);
      if (!toHide.length) continue;

      if (APPLY) {
        for (const p of toHide) {
          const { error } = await db.from("products").update({ is_active: false }).eq("id", p.id);
          if (error) throw error;
        }
      }
      catHidden += toHide.length;
      totalHidden += toHide.length;
      const left = withImage.length;
      console.log(`  ${col.slug.padEnd(30)} ${APPLY ? "hid" : "would hide"} ${String(toHide.length).padStart(3)}   ${left} left visible${left === 0 ? "   <-- collection becomes EMPTY" : ""}`);
      if (left === 0) emptied.push(`${c.slug}/${col.slug}`);
    }

    if (!RESTORE && (catHidden || catKept === 0)) {
      console.log(`  ${("[" + c.slug + "]").padEnd(30)} ${catKept} product(s) would remain visible${catKept === 0 ? "   <-- CATEGORY BECOMES EMPTY" : ""}\n`);
    }
  }

  console.log(`\nproducts ${RESTORE ? "restored" : APPLY ? "hidden" : "to hide"}: ${totalHidden}`);
  if (emptied.length) {
    console.log(`\ncollections left with nothing visible (${emptied.length}) — NOT retired, your call:`);
    for (const e of emptied) console.log(`   ${e}`);
  }
  console.log(`\n=== ${mode} complete ===`);
  if (!APPLY) console.log("re-run with --apply to write.");
}

main().catch((e) => { console.error(e); process.exit(1); });
