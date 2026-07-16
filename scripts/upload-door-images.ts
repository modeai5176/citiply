/**
 * upload-door-images.ts
 *
 * Bulk-uploads the door product images extracted from doors_1.pdf.
 *
 * Expects a local folder `door-images/` at the repo root containing one file
 * per product named by its catalogue code, e.g. `0124.png`, `0125.png`, ...
 * (These are produced by rendering + cropping the coded pages of doors_1.pdf.)
 *
 * For each `<CODE>.png` it:
 *   - finds the product by sku = `DOOR-<CODE>`
 *   - runs the SAME image pipeline as the admin uploader (webp main + thumb + blur)
 *   - uploads to S3 under `doors/<code>`
 *   - inserts a `product_images` row (kind: 'main', sort_order: 0)
 *
 * Idempotent: it deletes existing images for a product before inserting, so it
 * is safe to re-run. Missing products / files are reported, not fatal.
 *
 * Run:  npm run upload:door-images
 * Needs env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *            AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID,
 *            AWS_SECRET_ACCESS_KEY, NEXT_PUBLIC_S3_BASE_URL
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { processAndUploadImage } from "../lib/s3";

const ROOT = process.cwd();
const IMAGE_DIR = join(ROOT, "door-images");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(url, key, {
    realtime: { transport: ws as unknown as WebSocketLikeConstructor }
  });

  const files = readdirSync(IMAGE_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  if (!files.length) {
    console.log(`No image files found in ${IMAGE_DIR}. Nothing to do.`);
    return;
  }

  let uploaded = 0;
  const missing: string[] = [];

  for (const file of files) {
    const code = file.replace(/\.(png|jpe?g|webp)$/i, "");
    const sku = `DOOR-${code}`;

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("id, name")
      .eq("sku", sku)
      .maybeSingle();
    if (prodErr) throw prodErr;
    if (!product) {
      missing.push(sku);
      console.warn(`  ⚠ no product for ${sku} (skipping ${file})`);
      continue;
    }

    const buffer = readFileSync(join(IMAGE_DIR, file));
    const { imageUrl, thumbnailUrl, blurDataUrl } = await processAndUploadImage(buffer, "doors", code);

    // Idempotent: clear any existing images for this product first.
    await supabase.from("product_images").delete().eq("product_id", product.id);

    const { error: imgErr } = await supabase.from("product_images").insert({
      product_id: product.id,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      blur_data_url: blurDataUrl,
      kind: "main",
      sort_order: 0
    });
    if (imgErr) throw imgErr;

    uploaded += 1;
    console.log(`  ✓ ${sku}  →  ${imageUrl}`);
  }

  console.log(`\nDone. Uploaded ${uploaded} images.`);
  if (missing.length) console.log(`Skipped (no matching product): ${missing.join(", ")}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});