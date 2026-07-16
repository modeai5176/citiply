/**
 * upload-veneer-images.ts
 *
 * Bulk-uploads veneer swatch images extracted from the veneer_*.pdf brochures.
 *
 * Expects images under `veneer-images/<collection-slug>/<SKU>.png`, where the
 * filename (minus extension) is the product's exact `sku` in the DB. These are
 * produced by the per-collection extractor (scratchpad/extract_veneer.py).
 *
 * For each `<SKU>.png` it:
 *   - finds the product by sku
 *   - runs the SAME pipeline as the admin uploader (webp main + thumb + blur)
 *   - uploads to S3 under `veneers/<sku>`
 *   - inserts a `product_images` row (kind: 'main', sort_order: 0)
 *
 * Idempotent: clears existing images for a product before inserting. Missing
 * products / files are reported, not fatal.
 *
 * Run one collection:   npm run upload:veneer-images -- <collection-slug>
 * Run all collections:  npm run upload:veneer-images
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { processAndUploadImage } from "../lib/s3";

const ROOT = process.cwd();
const IMAGE_ROOT = join(ROOT, "veneer-images");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const supabase = createClient(url, key, { realtime: { transport: ws as unknown as WebSocketLikeConstructor } });

  if (!existsSync(IMAGE_ROOT)) throw new Error(`Folder not found: ${IMAGE_ROOT}`);

  const only = process.argv[2]; // optional collection slug filter
  const collections = readdirSync(IMAGE_ROOT).filter((d) => statSync(join(IMAGE_ROOT, d)).isDirectory());
  const targets = only ? collections.filter((c) => c === only) : collections;

  if (!targets.length) {
    console.log(only ? `No folder veneer-images/${only}` : "No collection folders found.");
    return;
  }

  let grandUploaded = 0;
  const grandMissing: string[] = [];

  for (const collection of targets) {
    const dir = join(IMAGE_ROOT, collection);
    const files = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
    console.log(`\n[${collection}] ${files.length} files`);
    let uploaded = 0;

    for (const file of files) {
      const sku = file.replace(/\.(png|jpe?g|webp)$/i, "");
      const { data: product, error: prodErr } = await supabase
        .from("products").select("id").eq("sku", sku).maybeSingle();
      if (prodErr) throw prodErr;
      if (!product) {
        grandMissing.push(sku);
        console.warn(`  ⚠ no product for sku ${sku}`);
        continue;
      }
      const buffer = readFileSync(join(dir, file));
      const { imageUrl, thumbnailUrl, blurDataUrl } = await processAndUploadImage(buffer, "veneers", sku);
      await supabase.from("product_images").delete().eq("product_id", product.id);
      const { error: imgErr } = await supabase.from("product_images").insert({
        product_id: product.id, image_url: imageUrl, thumbnail_url: thumbnailUrl,
        blur_data_url: blurDataUrl, kind: "main", sort_order: 0
      });
      if (imgErr) throw imgErr;
      uploaded++;
    }
    console.log(`  ✓ uploaded ${uploaded}/${files.length}`);
    grandUploaded += uploaded;
  }

  console.log(`\nDone. Uploaded ${grandUploaded} images across ${targets.length} collection(s).`);
  if (grandMissing.length) console.log(`No matching product for: ${grandMissing.join(", ")}`);
}

main().catch((error: unknown) => { console.error(error); process.exit(1); });
