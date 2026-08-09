/**
 * evergreen-name-search.ts — READ ONLY.
 *
 * For each name on the client's note, find EVERY veneer product in the whole
 * catalogue whose name contains it, and report which collection it sits in.
 * Answers "is this species missing, or just named differently / filed elsewhere?"
 *
 * Run: dotenv -e .env -- npx tsx scripts/evergreen-name-search.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

const TERMS = ["teak", "rosewood", "macassar", "wenge", "santos", "stonewood", "sucupira",
               "walnut", "anigre", "oak", "ash", "larch", "sapeli", "cherry", "mahogany"];

/** Only the ones where the client's generic name has no exact FC4 equivalent. */
const FOCUS = ["teak", "cherry", "mahogany", "santos", "macassar"];

async function main() {
  const { data: cat } = await db.from("catalogues").select("id").eq("slug", "veneers").maybeSingle();
  const { data: cats } = await db.from("categories").select("id, slug").eq("catalogue_id", cat!.id);
  const catIds = (cats ?? []).map((c) => c.id);

  const { data: cols } = await db.from("collections")
    .select("id, name, slug, is_active, category_id").in("category_id", catIds);
  const colById = new Map((cols ?? []).map((c) => [c.id, c]));

  const { data: prods } = await db.from("products")
    .select("sku, name, collection_id").in("collection_id", (cols ?? []).map((c) => c.id));

  console.log("=== exact-name availability for the client's generic terms ===\n");
  for (const term of FOCUS) {
    const hits = (prods ?? []).filter((p) => p.name.toLowerCase().includes(term));
    const exact = hits.filter((p) => {
      const n = p.name.replace(/\s*\(FC4\)$/, "").trim().toLowerCase();
      return n === term;
    });
    console.log(`  "${term}"  ->  ${hits.length} products contain it, ${exact.length} named exactly "${term}"`);
    const byCol: Record<string, string[]> = {};
    for (const h of hits) {
      const c = colById.get(h.collection_id)!;
      const k = `${c.slug}${c.is_active ? "" : " (inactive)"}`;
      (byCol[k] ??= []).push(h.name.replace(/\s*\(FC4\)$/, ""));
    }
    for (const [k, names] of Object.entries(byCol).sort()) {
      console.log(`       ${k.padEnd(30)} ${names.sort().join(", ")}`);
    }
    console.log("");
  }

  console.log("=== does the client's list match Citiply Evergreen (veneer_13) better than FC4? ===\n");
  const citi = (cols ?? []).find((c) => c.slug === "citiply-evergreen");
  if (citi) {
    const names = (prods ?? []).filter((p) => p.collection_id === citi.id)
      .map((p) => p.name).sort();
    console.log(`  citiply-evergreen has ${names.length} species:`);
    for (let i = 0; i < names.length; i += 4) {
      console.log("    " + names.slice(i, i + 4).map((s) => s.padEnd(24)).join(""));
    }
    console.log("\n  client-list terms present there with an EXACT generic name:");
    for (const t of TERMS) {
      const ex = names.filter((n) => n.toLowerCase() === t);
      if (ex.length) console.log(`    ${t} -> ${ex.join(", ")}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
