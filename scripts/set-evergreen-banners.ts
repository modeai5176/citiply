/**
 * set-evergreen-banners.ts
 *
 * The 14 Evergreen species-family collections (evergreen-walnut, evergreen-oak, ...)
 * were created by restructure-evergreen.ts without a banner_url, so their collection
 * cards fall back to the generic /images/placeholder.png. Each family already has
 * real swatch photography on its member products (uploaded by
 * upload-veneer-images.ts) — this script picks one representative product per
 * family and reuses its main image as the collection's banner_url.
 *
 * Dry run (default):  dotenv -e .env -- npx tsx scripts/set-evergreen-banners.ts
 * Apply:               dotenv -e .env -- npx tsx scripts/set-evergreen-banners.ts --apply
 */
import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const APPLY = process.argv.includes("--apply");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

// One representative SKU per family — the lead species named in restructure-evergreen.ts.
const REPRESENTATIVE: Record<string, string> = {
  "evergreen-walnut": "FC4-AMERICAN-WALNUT",
  "evergreen-oak": "FC4-WHITE-OAK",
  "evergreen-teak": "FC4-BURMESE-TEAK",
  "evergreen-rosewood": "FC4-INDIAN-ROSEWOOD",
  "evergreen-maple": "FC4-AMERICAN-MAPLE",
  "evergreen-cherry": "FC4-EUROPEAN-CHERRY",
  "evergreen-cedar": "FC4-LEBANESE-CEDAR",
  "evergreen-wenge": "FC4-WENGE",
  "evergreen-anigre": "FC4-ANIGRE",
  "evergreen-sapeli": "FC4-SAPELI",
  "evergreen-eucalyptus": "FC4-EUCALYPTUS-FIGURED",
  "evergreen-dark-exotics": "FC4-MACASSAR-EBONY",
  "evergreen-warm-mid-tones": "FC4-SUCUPIRA",
  "evergreen-light-blonde": "FC4-ROSSO"
};

async function main() {
  const mode = APPLY ? "APPLY" : "DRY RUN";
  console.log(`=== set-evergreen-banners (${mode}) ===\n`);

  const slugs = Object.keys(REPRESENTATIVE);
  const { data: cols, error: colErr } = await db.from("collections").select("id,slug,banner_url").in("slug", slugs);
  if (colErr) throw colErr;
  const bySlug = new Map((cols ?? []).map((c) => [c.slug, c]));

  const skus = Object.values(REPRESENTATIVE);
  const { data: products, error: pErr } = await db.from("products").select("id,sku").in("sku", skus);
  if (pErr) throw pErr;
  const productBySku = new Map((products ?? []).map((p) => [p.sku, p]));

  const { data: images, error: iErr } = await db
    .from("product_images")
    .select("product_id,image_url,kind")
    .in("product_id", (products ?? []).map((p) => p.id))
    .eq("kind", "main");
  if (iErr) throw iErr;
  const imageByProductId = new Map((images ?? []).map((i) => [i.product_id, i.image_url]));

  for (const [slug, sku] of Object.entries(REPRESENTATIVE)) {
    const col = bySlug.get(slug);
    if (!col) { console.warn(`  ⚠ no collection for slug ${slug}`); continue; }
    const product = productBySku.get(sku);
    if (!product) { console.warn(`  ⚠ no product for sku ${sku}`); continue; }
    const imageUrl = imageByProductId.get(product.id);
    if (!imageUrl) { console.warn(`  ⚠ no main image for ${sku}`); continue; }

    if (col.banner_url === imageUrl) {
      console.log(`  ${slug.padEnd(28)} already set`);
      continue;
    }
    if (APPLY) {
      const { error } = await db.from("collections").update({ banner_url: imageUrl }).eq("id", col.id);
      if (error) throw error;
      console.log(`  ${slug.padEnd(28)} SET  (${sku})`);
    } else {
      console.log(`  ${slug.padEnd(28)} would set  (${sku}) -> ${imageUrl}`);
    }
  }

  console.log(`\n=== ${mode} complete ===`);
  if (!APPLY) console.log("re-run with --apply to write.");
}

main().catch((e) => { console.error(e); process.exit(1); });
