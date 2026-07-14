/**
 * seed-doors.ts
 *
 * Additive, idempotent seed for the real door catalogue data extracted from
 * doors_1.pdf (the Karnav / Citiply "Wooden Doors" brochure). Everything is
 * inserted under the existing `doors` catalogue.
 *
 * - Reads door_1_products.json as the single source of truth.
 * - Upserts categories / collections / products by slug/sku (safe to re-run).
 * - Product images are intentionally NOT inserted yet (images will be
 *   bulk-uploaded later). product_specs ARE inserted from the brochure's
 *   common_technical_details plus per-collection finish/base/thickness.
 *
 * Note: doors_2.pdf / doors_3.pdf were intentionally skipped — they are a
 * scanned, image-only "plan my interior" lookbook (identical to each other)
 * with no product codes, names, or specs to extract.
 *
 * Run:  npx tsx scripts/seed-doors.ts
 * Needs env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CATALOGUE_SLUG = "doors";

function readJson<T = any>(file: string): T {
  return JSON.parse(readFileSync(join(ROOT, file), "utf8"));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ---- Category definitions (upserted under the `doors` catalogue) ------------
// Slugs reuse the ones already created by scripts/seed.ts (upsert = no dupes).
const CATEGORIES = [
  { name: "Designer Doors", slug: "designer-doors", description: "Statement designer door faces — veneer and duco finishes.", sort_order: 2 },
  { name: "Flush Doors", slug: "flush-doors", description: "Solid wood, basic veneer, and laminated flush door faces.", sort_order: 1 }
];

type ProductRow = {
  code: string;
  note?: string;
};

type CollectionRow = {
  name: string;
  slug: string;
  category: string;
  tagline: string;
  finish: string | null;
  base_material: string | null;
  thickness: string | null;
  color_tone: string;
  products: ProductRow[];
};

type DoorDoc = {
  brand?: string;
  description?: string;
  common_technical_details?: Record<string, any>;
  collections: CollectionRow[];
};

function specsFromCommon(
  common: Record<string, any> | undefined,
  collection: CollectionRow
): { spec_name: string; spec_value: string }[] {
  const specs: { spec_name: string; spec_value: string }[] = [];
  if (collection.finish) specs.push({ spec_name: "Finish", spec_value: collection.finish });
  if (collection.base_material) specs.push({ spec_name: "Base Material", spec_value: collection.base_material });
  if (collection.thickness) specs.push({ spec_name: "Thickness", spec_value: collection.thickness });
  if (common?.standard_size) specs.push({ spec_name: "Standard Size", spec_value: common.standard_size });
  if (common?.core) specs.push({ spec_name: "Core", spec_value: common.core });
  return specs;
}

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(url, key, {
    realtime: { transport: ws as unknown as WebSocketLikeConstructor }
  });

  const doc = readJson<DoorDoc>("door_1_products.json");
  const common = doc.common_technical_details;

  // 1. Ensure the doors catalogue exists and grab its id.
  const { data: cat, error: catErr } = await supabase
    .from("catalogues")
    .upsert(
      { name: "Doors", slug: CATALOGUE_SLUG, description: "Premium door surfaces and matching systems for interiors.", sort_order: 3, is_active: true },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (catErr) throw catErr;
  const catalogueId = cat.id as string;

  // 2. Categories.
  const categoryMap: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const { data, error } = await supabase
      .from("categories")
      .upsert({ ...c, catalogue_id: catalogueId, is_active: true }, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error) throw error;
    categoryMap[data.slug] = data.id;
  }

  // 3. Collections + products (+ specs). No images inserted (bulk-upload later).
  let totalProducts = 0;

  for (const collection of doc.collections) {
    const categoryId = categoryMap[collection.category];
    if (!categoryId) throw new Error(`Missing category for ${collection.category}`);

    const { data: col, error: colErr } = await supabase
      .from("collections")
      .upsert(
        {
          name: collection.name,
          slug: collection.slug,
          category_id: categoryId,
          tagline: collection.tagline,
          description: `${collection.name} from the ${doc.brand ?? "Karnav"} wooden door collection.`,
          banner_url: null,
          logo_url: null,
          brochure_url: null,
          is_featured: false,
          is_active: true
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();
    if (colErr) throw colErr;
    const collectionId = col.id as string;

    const specs = specsFromCommon(common, collection);

    for (const p of collection.products) {
      const name = `${collection.name.replace(/ Doors?$/i, "")} ${p.code}`.trim();
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .upsert(
          {
            sku: `DOOR-${p.code}`,
            name,
            slug: `${collection.slug}-${p.code}`,
            category_id: categoryId,
            collection_id: collectionId,
            finish: collection.finish,
            base_material: collection.base_material,
            size: common?.standard_size ?? null,
            thickness: collection.thickness,
            color_tone: collection.color_tone,
            applications: ["Interior Doors", "Main Doors", "Residential", "Commercial"],
            short_description: p.note || `${name} from the ${collection.name} range.`,
            brochure_url: null,
            is_active: true,
            seo_title: `${name} | ${collection.name}`,
            seo_description: `${name} — ${collection.tagline}.`
          },
          { onConflict: "sku" }
        )
        .select("id")
        .single();
      if (prodErr) throw prodErr;

      // Refresh specs for this product (idempotent).
      await supabase.from("product_specs").delete().eq("product_id", product.id);
      if (specs.length) {
        await supabase.from("product_specs").insert(
          specs.map((s, i) => ({ ...s, product_id: product.id, sort_order: i }))
        );
      }
      totalProducts += 1;
    }
    console.log(`  ✓ ${collection.name}: ${collection.products.length} products`);
  }

  console.log(`\nDone. Seeded ${doc.collections.length} collections / ${totalProducts} products under the "${CATALOGUE_SLUG}" catalogue. (Images left empty for later bulk upload.)`);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
