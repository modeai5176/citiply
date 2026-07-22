/**
 * seed-veneers.ts
 *
 * Additive, idempotent seed for the real veneer catalogue data extracted from
 * the veneer_*.pdf brochures (veneer_2 .. veneer_21). Everything is inserted
 * under the existing `veneers` catalogue.
 *
 * - Reads the veneer_*_products.json files as the single source of truth.
 * - Upserts categories / collections / products by slug/sku (safe to re-run).
 * - Product images are intentionally NOT inserted yet (images will be
 *   bulk-uploaded later). product_specs ARE inserted from each brochure's
 *   common_technical_details.
 * - veneer_4 (CC1..CC63) and veneer_5 (adds CC64) are merged so CC64 is added
 *   without duplicating CC1..CC63.
 *
 * Run:  npx tsx scripts/seed-veneers.ts
 * Needs env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */


import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CATALOGUE_SLUG = "veneers";

function readJson<T = any>(file: string): T {
  return JSON.parse(readFileSync(join(ROOT, file), "utf8"));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ---- Category definitions (upserted under the `veneers` catalogue) ----------
// Slugs that already exist in scripts/seed.ts are reused (upsert = no dupes).
const CATEGORIES = [
  { name: "Natural", slug: "natural-veneers", description: "Premium natural wood veneers from around the world.", sort_order: 1, image_url: "/images/categories/natural-veneers.png" },
  { name: "Exotic", slug: "exotic-veneers", description: "Rare and specialty exotic wood veneers.", sort_order: 2, image_url: "/images/categories/exotic-veneers.png" },
  { name: "Dyed / Coloured", slug: "coloured-veneers", description: "Pre-finished coloured and dyed veneers.", sort_order: 3, image_url: "/images/categories/coloured-veneers.png" },
  { name: "Textured", slug: "textured-veneers", description: "Rough cut, torched, weathered and 3D textured surfaces.", sort_order: 4, image_url: "/images/categories/textured-veneers.png" },
  { name: "Smoked / Fumed / Specialty", slug: "specialty-series", description: "Smoked, fumed, metallic and specialty surface treatments.", sort_order: 5, image_url: "/images/categories/specialty-series.png" },
  { name: "Premium / Limited Collections", slug: "premium-collections", description: "Premium fan decks, bespoke marquetry and limited artisanal surfaces.", sort_order: 6, image_url: "/images/categories/premium-collections.png" },
  { name: "Fluted", slug: "fluted-veneers", description: "Veneer-based fluted and grooved panels.", sort_order: 7, image_url: "/images/categories/fluted-veneers.png" }
];

// ---- Spec builder from each brochure's common_technical_details --------------
function specsFromCommon(common: Record<string, any> | undefined): { spec_name: string; spec_value: string }[] {
  if (!common) return [];
  const labels: Record<string, string> = {
    wood_veneer_specie: "Wood Veneer Specie",
    wood_veneer_layer: "Wood Veneer Layer",
    top_layer: "Top Layer",
    veneer_layer: "Veneer Layer",
    base: "Base",
    balancer: "Balancer",
    weight_per_panel: "Weight (per panel)",
    finish: "Finish",
    flexibility: "Flexibility"
  };
  const specs: { spec_name: string; spec_value: string }[] = [];
  for (const [key, label] of Object.entries(labels)) {
    const v = common[key];
    if (typeof v === "string" && v.trim()) specs.push({ spec_name: label, spec_value: v });
  }
  // panel size(s)
  const sizes: string[] = common.panel_sizes ?? (common.panel_size ? [common.panel_size] : []);
  if (sizes.length) specs.push({ spec_name: "Panel Size", spec_value: sizes.join(", ") });
  return specs;
}

// ---- Assemble the collections + products from the JSON files -----------------
type ProductRow = {
  sku: string;
  name: string;
  short_description: string;
  color_tone: string;
};

type CollectionPlan = {
  name: string;
  slug: string;
  category_slug: string;
  tagline: string;
  description: string;
  specs: { spec_name: string; spec_value: string }[];
  finish: string | null;
  base_material: string | null;
  size: string | null;
  thickness: string | null;
  products: ProductRow[];
};

function buildPlan(): CollectionPlan[] {
  const v2 = readJson("veneer_2_products.json");
  const v3 = readJson("veneer_3_products.json");
  const v4 = readJson("veneer_4_products.json");
  const v5 = readJson("veneer_5_products.json");
  const v6 = readJson("veneer_6_products.json");
  const v7 = readJson("veneer_7_products.json");
  const v8 = readJson("veneer_8_products.json");
  const v9 = readJson("veneer_9_products.json");
  const v10 = readJson("veneer_10_products.json");
  const v11 = readJson("veneer_11_products.json");
  const v12 = readJson("veneer_12_products.json");
  const v13 = readJson("veneer_13_products.json");
  const v14 = readJson("veneer_14_products.json");
  // v15 (Furrow Panels) fully overlaps v9 by C-code (new_codes_vs_veneer_9 = []),
  // so it adds no new products — it is already covered by the Furrow collection.
  const v16 = readJson("veneer_16_products.json");
  const v17 = readJson("veneer_17_products.json");
  const v18 = readJson("veneer_18_products.json");
  const v19 = readJson("veneer_19_products.json");
  const v20 = readJson("veneer_20_products.json");
  const v21 = readJson("veneer_21_products.json");

  const firstSize = (c: any): string | null => {
    const sizes: string[] = c?.panel_sizes ?? (c?.panel_size ? [c.panel_size] : []);
    return sizes[0] ?? null;
  };
  const thickness = (c: any): string | null =>
    c?.top_layer ?? c?.veneer_layer ?? c?.wood_veneer_layer ?? null;

  const plans: CollectionPlan[] = [];

  // --- veneer_2: Barcode (Fluted) ---
  {
    const c = v2.common_technical_details ?? {};
    plans.push({
      name: "Barcode — Veneered Flute Panels",
      slug: "barcode",
      category_slug: "fluted-veneers",
      tagline: v2.product_line_tagline ?? "Veneered Flute Panels",
      description: v2.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Fine Sanded",
      base_material: c.base ?? null,
      size: firstSize(c),
      thickness: thickness(c),
      products: (v2.products ?? []).map((p: any) => ({
        sku: `BARCODE-${p.code}`,
        name: `Barcode ${p.code}`,
        short_description: [p.pattern, p.veneer].filter(Boolean).join(" — "),
        color_tone: "Natural"
      }))
    });
  }

  // --- veneer_3: Chroma Bunito (Textured) ---
  {
    const c = v3.common_technical_details ?? {};
    plans.push({
      name: "Chroma Bunito — Textured Panels",
      slug: "chroma-bunito",
      category_slug: "textured-veneers",
      tagline: v3.product_line_tagline ?? "Textures + Shades = Futuristic",
      description: v3.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Pre Finished",
      base_material: c.base ?? null,
      size: firstSize(c),
      thickness: thickness(c),
      products: (v3.products ?? []).map((p: any) => ({
        sku: `BUNITO-${slugify(p.design).toUpperCase()}`,
        name: `Chroma Bunito ${p.design}`,
        short_description: p.texture ?? "",
        color_tone: "Coloured"
      }))
    });
  }

  // --- veneer_4 + veneer_5 merged: Chroma Composite (Coloured/Fluted) ---
  {
    const c = v4.common_technical_details ?? {};
    const merged = [...(v4.products ?? [])];
    const known = new Set(merged.map((p: any) => p.code));
    for (const p of v5.new_products_vs_veneer_4 ?? []) {
      if (!known.has(p.code)) {
        merged.push(p);
        known.add(p.code);
      }
    }
    plans.push({
      name: "Chroma Composite — Pre-Finished Fluted Panels",
      slug: "chroma-composite",
      category_slug: "coloured-veneers",
      tagline: v4.product_line_tagline ?? "Pre-Finished Fluted Panels",
      description: v4.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Pre-Finished",
      base_material: c.base ?? null,
      size: firstSize(c),
      thickness: thickness(c),
      products: merged.map((p: any) => ({
        sku: `CHROMACOMP-${p.code}`,
        name: `Chroma Composite ${p.code}`,
        short_description: p.texture ?? "",
        color_tone: "Coloured"
      }))
    });
  }

  // --- veneer_6: Karnav Designer Panels (Textured) ---
  {
    const c = v6.common_technical_details ?? {};
    plans.push({
      name: "Karnav — Designer Veneer Panels",
      slug: "karnav-designer-panels",
      category_slug: "textured-veneers",
      tagline: v6.product_line_tagline ?? "Textured & Fluted Designer Surfaces",
      description: v6.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? null,
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (v6.products ?? []).map((p: any) => ({
        sku: `KARNAV-${slugify(p.name).toUpperCase()}`,
        name: `Karnav ${p.name}`,
        short_description: p.texture ?? "",
        color_tone: "Natural"
      }))
    });
  }

  // --- veneer_7: LegnöLuxé Deep Textured & Fluted Real Wood (Textured) ---
  {
    const c = v7.common_technical_details ?? {};
    plans.push({
      name: "LegnöLuxé — Deep Textured & Fluted Real Wood",
      slug: "legnoluxe",
      category_slug: "textured-veneers",
      tagline: v7.product_line_tagline ?? "The World's Most Premium Wood Surfaces",
      description: v7.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? null,
      base_material: c.base ?? null,
      size: firstSize(c),
      thickness: c.total_thickness ?? null,
      products: (v7.products ?? []).map((p: any) => ({
        sku: `LEGNO-${slugify(p.name).toUpperCase()}`,
        name: `LegnöLuxé ${p.name}`,
        short_description: [p.texture, p.depth ? `${p.depth} depth` : null].filter(Boolean).join(" — "),
        color_tone: "Natural"
      }))
    });
  }

  // --- veneer_8: Dyed (Turakhia) (Coloured) ---
  {
    const c = v8.common_technical_details ?? {};
    plans.push({
      name: "Dyed Veneers",
      slug: "dyed-veneers-turakhia",
      category_slug: "coloured-veneers",
      tagline: v8.product_line_tagline ?? "Perfect Blend of Traditional Process and Modern Shades",
      description: v8.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Fine Sanding",
      base_material: null,
      size: firstSize(c),
      thickness: c.face_thickness ?? null,
      products: (v8.products ?? []).map((p: any) => ({
        sku: `DYED-${slugify(p.name).toUpperCase()}`,
        name: p.name,
        short_description: [p.species, p.shade_code ? `shade ${p.shade_code}` : null].filter(Boolean).join(" — "),
        color_tone: "Dyed"
      }))
    });
  }

  // --- veneer_9 + veneer_10 merged: Furrow — Finest Hybrid Flutes (Fluted) ---
  {
    const c = v9.common_technical_details ?? {};
    const merged = [...(v9.products ?? [])];
    const known = new Set(merged.map((p: any) => p.code));
    for (const p of v10.new_products_vs_veneer_9 ?? []) {
      if (!known.has(p.code)) {
        merged.push(p);
        known.add(p.code);
      }
    }
    plans.push({
      name: "Furrow — Finest Hybrid Flutes",
      slug: "furrow-finest-hybrid-flutes",
      category_slug: "fluted-veneers",
      tagline: v9.product_line_tagline ?? "Finest Hybrid Flutes",
      description: v9.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Raw (Pre-Finished on request)",
      base_material: c.base ?? null,
      size: firstSize(c),
      thickness: c.veneer_layer ?? null,
      products: merged.map((p: any) => ({
        sku: `FURROW-${p.code}`,
        name: `Furrow ${p.code}`,
        short_description: p.texture ?? (p.shade_shown ? `Shade ${p.shade_shown}` : "Recon-wood fluted panel"),
        color_tone: "Natural"
      }))
    });
  }

  // --- veneer_11: Splendor — The Grande (Coloured) ---
  {
    const c = v11.common_technical_details ?? {};
    plans.push({
      name: "Splendor — The Grande",
      slug: "splendor-the-grande",
      category_slug: "coloured-veneers",
      tagline: v11.product_line_tagline ?? "Infinite Surface Solution",
      description: v11.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Bleached & Dyed",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (v11.products ?? []).map((p: any) => ({
        sku: `SPLENDOR-${p.code}`,
        name: `Splendor ${p.code}`,
        short_description: `${p.range ?? "The Grande"} — dyed decorative veneer (code ${p.code})`,
        color_tone: "Dyed"
      }))
    });
  }

  // --- veneer_12: Splendor — Shadow (ombré dyed) (Coloured) ---
  {
    const c = v12.common_technical_details ?? {};
    plans.push({
      name: "Splendor — Shadow (Ombré Dyed)",
      slug: "splendor-shadow-ombre",
      category_slug: "coloured-veneers",
      tagline: v12.product_line_tagline ?? "Gradient dyed veneer surfaces",
      description: v12.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Bleached & Dyed (gradient)",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (v12.products ?? []).map((p: any) => ({
        sku: `SPLENDOR-${p.code}`,
        name: `Splendor ${p.code}`,
        short_description: [p.colourway, p.texture].filter(Boolean).join(" — "),
        color_tone: "Dyed"
      }))
    });
  }

  // --- veneer_13: Citiply Natural Veneers master catalogue ---
  // 279 species fanned into per-series collections, each mapped to an existing category.
  {
    const seriesToCategory: Record<string, string> = v13.series_to_category ?? {};
    const seriesMeta: Record<string, { name: string; slug: string; tagline: string }> = {
      "Evergreen": { name: "Evergreen", slug: "citiply-evergreen", tagline: "Timeless classics. 100% natural." },
      "Heritage (Burl & Pomelle)": { name: "Heritage — Burl & Pomelle", slug: "citiply-heritage", tagline: "Unique and rare grain patterns." },
      "Strokes (Figured)": { name: "Strokes — Figured", slug: "citiply-strokes", tagline: "Wavy grains, 3D look." },
      "Crotch": { name: "Crotch", slug: "citiply-crotch", tagline: "Rare flame-pattern character." },
      "Fier'O (Smoked/Fumed)": { name: "Fier'O — Smoked / Fumed", slug: "citiply-fiero", tagline: "Widest fumed range across the globe." },
      "Rough Cut": { name: "Rough Cut", slug: "citiply-rough-cut", tagline: "Eco-friendly sawn-lumber aesthetics." },
      "Volcano": { name: "Volcano", slug: "citiply-volcano", tagline: "Diagonal 3D texture." },
      "Open Grain": { name: "Open Grain", slug: "citiply-open-grain", tagline: "Distressed wood look, greater feel." },
      "Metallico": { name: "Metallico", slug: "citiply-metallico", tagline: "Metallic grain highlight." },
      "Weathered": { name: "Weathered", slug: "citiply-weathered", tagline: "Sophisticated palette of aged timber." },
      "Prism (Dyed)": { name: "Prism — Dyed", slug: "citiply-prism", tagline: "European benchmark dyed veneers." },
      "Pro Collection": { name: "Pro Collection", slug: "citiply-pro", tagline: "1mm & 2mm thicker veneers." },
      "Feel Next (Textured)": { name: "Feel Next — Textured", slug: "citiply-feel-next", tagline: "Non-repeatable natural textures." },
      "Exotic Highlights": { name: "Exotic Highlights", slug: "citiply-exotic-highlights", tagline: "Rarest one-of-a-kind characters." }
    };
    const bySeries: Record<string, any[]> = {};
    for (const p of v13.products ?? []) {
      (bySeries[p.series] ??= []).push(p);
    }
    for (const [series, items] of Object.entries(bySeries)) {
      const meta = seriesMeta[series];
      const categorySlug = seriesToCategory[series];
      if (!meta || !categorySlug) continue;
      plans.push({
        name: `Citiply ${meta.name}`,
        slug: meta.slug,
        category_slug: categorySlug,
        tagline: meta.tagline,
        description: v13.description ?? "",
        specs: [{ spec_name: "Available Bases", spec_value: "Gurjan, Hardwood, Fleece, MDF" }],
        finish: null,
        base_material: "Gurjan / Hardwood / Fleece / MDF",
        size: null,
        thickness: null,
        products: items.map((p: any) => {
          const specs: string[] = [];
          if (p.botanical_name) specs.push(p.botanical_name);
          if (p.origin) specs.push(`Origin: ${p.origin}`);
          if (p.density_kg_m3) specs.push(`Density ${p.density_kg_m3} kg/m³`);
          return {
            sku: `CITIPLY-${slugify(series).toUpperCase().slice(0, 6)}-${slugify(p.name).toUpperCase()}`,
            name: p.name,
            short_description: specs.join(" · ") || `${meta.name} natural veneer.`,
            color_tone: series === "Prism (Dyed)" ? "Dyed" : "Natural"
          };
        })
      });
    }
  }

  // --- veneer_14: Turakhia FC4 — Premium Veneer Fan Deck (Premium) ---
  // 184 species across 9 series in a single fan deck. Kept as one premium
  // collection; series is surfaced in each product's description. Species overlap
  // veneer_13 by name but SKUs are FC4-prefixed so there is no collision.
  {
    const c = v14.common_technical_details ?? {};
    plans.push({
      name: "Turakhia FC4 — Premium Veneer Fan Deck",
      slug: "turakhia-fc4-fan-deck",
      category_slug: "premium-collections",
      tagline: v14.product_line_tagline ?? "Premium natural veneer fan deck",
      description: v14.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? null,
      base_material: c.base ?? null,
      size: firstSize(c),
      thickness: thickness(c),
      products: (v14.products ?? []).map((p: any) => ({
        sku: `FC4-${slugify(p.name).toUpperCase()}`,
        name: `${p.name} (FC4)`,
        short_description: p.series ? `${p.series} series` : "Premium natural veneer.",
        color_tone: /torched|weathered|faded/i.test(p.series ?? "") ? "Smoked" : "Natural"
      }))
    });
  }

  // --- veneer_16: Furrow Vivid — Solid Dyed Flutes (Coloured) ---
  // Dyed variant of the Furrow flutes; distinct SKUs (design code + shade code).
  {
    const c = v16.common_technical_details ?? {};
    plans.push({
      name: "Furrow Vivid — Solid Dyed Flutes",
      slug: "furrow-vivid-dyed-flutes",
      category_slug: "coloured-veneers",
      tagline: v16.product_line_tagline ?? "Solid Dyed Flutes",
      description: v16.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Dyed (Pre-Finished on request)",
      base_material: null,
      size: firstSize(c),
      thickness: null,
      products: (v16.products ?? []).map((p: any) => ({
        sku: `FURROWVIVID-${p.code}-${slugify(p.shade_code ?? p.shade ?? "dyed").toUpperCase()}`,
        name: `Furrow Vivid ${p.design} — ${p.shade}`,
        short_description: `Dyed Furrow flute (${p.design}) in ${p.shade}`,
        color_tone: "Dyed"
      }))
    });
  }

  // --- veneer_17: Marquetry Veneers — bespoke handmade art (Premium) ---
  // Made-to-order marquetry/parquetry; products are representative design themes.
  {
    const c = v17.common_technical_details ?? {};
    plans.push({
      name: "Marquetry Veneers",
      slug: "marquetry-veneers",
      category_slug: "premium-collections",
      tagline: v17.product_line_tagline ?? "Handmade decorative wood inlay art",
      description: v17.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Made to order",
      base_material: null,
      size: null,
      thickness: null,
      products: (v17.products ?? []).map((p: any) => ({
        sku: `MARQUETRY-${p.code}`,
        name: `Marquetry — ${p.design}`,
        short_description: [p.theme ? `${p.theme} theme` : null, p.description].filter(Boolean).join(" — "),
        color_tone: "Natural"
      }))
    });
  }

  // --- veneer_18: Mattle — metal-coated veneer panels (Specialty) ---
  {
    const c = v18.common_technical_details ?? {};
    plans.push({
      name: "Mattle — Metal Coated Veneers",
      slug: "mattle-metal-coated-veneers",
      category_slug: "specialty-series",
      tagline: v18.product_line_tagline ?? "Real Metal + Natural Veneer Grains",
      description: v18.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Pre-Finished with Liquid Metal",
      base_material: c.base ?? "Plywood",
      size: firstSize(c),
      thickness: c.veneer_layer ?? null,
      products: (v18.products ?? []).map((p: any) => ({
        sku: `MATTLE-${p.code}`,
        name: `Mattle ${p.code}`,
        short_description: p.shade ?? "Metal-coated veneer panel",
        color_tone: "Metallic"
      }))
    });
  }

  // --- veneer_19: Prism — Dyed Veneer Palette (Coloured) ---
  // Dedicated Prism catalogue with specific shade codes (Ash-7030, Oak-7045...).
  // Distinct from veneer_13's by-species Prism entries; PRISM-<code> SKUs don't collide.
  {
    const c = v19.common_technical_details ?? {};
    plans.push({
      name: "Prism — Dyed Veneer Palette",
      slug: "prism-dyed-veneer-palette",
      category_slug: "coloured-veneers",
      tagline: v19.product_line_tagline ?? "Dyed Veneer Palette",
      description: v19.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Dyed",
      base_material: c.base ?? null,
      size: firstSize(c),
      thickness: c.veneer_layer ?? null,
      products: (v19.products ?? []).map((p: any) => ({
        sku: `PRISM-${slugify(p.code).toUpperCase()}`,
        name: `Prism ${p.code}`,
        short_description: p.species ? `${p.species} — dyed veneer` : "Dyed veneer",
        color_tone: "Dyed"
      }))
    });
  }

  // --- veneer_20: Reganto — Deziner Collection (Textured) ---
  {
    const c = v20.common_technical_details ?? {};
    plans.push({
      name: "Reganto — Deziner Collection",
      slug: "reganto-deziner-collection",
      category_slug: "textured-veneers",
      tagline: v20.product_line_tagline ?? "Artistic & New Age Veneers",
      description: v20.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Fine Sanded",
      base_material: c.base ?? "Imported Gurjan Ply",
      size: firstSize(c),
      thickness: c.veneer_layer ?? null,
      products: (v20.products ?? []).map((p: any) => ({
        sku: `REGANTO-${p.code}`,
        name: `Reganto ${p.code}`,
        short_description: [p.series, p.size].filter(Boolean).join(" — "),
        color_tone: "Natural"
      }))
    });
  }

  // --- veneer_21: Reganto — Premier Collection (Fluted) ---
  {
    const c = v21.common_technical_details ?? {};
    plans.push({
      name: "Reganto — Premier Collection",
      slug: "reganto-premier-collection",
      category_slug: "fluted-veneers",
      tagline: v21.product_line_tagline ?? "Artistic & New Age Veneers",
      description: v21.description ?? "",
      specs: specsFromCommon(c),
      finish: c.finish ?? "Fine Sanded",
      base_material: c.base ?? "MR Grade",
      size: firstSize(c),
      thickness: c.veneer_layer ?? null,
      products: (v21.products ?? []).map((p: any) => ({
        sku: `REGANTOPREM-${slugify(p.code).toUpperCase()}`,
        name: `Reganto ${p.name}`,
        short_description: "Premier Collection 5MM fluted / hybrid veneer",
        color_tone: "Natural"
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

  // 1. Ensure the veneers catalogue exists and grab its id.
  const { data: cat, error: catErr } = await supabase
    .from("catalogues")
    .upsert(
      { name: "Veneers", slug: CATALOGUE_SLUG, description: "Natural, exotic, dyed, and textured wood veneers for refined surfaces.", sort_order: 1, is_active: true },
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
            size: plan.size,
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
