/**
 * seed-evergreen-new-photos.ts
 *
 * Phase 5: Upload new Evergreen series White Oak products from Veneer_Evergreen folder.
 *
 * This script:
 *   1. Reads all .jpg files from the Veneer_Evergreen directory
 *   2. Derives product name from exact file name (minus extension)
 *   3. Generates clean slugs and SKUs
 *   4. Looks up the existing Evergreen category + Oak collection (created by restructure-evergreen.ts)
 *   5. Processes images (resize, webp, thumbnail, blur) via sharp
 *   6. Uploads to S3 under veneers/<sku> path
 *   7. Inserts products + product_images rows
 *
 * Skips:
 *   - Files with "(1)" suffix (duplicates from Google Drive)
 *   - Products with SKU already in the database (idempotent)
 *
 * Dry run (default):  dotenv -e .env -- npx tsx scripts/seed-evergreen-new-photos.ts
 * Apply:              dotenv -e .env -- npx tsx scripts/seed-evergreen-new-photos.ts --apply
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { readFileSync, readdirSync } from "node:fs";
import { join, parse as parsePath } from "node:path";
import { processAndUploadImage } from "../lib/s3";

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const IMAGE_DIR = join(ROOT, "Veneer_Evergreen");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

const db = createClient(url, key, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

// The Evergreen category slug (created by restructure-evergreen.ts)
const CATEGORY_SLUG = "evergreen";
// The Oak collection slug (created by restructure-evergreen.ts)
const COLLECTION_SLUG = "evergreen-oak";

/**
 * Derive a clean SKU from the product name.
 * e.g. "WHITE OAK - LOT ID 104_39" -> "EVERGREEN-WHITE-OAK-LOT-104-39"
 */
function deriveSku(productName: string): string {
  return (
    "EVERGREEN-" +
    productName
      .toUpperCase()
      .replace(/LOT\s*ID\s*/gi, "LOT-")  // "LOT ID 104" -> "LOT-104"
      .replace(/[^A-Z0-9]+/g, "-")         // Replace non-alphanumeric with dash
      .replace(/-+/g, "-")                  // Collapse multiple dashes
      .replace(/^-|-$/g, "")               // Trim leading/trailing dashes
  );
}

/**
 * Derive a URL-friendly slug from the product name.
 * e.g. "WHITE OAK - LOT ID 104_39" -> "white-oak-lot-104-39"
 */
function deriveSlug(productName: string): string {
  return productName
    .toLowerCase()
    .replace(/lot\s*id\s*/gi, "lot-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Extract the quantity number from the filename.
 * The number after the underscore is the quantity.
 * e.g. "WHITE OAK - LOT ID 104_39" -> "39"
 *      "WHITE OAK - 3976_ 47" -> "47"
 */
function extractQuantity(productName: string): string | null {
  const match = productName.match(/_\s*(\d+)\s*$/);
  return match ? match[1] : null;
}

/**
 * Check if a file should be skipped.
 * Skip files with "(1)" (duplicates) or non-image files.
 */
function shouldSkipFile(filename: string): { skip: boolean; reason?: string } {
  if (!/\.(jpe?g|png|webp)$/i.test(filename)) {
    return { skip: true, reason: "not an image file" };
  }
  if (/\(\d+\)/.test(filename)) {
    return { skip: true, reason: "duplicate file (numbered copy)" };
  }
  return { skip: false };
}

function log(...args: unknown[]) {
  console.log(...args);
}

async function main() {
  const mode = APPLY ? "APPLY" : "DRY RUN";
  log(`=== seed-evergreen-new-photos (${mode}) ===\n`);

  // --- Read all files from Veneer_Evergreen ---
  const allFiles = readdirSync(IMAGE_DIR).sort();
  log(`Found ${allFiles.length} files in Veneer_Evergreen/\n`);

  // --- Filter files ---
  const validFiles: string[] = [];
  const skippedFiles: Array<{ file: string; reason: string }> = [];

  for (const file of allFiles) {
    const { skip, reason } = shouldSkipFile(file);
    if (skip) {
      skippedFiles.push({ file, reason: reason! });
    } else {
      validFiles.push(file);
    }
  }

  if (skippedFiles.length) {
    log("Skipped files:");
    for (const { file, reason } of skippedFiles) {
      log(`  ✗ ${file} — ${reason}`);
    }
    log("");
  }

  log(`Valid product images: ${validFiles.length}\n`);

  // --- Resolve Evergreen category ---
  const { data: category, error: catErr } = await db
    .from("categories")
    .select("id")
    .eq("slug", CATEGORY_SLUG)
    .maybeSingle();
  if (catErr) throw catErr;
  if (!category) throw new Error(`Category '${CATEGORY_SLUG}' not found. Run restructure-evergreen.ts first.`);
  log(`Category '${CATEGORY_SLUG}' found: ${category.id}`);

  // --- Resolve Oak collection ---
  const { data: collection, error: colErr } = await db
    .from("collections")
    .select("id")
    .eq("slug", COLLECTION_SLUG)
    .maybeSingle();
  if (colErr) throw colErr;
  if (!collection) throw new Error(`Collection '${COLLECTION_SLUG}' not found. Run restructure-evergreen.ts first.`);
  log(`Collection '${COLLECTION_SLUG}' found: ${collection.id}\n`);

  // --- Process each valid file ---
  let created = 0;
  let skippedExisting = 0;
  let errors = 0;

  for (const file of validFiles) {
    const { name: productName } = parsePath(file);
    const sku = deriveSku(productName);
    const slug = deriveSlug(productName);
    const quantity = extractQuantity(productName);

    log(`\n--- ${productName} ---`);
    log(`  SKU:      ${sku}`);
    log(`  Slug:     ${slug}`);
    log(`  Quantity: ${quantity ?? "N/A"}`);

    // Check if product already exists
    const { data: existing } = await db
      .from("products")
      .select("id")
      .eq("sku", sku)
      .maybeSingle();

    if (existing) {
      log(`  ⚠ Already exists (id: ${existing.id}), skipping`);
      skippedExisting++;
      continue;
    }

    if (!APPLY) {
      log(`  → Would create product + upload image`);
      created++;
      continue;
    }

    try {
      // 1. Read and process image
      const buffer = readFileSync(join(IMAGE_DIR, file));
      log(`  📸 Processing image (${(buffer.length / 1024 / 1024).toFixed(1)} MB)...`);

      const { imageUrl, thumbnailUrl, blurDataUrl } = await processAndUploadImage(
        buffer,
        "veneers",
        sku.toLowerCase()
      );
      log(`  ✓ Image uploaded: ${imageUrl}`);

      // 2. Insert product (quantity column may not exist in live DB yet)
      const productPayload: Record<string, unknown> = {
        sku,
        name: productName,
        slug,
        category_id: category.id,
        collection_id: collection.id,
        finish: "Natural",
        base_material: "Veneer Plywood",
        color_tone: "Light & Blonde",
        short_description: `White Oak veneer — ${productName}${quantity ? ` (Qty: ${quantity})` : ""}`,
        is_active: true,
        applications: ["Furniture", "Wall Paneling", "Interior Design"]
      };

      const { data: product, error: prodErr } = await db
        .from("products")
        .insert(productPayload)
        .select("id")
        .single();

      if (prodErr) {
        log(`  ✗ Product insert error: ${prodErr.message}`);
        errors++;
        continue;
      }

      // 3. Insert product image
      const { error: imgErr } = await db.from("product_images").insert({
        product_id: product.id,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        blur_data_url: blurDataUrl,
        kind: "main",
        sort_order: 0
      });

      if (imgErr) {
        log(`  ✗ Image record insert error: ${imgErr.message}`);
        errors++;
        continue;
      }

      log(`  ✓ Product created (id: ${product.id})`);
      created++;
    } catch (err) {
      log(`  ✗ Error: ${err instanceof Error ? err.message : String(err)}`);
      errors++;
    }
  }

  // --- Summary ---
  log(`\n${"=".repeat(50)}`);
  log(`=== ${mode} complete ===`);
  log(`  Created:  ${created}`);
  log(`  Skipped (existing): ${skippedExisting}`);
  log(`  Skipped (invalid):  ${skippedFiles.length}`);
  log(`  Errors:   ${errors}`);
  log(`  Total:    ${created + skippedExisting + skippedFiles.length + errors}`);

  if (!APPLY) {
    log(`\nRe-run with --apply to write to database and upload images.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
