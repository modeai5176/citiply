/**
 * restructure-evergreen.ts
 *
 * Pilot restructure of the Evergreen series into a proper 3-tier tree:
 *
 *     Veneers (catalogue)
 *       └─ Evergreen (category)                    <- new
 *            └─ species family (collection)        <- new, 14 of them
 *                 └─ veneer (product)              <- the 52 existing FC4-* products, moved
 *
 * Source of truth: "Fandeck Naturals Turakhia FC4.pdf", Evergreen section
 * (divider p20, swatches pp22-73 = 52 species). The 52 products already exist
 * in the DB inside `turakhia-fc4-fan-deck`; this script MOVES them rather than
 * creating a fourth duplicate copy of the same data.
 *
 * Family assignment: species that share a wood name are grouped by name
 * (Walnut, Oak, Teak...). The remaining 29 one-off species are grouped into
 * three tone bands measured directly off the fan deck swatches (average
 * luminance of each swatch image), not guessed.
 *
 * Idempotent and additive. Nothing is deleted — the two superseded collections
 * are deactivated (is_active=false), which is reversible with a single flag.
 *
 * Dry run (default):  dotenv -e .env -- npx tsx scripts/restructure-evergreen.ts
 * Apply:              dotenv -e .env -- npx tsx scripts/restructure-evergreen.ts --apply
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

const CATALOGUE_SLUG = "veneers";
const CATEGORY = {
  name: "Evergreen",
  slug: "evergreen",
  description:
    "Evergreen series of veneers are the species which have gained popularity and acceptance " +
    "amongst masses over a long period of time. These species such as teak, walnut, rosewood, " +
    "ebony etc are classics and never go out of trend. And now with these species being available " +
    "in the popular \"panello\" pattern, a new life has been breathed into these timeless classics.",
  sort_order: 1
};

/** name → { tagline, skus }. SKUs are the existing FC4-* products. */
const FAMILIES: { name: string; slug: string; tagline: string; skus: string[] }[] = [
  { name: "Walnut", slug: "evergreen-walnut", tagline: "Three continents, one classic.",
    skus: ["FC4-AMERICAN-WALNUT", "FC4-INDIAN-WALNUT", "FC4-EUROPEAN-WALNUT"] },
  { name: "Oak", slug: "evergreen-oak", tagline: "The architectural default.",
    skus: ["FC4-WHITE-OAK", "FC4-RED-OAK"] },
  { name: "Teak", slug: "evergreen-teak", tagline: "Burmese gold and spalted character.",
    skus: ["FC4-BURMESE-TEAK", "FC4-SPALTED-TEAK"] },
  { name: "Rosewood", slug: "evergreen-rosewood", tagline: "Deep grain, deeper heritage.",
    skus: ["FC4-INDIAN-ROSEWOOD", "FC4-SANTOS-ROSEWOOD"] },
  { name: "Maple", slug: "evergreen-maple", tagline: "Pale, even, and quietly figured.",
    skus: ["FC4-AMERICAN-MAPLE", "FC4-BIRDS-EYE-MAPLE"] },
  { name: "Cherry", slug: "evergreen-cherry", tagline: "Warm reds that deepen with age.",
    skus: ["FC4-EUROPEAN-CHERRY", "FC4-AFRICAN-CHERRY"] },
  { name: "Cedar", slug: "evergreen-cedar", tagline: "Aromatic, soft-grained, distinctive.",
    skus: ["FC4-LEBANESE-CEDAR", "FC4-RED-CEDAR"] },
  { name: "Wenge", slug: "evergreen-wenge", tagline: "Near-black density, coarse open grain.",
    skus: ["FC4-WENGE", "FC4-GOLDEN-WENGE"] },
  { name: "Anigre", slug: "evergreen-anigre", tagline: "Creamy African hardwood, plain or figured.",
    skus: ["FC4-ANIGRE", "FC4-ANIGRE-FIGURED"] },
  { name: "Sapeli", slug: "evergreen-sapeli", tagline: "Ribbon stripe and pomele figure.",
    skus: ["FC4-SAPELI", "FC4-SAPELI-POMELE"] },
  { name: "Eucalyptus", slug: "evergreen-eucalyptus", tagline: "Figured and pommele character.",
    skus: ["FC4-EUCALYPTUS-FIGURED", "FC4-EUCALYPTUS-POMELE"] },

  // --- tone bands for the 29 one-off species (measured from the swatches) ---
  { name: "Dark Exotics", slug: "evergreen-dark-exotics",
    tagline: "Deep browns to near-black. Measured swatch luminance below 95.",
    skus: ["FC4-MACASSAR-EBONY", "FC4-PADAUK", "FC4-KEVASINGO", "FC4-ONTANO-ROSSO",
           "FC4-BLACK-GUM", "FC4-STONEWOOD", "FC4-IPE", "FC4-YEWTREE", "FC4-BOCOTE",
           "FC4-ZERICOATED", "FC4-BARBASCO", "FC4-SPILTED", "FC4-LACEWOOD"] },
  { name: "Warm Mid-Tones", slug: "evergreen-warm-mid-tones",
    tagline: "Amber through russet. Measured swatch luminance 95-150.",
    skus: ["FC4-SUCUPIRA", "FC4-CHESTNUT", "FC4-PLAINTREE", "FC4-ROSEHEART", "FC4-ZEBRANO",
           "FC4-RIVERTREE", "FC4-AFRICAN-MAHOGANY", "FC4-RIVERWOOD", "FC4-SASSNERO"] },
  { name: "Light & Blonde", slug: "evergreen-light-blonde",
    tagline: "Pale, bright and neutral. Measured swatch luminance above 150.",
    skus: ["FC4-ROSSO", "FC4-LARCH", "FC4-BEECH", "FC4-ASH", "FC4-HACKBERRY",
           "FC4-SYCAMORE", "FC4-POPLAR"] }
];

/** Superseded by the new tree; deactivated, not deleted. */
const RETIRE_COLLECTIONS = [
  { slug: "evergreen-series", why: "demo seed data (EVER-001..004 Teak/Walnut/Rosewood/Ebony)" },
  { slug: "founders-collection-4", why: "duplicate partial copy of FC4 Evergreen (FOUN-001..029)" }
];

function log(...a: unknown[]) {
  console.log(...a);
}

async function main() {
  const mode = APPLY ? "APPLY" : "DRY RUN";
  log(`=== restructure-evergreen (${mode}) ===\n`);

  // sanity: every SKU listed exactly once, and 52 of them
  const all = FAMILIES.flatMap((f) => f.skus);
  const dupes = all.filter((s, i) => all.indexOf(s) !== i);
  if (dupes.length) throw new Error("SKU listed twice: " + dupes.join(", "));
  if (all.length !== 52) throw new Error(`expected 52 SKUs, got ${all.length}`);

  // --- catalogue -------------------------------------------------------------
  const { data: catalogue, error: catErr } = await db
    .from("catalogues").select("id").eq("slug", CATALOGUE_SLUG).maybeSingle();
  if (catErr) throw catErr;
  if (!catalogue) throw new Error(`catalogue '${CATALOGUE_SLUG}' not found`);

  // --- the 52 source products ------------------------------------------------
  const { data: products, error: pErr } = await db
    .from("products").select("id, sku, name, collection_id, category_id").in("sku", all);
  if (pErr) throw pErr;
  const bySku = new Map((products ?? []).map((p) => [p.sku, p]));
  const missing = all.filter((s) => !bySku.has(s));
  if (missing.length) throw new Error(`missing products in DB:\n  ${missing.join("\n  ")}`);
  log(`resolved all 52 FC4 Evergreen products\n`);

  // --- category --------------------------------------------------------------
  let categoryId: string | null = null;
  const { data: existingCat } = await db
    .from("categories").select("id").eq("slug", CATEGORY.slug).maybeSingle();
  if (existingCat) {
    categoryId = existingCat.id;
    log(`category  ${CATEGORY.slug.padEnd(26)} exists`);
  } else if (APPLY) {
    const { data, error } = await db.from("categories")
      .insert({ ...CATEGORY, catalogue_id: catalogue.id, is_active: true })
      .select("id").single();
    if (error) throw error;
    categoryId = data.id;
    log(`category  ${CATEGORY.slug.padEnd(26)} CREATED`);
  } else {
    log(`category  ${CATEGORY.slug.padEnd(26)} would be CREATED`);
  }

  // --- collections + product moves -------------------------------------------
  log("");
  for (const fam of FAMILIES) {
    let collectionId: string | null = null;
    const { data: existing } = await db
      .from("collections").select("id").eq("slug", fam.slug).maybeSingle();

    if (existing) {
      collectionId = existing.id;
    } else if (APPLY) {
      const { data, error } = await db.from("collections").insert({
        category_id: categoryId,
        name: fam.name,
        slug: fam.slug,
        tagline: fam.tagline,
        description: `${fam.name} veneers from the Turakhia FC4 Evergreen series.`,
        is_active: true,
        is_featured: false
      }).select("id").single();
      if (error) throw error;
      collectionId = data.id;
    }

    const verb = existing ? "exists " : APPLY ? "CREATED" : "would create";
    log(`  ${fam.slug.padEnd(28)} ${verb}  ${fam.skus.length} products`);

    for (const sku of fam.skus) {
      const p = bySku.get(sku)!;
      const alreadyThere = collectionId && p.collection_id === collectionId;
      if (alreadyThere) {
        log(`      ${sku.padEnd(26)} already in place`);
        continue;
      }
      if (APPLY) {
        const { error } = await db.from("products")
          .update({ collection_id: collectionId, category_id: categoryId })
          .eq("id", p.id);
        if (error) throw error;
        log(`      ${sku.padEnd(26)} moved`);
      } else {
        log(`      ${sku.padEnd(26)} would move`);
      }
    }
  }

  // --- retire superseded collections -----------------------------------------
  log("");
  for (const r of RETIRE_COLLECTIONS) {
    const { data: col } = await db
      .from("collections").select("id, is_active").eq("slug", r.slug).maybeSingle();
    if (!col) { log(`retire    ${r.slug.padEnd(26)} not found, skipping`); continue; }
    if (col.is_active === false) { log(`retire    ${r.slug.padEnd(26)} already inactive`); continue; }
    if (APPLY) {
      const { error } = await db.from("collections").update({ is_active: false }).eq("id", col.id);
      if (error) throw error;
      log(`retire    ${r.slug.padEnd(26)} DEACTIVATED  (${r.why})`);
    } else {
      log(`retire    ${r.slug.padEnd(26)} would deactivate  (${r.why})`);
    }
  }

  log(`\n=== ${mode} complete ===`);
  if (!APPLY) log("re-run with --apply to write.");
}

main().catch((e) => { console.error(e); process.exit(1); });
