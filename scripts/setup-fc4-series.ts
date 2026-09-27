/**
 * setup-fc4-series.ts
 *
 * Generic version of restructure-evergreen.ts / restructure-fiero.ts: files any
 * FC4 fan deck series into its category as family collections, driven entirely
 * by scripts/fc4-catalogue.json (the source of truth read off the PDF).
 *
 *     Veneers (catalogue)
 *       └─ category            (textured / specialty / coloured ...)
 *            └─ family         (collection, from the JSON)
 *                 └─ veneer    (the existing FC4-* product, MOVED not copied)
 *
 * Products are resolved by NAME out of `turakhia-fc4-fan-deck`, because the
 * seeded SKUs drop a letter on some names (e.g. "Pommele" -> POMELE). The
 * fan deck's own `short_description` series labels are unreliable (several
 * series were mislabelled), so this rewrites them from the JSON.
 *
 * Also reports, but never touches, the older partial collections that cover the
 * same series so you can see the overlap before retiring anything.
 *
 * Idempotent and additive. Nothing is deleted.
 *
 *   dotenv -e .env -- npx tsx scripts/setup-fc4-series.ts                  # dry run, all series
 *   dotenv -e .env -- npx tsx scripts/setup-fc4-series.ts Weathered Burl   # dry run, some
 *   dotenv -e .env -- npx tsx scripts/setup-fc4-series.ts --apply          # write
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

type Family = { name: string; slug: string; tagline: string; species: string[] };
type Series = { category: string; page_range: [number, number]; count: number;
                pages: Record<string, number>; families: Family[] | null };

const catalogue = JSON.parse(
  readFileSync(join(process.cwd(), "scripts", "fc4-catalogue.json"), "utf8")
) as { series: Record<string, Series> };

/** tolerate "Pomele"/"Pommele" drift and the "(FC4)" suffix */
const norm = (s: string) =>
  s.replace(/\s*\(FC4\)\s*$/i, "").toLowerCase().replace(/mm/g, "m").replace(/[^a-z]/g, "");

/**
 * Known drift between the fan deck's printed label and the seeded product name.
 * p187 prints "Torched Exotic Rough White Oak"; the seed stored it without the
 * "Torched" prefix. Mapped explicitly rather than loosening the name matching.
 */
const ALIASES: Record<string, string> = {
  "Torched Exotic Rough White Oak": "Exotic Rough White Oak"
};

/** resolve a printed species name to the key used in the product lookup */
const key = (s: string) => norm(ALIASES[s] ?? s);

/** older partial imports of the same series, reported only */
const LEGACY: Record<string, string[]> = {
  Weathered: ["weathered"],
  Roughcut: ["roughcut"],
  Volcano: ["volcano"],
  Metallico: ["metallico", "torched"],
  Burl: ["burl"],
  Faded: ["faded"],
  Thunder: ["thunder"]
};

async function main() {
  const mode = APPLY ? "APPLY" : "DRY RUN";
  console.log(`=== setup-fc4-series (${mode}) ===\n`);

  const { data: fanDeck } = await db.from("collections")
    .select("id").eq("slug", "turakhia-fc4-fan-deck").maybeSingle();
  if (!fanDeck) throw new Error("turakhia-fc4-fan-deck not found");
  const { data: pool } = await db.from("products")
    .select("id, sku, name, collection_id, category_id").eq("collection_id", fanDeck.id);
  const byName = new Map((pool ?? []).map((p) => [norm(p.name), p]));

  let createdCols = 0;
  let movedProds = 0;

  for (const [seriesName, series] of Object.entries(catalogue.series)) {
    if (!series.families) continue;                       // already live
    if (ONLY.length && !ONLY.includes(seriesName)) continue;

    const { data: category } = await db.from("categories")
      .select("id, name, is_active").eq("slug", series.category).maybeSingle();
    if (!category) throw new Error(`category '${series.category}' not found`);

    console.log(`--- ${seriesName}  (${series.count} species, pp${series.page_range[0]}-${series.page_range[1]})  -> ${series.category}`);

    const unresolved = Object.keys(series.pages).filter((n) => !byName.has(key(n)));
    if (unresolved.length) {
      console.log(`    NOT IN FAN DECK (already moved or missing): ${unresolved.length}`);
      for (const u of unresolved) console.log(`      ${u}`);
    }

    for (const fam of series.families) {
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
          description: `${fam.name} veneers from the Turakhia FC4 ${seriesName} series.`,
          is_active: true,
          is_featured: false
        }).select("id").single();
        if (error) throw error;
        collectionId = data.id;
        createdCols++;
      } else {
        createdCols++;
      }

      const verb = existing ? "exists " : APPLY ? "CREATED" : "would create";
      const resolvable = fam.species.filter((s) => byName.has(key(s)));
      console.log(`    ${fam.slug.padEnd(24)} ${verb}  ${resolvable.length}/${fam.species.length} products`);

      for (const speciesName of resolvable) {
        const p = byName.get(key(speciesName))!;
        if (APPLY) {
          const { error } = await db.from("products").update({
            collection_id: collectionId,
            category_id: category.id,
            short_description: `${seriesName} series`
          }).eq("id", p.id);
          if (error) throw error;
        }
        movedProds++;
      }
    }

    // report the older partial collection(s) covering this series
    for (const slug of LEGACY[seriesName] ?? []) {
      const { data: old } = await db.from("collections")
        .select("id, is_active, category_id").eq("slug", slug).maybeSingle();
      if (!old) continue;
      const { data: oldProds } = await db.from("products").select("sku, name").eq("collection_id", old.id);
      const seriesKeys = new Set(Object.keys(series.pages).map(key));
      const overlap = (oldProds ?? []).filter((p) => seriesKeys.has(norm(p.name)));
      console.log(`    legacy '${slug}': ${oldProds?.length} products, ${overlap.length} share a name with FC4 ${seriesName}  (active=${old.is_active}) — left untouched`);
    }
    console.log("");
  }

  console.log(`collections ${APPLY ? "created" : "to create"}: ${createdCols}`);
  console.log(`products    ${APPLY ? "moved" : "to move"}   : ${movedProds}`);
  console.log(`\n=== ${mode} complete ===`);
  if (!APPLY) console.log("re-run with --apply to write.");
}

main().catch((e) => { console.error(e); process.exit(1); });
