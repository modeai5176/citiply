/**
 * retire-fc4-legacy.ts
 *
 * The FC4 fan deck was imported twice: once complete and flat, and once split
 * into page-ordered partial collections scattered across categories. Now that
 * every FC4 species is filed into a family collection WITH a swatch image, the
 * partial copies are redundant.
 *
 * This deactivates them (is_active = false, reversible) — but only reports, and
 * refuses to touch, any product in them that has NO FC4 equivalent, so nothing
 * unique is hidden by accident.
 *
 *   dotenv -e .env -- npx tsx scripts/retire-fc4-legacy.ts            # dry run
 *   dotenv -e .env -- npx tsx scripts/retire-fc4-legacy.ts --apply
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

const LEGACY = ["weathered", "roughcut", "torched", "volcano", "burl", "metallico", "faded", "thunder"];

const catalogue = JSON.parse(
  readFileSync(join(process.cwd(), "scripts", "fc4-catalogue.json"), "utf8")
) as { series: Record<string, { pages: Record<string, number> }> };

const norm = (s: string) =>
  s.replace(/\s*\(FC4\)\s*$/i, "").toLowerCase().replace(/mm/g, "m").replace(/[^a-z]/g, "");

async function main() {
  const mode = APPLY ? "APPLY" : "DRY RUN";
  console.log(`=== retire-fc4-legacy (${mode}) ===\n`);

  // every species name printed anywhere in the fan deck
  const fc4Keys = new Set<string>();
  for (const s of Object.values(catalogue.series)) {
    for (const n of Object.keys(s.pages)) fc4Keys.add(norm(n));
  }
  fc4Keys.add(norm("Exotic Rough White Oak")); // seeded name for the p187 alias

  let retired = 0;
  const orphans: string[] = [];

  for (const slug of LEGACY) {
    const { data: col } = await db.from("collections")
      .select("id, is_active, category_id").eq("slug", slug).maybeSingle();
    if (!col) { console.log(`  ${slug.padEnd(12)} not found`); continue; }

    const { data: prods } = await db.from("products").select("sku, name").eq("collection_id", col.id);
    const unique = (prods ?? []).filter((p) => !fc4Keys.has(norm(p.name)));

    const { data: cat } = await db.from("categories").select("slug").eq("id", col.category_id).maybeSingle();
    console.log(`  ${slug.padEnd(12)} ${String(prods?.length).padStart(3)} products  ` +
                `${(prods!.length - unique.length)} covered by FC4, ${unique.length} NOT covered  [${cat?.slug}]`);

    for (const u of unique) {
      console.log(`      unique: ${u.sku.padEnd(14)} ${u.name}`);
      orphans.push(`${slug}/${u.sku} ${u.name}`);
    }

    if (unique.length) {
      console.log(`      -> SKIPPED, would hide ${unique.length} product(s) with no FC4 equivalent`);
      continue;
    }
    if (String(col.is_active) === "false") { console.log(`      already inactive`); continue; }

    if (APPLY) {
      const { error } = await db.from("collections").update({ is_active: false }).eq("id", col.id);
      if (error) throw error;
      console.log(`      DEACTIVATED`);
    } else {
      console.log(`      would deactivate`);
    }
    retired++;
  }

  console.log(`\ncollections ${APPLY ? "retired" : "to retire"}: ${retired}`);
  if (orphans.length) {
    console.log(`products with no FC4 equivalent (left visible): ${orphans.length}`);
    for (const o of orphans) console.log(`   ${o}`);
  }
  console.log(`\n=== ${mode} complete ===`);
  if (!APPLY) console.log("re-run with --apply to write.");
}

main().catch((e) => { console.error(e); process.exit(1); });
