/**
 * seed-laminates.ts
 *
 * Additive, idempotent seed for the real laminate catalogue data extracted from
 * the Laminate_*.pdf brochures (Laminate_1 .. Laminate_9) of Shiv Shakti
 * Laminates Pvt. Ltd. Everything is inserted under the existing `laminates`
 * catalogue.
 *
 * - Reads the laminate_*_products.json files as the single source of truth.
 * - Upserts categories / collections / products by slug/sku (safe to re-run).
 * - Product images are intentionally NOT inserted yet (images will be
 *   bulk-uploaded later, mirroring the veneer flow). product_specs ARE inserted
 *   from each brochure's common_technical_details.
 * - Laminate_3 (Ligital Series) is an overlap-only lookbook (0 products) and is
 *   skipped, the same way the overlapping veneer_15 brochure was.
 *
 * Category slugs reuse the ones already created by scripts/seed.ts where they
 * exist (solid-laminates, woodgrain-laminates) so upsert = no duplicates.
 *
 * Run:  npx tsx scripts/seed-laminates.ts
 * Needs env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CATALOGUE_SLUG = "laminates";

function readJson<T = any>(file: string): T {
  return JSON.parse(readFileSync(join(ROOT, file), "utf8"));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ---- Category definitions (upserted under the `laminates` catalogue) --------
// `solid-laminates` and `woodgrain-laminates` already exist from seed.ts.
const CATEGORIES = [
  { name: "Woodgrain", slug: "woodgrain-laminates", description: "Realistic natural woodgrain decorative laminates.", sort_order: 1 },
  { name: "Solid & Textured", slug: "solid-laminates", description: "Solid shades and fabric / textile textured decorative laminates.", sort_order: 2 },
  { name: "Gradient / Ombre", slug: "gradient-laminates", description: "Ombre and gradient decorative laminate surfaces.", sort_order: 3 },
  { name: "Fluted & Profiled", slug: "fluted-laminates", description: "Fluted, reeded and herringbone profiled laminate panels.", sort_order: 4 },
  { name: "Stone & Specialty", slug: "specialty-laminates", description: "Stone, marble, metallic, rough-cut and synchronised specialty laminates.", sort_order: 5 },
  { name: "Large Format (4X10)", slug: "large-format-laminates", description: "Expansive 4x10 format laminates for uninterrupted surfaces.", sort_order: 6 }
];

type SpecPair = { spec_name: string; spec_value: string };

// ---- Spec builder from each brochure's common_technical_details --------------
function specsFromCommon(common: Record<string, any> | undefined): SpecPair[] {
  if (!common) return [];
  const specs: SpecPair[] = [];
  const push = (name: string, v: any) => {
    if (typeof v === "string" && v.trim()) specs.push({ spec_name: name, spec_value: v.trim() });
  };
  push("Thickness", common.thickness);
  push("Texture", common.texture);
  push("Finish", common.finish);
  push("Usage", common.usage);
  push("Finish Codes", common.finish_codes);
  const sizes: string[] = common.panel_sizes ?? (common.panel_size ? [common.panel_size] : []);
  if (sizes.length) specs.push({ spec_name: "Panel Size", spec_value: sizes.join(", ") });
  const prefixes: string[] = common.series_code_prefixes ?? (common.series_code_prefix ? [common.series_code_prefix] : []);
  if (prefixes.length) specs.push({ spec_name: "Series Codes", spec_value: prefixes.join(", ") });
  return specs;
}

// ---- Collection plan ---------------------------------------------------------
type ProductRow = {
  sku: string;
  name: string;
  short_description: string;
  color_tone: string;
  size: string | null;
};

type CollectionPlan = {
  name: string;
  slug: string;
  category_slug: string;
  tagline: string;
  description: string;
  specs: SpecPair[];
  finish: string | null;
  base_material: string | null;
  size: string | null;
  thickness: string | null;
  products: ProductRow[];
};

const firstSize = (c: any): string | null => {
  const sizes: string[] = c?.panel_sizes ?? (c?.panel_size ? [c.panel_size] : []);
  return sizes[0] ?? null;
};

function buildPlan(): CollectionPlan[] {
  const l1 = readJson("laminate_1_products.json");
  const l2 = readJson("laminate_2_products.json");
  const l4 = readJson("laminate_4_products.json");
  const l5 = readJson("laminate_5_products.json");
  const l6 = readJson("laminate_6_products.json");
  const l7 = readJson("laminate_7_products.json");
  const l8 = readJson("laminate_8_products.json");
  const l9 = readJson("laminate_9_products.json");
  // l3 (Ligital Series) is an overlap-only lookbook (0 products) — skipped.

  const plans: CollectionPlan[] = [];

  // --- Laminate_1: Bigger & Better — 4X10 (Large Format) ---
  {
    const c = l1.common_technical_details ?? {};
    plans.push({
      name: "Bigger & Better — 4X10",
      slug: "bb-4x10",
      category_slug: "large-format-laminates",
      tagline: l1.product_line_tagline ?? "Bigger & Better — expansive 4x10 laminate surfaces",
      description: l1.description ?? "",
      specs: specsFromCommon(c),
      finish: c.texture ?? "Linear Woodgrain",
      base_material: null,
      size: (c.panel_sizes ?? []).join(", ") || null,
      thickness: c.thickness ?? "1.00 mm",
      products: (l1.products ?? []).map((p: any) => ({
        sku: `BB-${p.design}-${p.finish}`,
        name: `B&B ${p.design} (${p.finish})`,
        short_description: `Linear woodgrain 4X10 laminate — design ${p.design}, finish ${p.finish}`,
        color_tone: "Woodgrain",
        size: null
      }))
    });
  }

  // --- Laminate_2: Overlay — Gradient ---
  {
    const c = l2.common_technical_details ?? {};
    plans.push({
      name: "Overlay — Gradient",
      slug: "overlay-gradient",
      category_slug: "gradient-laminates",
      tagline: l2.product_line_tagline ?? "Ombre & gradient decorative laminates",
      description: l2.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Ombre / Gradient",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (l2.products ?? []).map((p: any) => ({
        sku: `GDT-${p.code.replace(/^GDT-/, "")}`,
        name: `Gradient ${p.code}`,
        short_description: `${p.theme} — ombre gradient laminate (${p.code})`,
        color_tone: "Gradient",
        size: null
      }))
    });
  }

  // --- Laminate_4: Lissaro ---
  {
    const c = l4.common_technical_details ?? {};
    plans.push({
      name: "Lissaro",
      slug: "lissaro",
      category_slug: "solid-laminates",
      tagline: l4.product_line_tagline ?? "Woven & textile-inspired decorative laminates",
      description: l4.description ?? "",
      specs: specsFromCommon(c),
      finish: "Textile / Woven",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (l4.products ?? []).map((p: any) => ({
        sku: `LSS-${slugify(p.code).toUpperCase()}`,
        name: `Lissaro ${p.code.replace(/^LSS\s*/, "")}`,
        short_description: `Woven / textile-look decorative laminate (${p.code})`,
        color_tone: "Textured",
        size: p.size ?? firstSize(c)
      }))
    });
  }

  // --- Laminate_5: LP Woodgrain ---
  {
    const c = l5.common_technical_details ?? {};
    plans.push({
      name: "Lotus LP — Woodgrain",
      slug: "lotus-lp-woodgrain",
      category_slug: "woodgrain-laminates",
      tagline: l5.product_line_tagline ?? "Natural woodgrain decorative laminates",
      description: l5.description ?? "",
      specs: specsFromCommon(c),
      finish: "Woodgrain",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (l5.products ?? []).map((p: any) => ({
        sku: `LP-${slugify(p.code).toUpperCase()}`,
        name: p.code,
        short_description: `Natural woodgrain decorative laminate (${p.code})`,
        color_tone: "Woodgrain",
        size: p.size ?? firstSize(c)
      }))
    });
  }

  // --- Laminate_6: PR Textured (PR + LP large format + AA stone) ---
  {
    const c = l6.common_technical_details ?? {};
    plans.push({
      name: "Lotus PR — Textured",
      slug: "lotus-pr-textured",
      category_slug: "solid-laminates",
      tagline: l6.product_line_tagline ?? "Solid, textured and woodgrain decorative laminates",
      description: l6.description ?? "",
      specs: specsFromCommon(c),
      finish: "Solid / Textured",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (l6.products ?? []).map((p: any) => {
        const isStone = /stone|marble/i.test(p.note ?? "");
        return {
          sku: `LOTUS-${slugify(p.code).toUpperCase()}`,
          name: p.code,
          short_description: p.note
            ? `${p.note} decorative laminate (${p.code})`
            : `Solid / textured decorative laminate (${p.code})`,
          color_tone: isStone ? "Stone" : "Textured",
          size: p.size ?? firstSize(c)
        };
      })
    });
  }

  // --- Laminate_7: Lotus Master Catalogue (multi-series) ---
  // Series are split across the natural laminate categories by prefix.
  {
    const c = l7.common_technical_details ?? {};
    const seriesToCategory: Record<string, string> = {
      FLT: "fluted-laminates",
      PR: "fluted-laminates",
      SPL: "solid-laminates",
      LP: "woodgrain-laminates",
      MHU: "woodgrain-laminates",
      AA: "specialty-laminates"
    };
    const seriesTone: Record<string, string> = {
      FLT: "Textured", PR: "Textured", SPL: "Solid", LP: "Woodgrain", MHU: "Woodgrain", AA: "Specialty"
    };
    const bySeries: Record<string, any[]> = {};
    for (const p of l7.products ?? []) (bySeries[p.series] ??= []).push(p);
    const seriesName: Record<string, string> = {
      FLT: "Fluted", PR: "PR Fluted", SPL: "Solid & Textured", LP: "Woodgrain", MHU: "MHU Woodgrain", AA: "Specialty"
    };
    for (const [series, items] of Object.entries(bySeries)) {
      plans.push({
        name: `Lotus Master — ${seriesName[series] ?? series}`,
        slug: `lotus-master-${slugify(series)}`,
        category_slug: seriesToCategory[series] ?? "solid-laminates",
        tagline: l7.product_line_tagline ?? "The complete Lotus decorative laminate range",
        description: l7.description ?? "",
        specs: specsFromCommon(c),
        finish: seriesTone[series] ?? null,
        base_material: null,
        size: firstSize(c),
        thickness: null,
        products: items.map((p: any) => ({
          sku: `LOTUSM-${slugify(p.code).toUpperCase()}`,
          name: `Lotus ${p.code}`,
          short_description: `${seriesName[series] ?? series} decorative laminate (${p.code})`,
          color_tone: seriesTone[series] ?? "Solid",
          size: null
        }))
      });
    }
  }

  // --- Laminate_8: Springoo Lam ---
  {
    const c = l8.common_technical_details ?? {};
    plans.push({
      name: "Springoo Lam",
      slug: "springoo-lam",
      category_slug: "specialty-laminates",
      tagline: l8.product_line_tagline ?? "Woodgrain, rough-cut and stone decorative laminates",
      description: l8.description ?? "",
      specs: specsFromCommon(c),
      finish: "Mixed (woodgrain / rough-cut / stone / metallic)",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (l8.products ?? []).map((p: any) => {
        const note = p.note ?? "";
        let tone = "Woodgrain";
        if (/stone|marble|concrete/i.test(note)) tone = "Stone";
        else if (/metallic/i.test(note)) tone = "Metallic";
        else if (/rough/i.test(note)) tone = "Rough Cut";
        else if (/synchron/i.test(note)) tone = "Textured";
        return {
          sku: `SPRINGOO-${slugify(p.code).toUpperCase()}`,
          name: `Springoo ${p.code}`,
          short_description: note
            ? `${note} decorative laminate (${p.code})`
            : `Decorative laminate (${p.code})`,
          color_tone: tone,
          size: null
        };
      })
    });
  }

  // --- Laminate_9: Lotus Exclusive Series ---
  {
    const c = l9.common_technical_details ?? {};
    plans.push({
      name: "Lotus Exclusive Series",
      slug: "lotus-exclusive",
      category_slug: "solid-laminates",
      tagline: l9.product_line_tagline ?? "Exclusive textured & 3D decorative laminates",
      description: l9.description ?? "",
      specs: specsFromCommon(c),
      finish: "Textured / 3D",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (l9.products ?? []).map((p: any) => ({
        sku: `LOTUSEX-${slugify(p.code).toUpperCase()}`,
        name: `Lotus ${p.code}`,
        short_description: `Exclusive textured / 3D decorative laminate (${p.code})`,
        color_tone: "Textured",
        size: null
      }))
    });
  }

  return plans;
}

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(url, key, {
    realtime: { transport: ws as unknown as WebSocketLikeConstructor }
  });

  // 1. Ensure the laminates catalogue exists and grab its id.
  const { data: cat, error: catErr } = await supabase
    .from("catalogues")
    .upsert(
      { name: "Laminates", slug: CATALOGUE_SLUG, description: "Durable decorative laminates — woodgrain, solid, textured, gradient and large-format surfaces.", sort_order: 5, is_active: true },
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
  const plans = buildPlan();
  let totalProducts = 0;

  for (const plan of plans) {
    const categoryId = categoryMap[plan.category_slug];
    if (!categoryId) throw new Error(`Missing category for ${plan.category_slug}`);

    const { data: collection, error: colErr } = await supabase
      .from("collections")
      .upsert(
        {
          name: plan.name,
          slug: plan.slug,
          category_id: categoryId,
          tagline: plan.tagline,
          description: plan.description,
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
    const collectionId = collection.id as string;

    for (const p of plan.products) {
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .upsert(
          {
            sku: p.sku,
            name: p.name,
            slug: `${plan.slug}-${slugify(p.name)}`,
            category_id: categoryId,
            collection_id: collectionId,
            finish: plan.finish,
            base_material: plan.base_material,
            size: p.size ?? plan.size,
            thickness: plan.thickness,
            color_tone: p.color_tone,
            applications: ["Wall Paneling", "Furniture", "Interiors"],
            short_description: p.short_description || `${p.name} from the ${plan.name} range.`,
            brochure_url: null,
            is_active: true,
            seo_title: `${p.name} | ${plan.name}`,
            seo_description: `${p.name} — ${plan.tagline}.`
          },
          { onConflict: "sku" }
        )
        .select("id")
        .single();
      if (prodErr) throw prodErr;

      // Refresh specs for this product (idempotent).
      await supabase.from("product_specs").delete().eq("product_id", product.id);
      if (plan.specs.length) {
        await supabase.from("product_specs").insert(
          plan.specs.map((s, i) => ({ ...s, product_id: product.id, sort_order: i }))
        );
      }
      totalProducts += 1;
    }
    console.log(`  ✓ ${plan.name}: ${plan.products.length} products`);
  }

  console.log(`\nDone. Seeded ${plans.length} collections / ${totalProducts} products under the "${CATALOGUE_SLUG}" catalogue. (Images left empty for later bulk upload.)`);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
