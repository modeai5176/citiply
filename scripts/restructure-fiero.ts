/**
 * restructure-fiero.ts
 *
 * Brings the FC4 Fiero series into the Exotic category as a proper 3-tier tree,
 * mirroring scripts/restructure-evergreen.ts:
 *
 *     Veneers (catalogue)
 *       └─ Exotic (category, already exists)
 *            └─ species family (collection)   <- new, 9 of them
 *                 └─ veneer (product)          <- the 40 existing FC4-* products, moved
 *
 * Source of truth: "Fandeck Naturals Turakhia FC4.pdf", Fiero section
 * (divider p74, swatches pp76-115 = 40 species). All 40 already exist in the DB
 * inside `turakhia-fc4-fan-deck`; this MOVES them rather than making a copy.
 *
 * Their short_description in the DB mislabels them: 25 say
 * "Strokes/Figured+Exotic" and 15 say "Weathered", neither of which is a real
 * FC4 series for these items. This script corrects it to "Fiero series".
 *
 * Grouping: species sharing a wood name are grouped by name (Oak, Patternwood,
 * Kossipo, Bog, Robusta, Laurel). The remaining 25 one-offs are split by tone
 * measured off the swatches themselves. Fiero is a smoked/fumed series so it
 * sits far darker than Evergreen - bands are cut at luminance 72 and 100 here,
 * not 95/150.
 *
 * Products are resolved by NAME, not by hardcoded SKU, because the seeded SKUs
 * drop a letter on some names (e.g. "Pommele" becomes POMELE).
 *
 * Idempotent and additive. Nothing is deleted - the superseded partial `fiero`
 * collection is deactivated, which is reversible with a single flag.
 *
 * Dry run (default):  dotenv -e .env -- npx tsx scripts/restructure-fiero.ts
 * Apply:              dotenv -e .env -- npx tsx scripts/restructure-fiero.ts --apply
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const APPLY = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

const db = createClient(url, key, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

const CATEGORY_SLUG = "exotic-veneers";
const SERIES_LABEL = "Fiero series";

const FAMILIES: { name: string; slug: string; tagline: string; species: string[] }[] = [
  { name: "Oak", slug: "fiero-oak", tagline: "Fumed oak, from ebony-dark to tan.",
    species: ["Exotic Ebony Oak", "Bugged Oak", "Exotic Bugged Oak", "Tan Oak"] },
  { name: "Patternwood", slug: "fiero-patternwood", tagline: "Figured, pommele and golden.",
    species: ["Patternwood Figured", "Patternwood Pommele", "Golden Patternwood"] },
  { name: "Kossipo", slug: "fiero-kossipo", tagline: "Plain and pomele figure.",
    species: ["Kossipo", "Kossipo Pomele"] },
  { name: "Bog", slug: "fiero-bog", tagline: "Bog-recovered timber, pale and mineral.",
    species: ["Bog Elm", "Bog Ash"] },
  { name: "Robusta", slug: "fiero-robusta", tagline: "Natural and thermo-treated.",
    species: ["Robusta", "Thermo Robusta"] },
  { name: "Laurel", slug: "fiero-laurel", tagline: "Mexican and brown laurel.",
    species: ["Mexican Laurel", "Brown Laurel"] },

  { name: "Deep Smoked", slug: "fiero-deep-smoked",
    tagline: "The darkest of the fumed range. Measured swatch luminance below 72.",
    species: ["Thinwin", "Sassafras", "Bolivian", "Laura Petro", "Barwood", "Saddle Tree",
              "Jamire", "Coffeebin", "Cocobolo", "Cottonwood", "Sasswood", "Blackwood", "Koa"] },
  { name: "Mid Smoked", slug: "fiero-mid-smoked",
    tagline: "Mid browns with visible grain. Measured swatch luminance 72-100.",
    species: ["Izombe", "Yewwood", "Pearwood", "Teatree", "Rainwood", "Sapgum", "Raintree", "Zitrone"] },
  { name: "Amber & Light", slug: "fiero-amber-light",
    tagline: "The lightest fumed hues. Measured swatch luminance above 100.",
    species: ["Black Alder", "Ironwood", "Arc", "Winewood"] }
];

/** tolerate "Pomele"/"Pommele" drift and the "(FC4)" suffix */
const norm = (s: string) =>
  s.replace(/\s*\(FC4\)\s*$/i, "").toLowerCase().replace(/mm/g, "m").replace(/[^a-z]/g, "");

async function main() {
  const mode = APPLY ? "APPLY" : "DRY RUN";
  console.log(`=== restructure-fiero (${mode}) ===\n`);

  const all = FAMILIES.flatMap((f) => f.species);
  const dupes = all.filter((s, i) => all.indexOf(s) !== i);
  if (dupes.length) throw new Error("species listed twice: " + dupes.join(", "));
  if (all.length !== 40) throw new Error(`expected 40 species, got ${all.length}`);

  const { data: category } = await db.from("categories")
    .select("id, name, is_active").eq("slug", CATEGORY_SLUG).maybeSingle();
  if (!category) throw new Error(`category '${CATEGORY_SLUG}' not found`);
  console.log(`category: ${category.name} (${CATEGORY_SLUG}) active=${category.is_active}`);

  const { data: fanDeck } = await db.from("collections")
    .select("id").eq("slug", "turakhia-fc4-fan-deck").maybeSingle();
  if (!fanDeck) throw new Error("turakhia-fc4-fan-deck not found");

  const { data: candidates } = await db.from("products")
    .select("id, sku, name, collection_id, category_id, short_description")
    .eq("collection_id", fanDeck.id);
  const byName = new Map((candidates ?? []).map((p) => [norm(p.name), p]));
  const missing = all.filter((s) => !byName.has(norm(s)));
  if (missing.length) throw new Error(`not found in the fan deck:\n  ${missing.join("\n  ")}`);
  console.log(`resolved all 40 FC4 Fiero products in the fan deck\n`);

  for (const fam of FAMILIES) {
    let collectionId: string | null = null;
    const { data: existing } = await db.from("collections")
      .select("id").eq("slug", fam.slug).maybeSingle();

    if (existing) {
      collectionId = existing.id;
    } else if (APPLY) {
      const { data, error } = await db.from("collections").insert({
        category_id: category.id,
        name: fam.name,
        slug: fam.slug,
        tagline: fam.tagline,
        description: `${fam.name} veneers from the Turakhia FC4 Fiero series - premium smoked and fumed species.`,
        is_active: true,
        is_featured: false
      }).select("id").single();
      if (error) throw error;
      collectionId = data.id;
    }

    const verb = existing ? "exists " : APPLY ? "CREATED" : "would create";
    console.log(`  ${fam.slug.padEnd(24)} ${verb}  ${fam.species.length} products`);

    for (const speciesName of fam.species) {
      const p = byName.get(norm(speciesName))!;
      if (collectionId && p.collection_id === collectionId) {
        console.log(`      ${p.sku.padEnd(30)} already in place`);
        continue;
      }
      if (APPLY) {
        const { error } = await db.from("products")
          .update({ collection_id: collectionId, category_id: category.id, short_description: SERIES_LABEL })
          .eq("id", p.id);
        if (error) throw error;
        console.log(`      ${p.sku.padEnd(30)} moved`);
      } else {
        console.log(`      ${p.sku.padEnd(30)} would move  [${p.short_description}]`);
      }
    }
  }

  const { data: old } = await db.from("collections")
    .select("id, is_active").eq("slug", "fiero").maybeSingle();
  console.log("");
  if (!old) {
    console.log("retire    fiero                    not found, skipping");
  } else if (old.is_active === false) {
    console.log("retire    fiero                    already inactive");
  } else if (APPLY) {
    const { error } = await db.from("collections").update({ is_active: false }).eq("id", old.id);
    if (error) throw error;
    console.log("retire    fiero                    DEACTIVATED  (partial 25/40 copy, FIER-*)");
  } else {
    console.log("retire    fiero                    would deactivate  (partial 25/40 copy, FIER-*)");
  }

  console.log(`\n=== ${mode} complete ===`);
  if (!APPLY) console.log("re-run with --apply to write.");
}

main().catch((e) => { console.error(e); process.exit(1); });
