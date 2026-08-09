/**
 * evergreen-client-list-check.ts — READ ONLY.
 *
 * Reconciles the client's handwritten 16-species Evergreen shortlist against
 * (a) the Evergreen category now live in the DB and (b) all 184 FC4 products.
 *
 * Run: dotenv -e .env -- npx tsx scripts/evergreen-client-list-check.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

/** As written in the client's notebook page (numbered 1-16). */
const CLIENT_LIST = [
  "Teak", "Indian Rosewood", "Macassar Ebony", "Wenge", "Santos", "Stonewood",
  "Sucupira", "American Walnut", "Anigre", "White Oak", "Ash", "Larch",
  "Red Oak", "Sapeli", "Cherry", "Mahogany"
];

/** Tokens that must appear (lowercased) for a DB name to count as a match. */
const MATCH: Record<string, string[]> = {
  "Teak": ["teak"],
  "Indian Rosewood": ["indian", "rosewood"],
  "Macassar Ebony": ["macassar"],
  "Wenge": ["wenge"],
  "Santos": ["santos"],
  "Stonewood": ["stonewood"],
  "Sucupira": ["sucupira"],
  "American Walnut": ["american", "walnut"],
  "Anigre": ["anigre"],
  "White Oak": ["white", "oak"],
  "Ash": ["ash"],
  "Larch": ["larch"],
  "Red Oak": ["red", "oak"],
  "Sapeli": ["sapeli"],
  "Cherry": ["cherry"],
  "Mahogany": ["mahogany"]
};

const clean = (s: string) => s.replace(/\s*\(FC4\)$/, "").trim();

async function main() {
  const { data: evCat } = await db.from("categories").select("id").eq("slug", "evergreen").maybeSingle();
  const { data: evCols } = await db.from("collections").select("id, name, slug").eq("category_id", evCat!.id);
  const colById = new Map((evCols ?? []).map((c) => [c.id, c]));

  const { data: evProds } = await db.from("products")
    .select("sku, name, collection_id").in("collection_id", (evCols ?? []).map((c) => c.id));

  const { data: fc4col } = await db.from("collections")
    .select("id").eq("slug", "turakhia-fc4-fan-deck").maybeSingle();
  const { data: fanProds } = await db.from("products")
    .select("sku, name, short_description").eq("collection_id", fc4col!.id);

  console.log("=== client's 16 vs. the live Evergreen category ===\n");
  const matchedSkus = new Set<string>();
  const notInEvergreen: string[] = [];

  for (const want of CLIENT_LIST) {
    const toks = MATCH[want];
    const hits = (evProds ?? []).filter((p) => {
      const n = clean(p.name).toLowerCase();
      return toks.every((t) => n.includes(t));
    });
    hits.forEach((h) => matchedSkus.add(h.sku));

    if (hits.length === 0) {
      notInEvergreen.push(want);
      // is it anywhere else in FC4?
      const elsewhere = (fanProds ?? []).filter((p) => {
        const n = clean(p.name).toLowerCase();
        return toks.every((t) => n.includes(t));
      });
      console.log(`  ${want.padEnd(17)} MISSING from Evergreen`);
      if (elsewhere.length) {
        for (const e of elsewhere) {
          console.log(`      but exists in FC4: ${clean(e.name)}  [${(e.short_description ?? "").replace(/ series$/, "")}]`);
        }
      } else {
        console.log(`      not present anywhere in the 184 FC4 products`);
      }
    } else {
      const exact = hits.some((h) => clean(h.name).toLowerCase() === want.toLowerCase());
      const label = exact ? "exact  " : "NEAR   ";
      console.log(`  ${want.padEnd(17)} ${label} ${hits.map((h) => `${clean(h.name)} → ${colById.get(h.collection_id)!.name}`).join("  |  ")}`);
    }
  }

  console.log(`\n=== the other side: FC4 Evergreen species NOT on the client's list ===\n`);
  const extra = (evProds ?? []).filter((p) => !matchedSkus.has(p.sku))
    .map((p) => clean(p.name)).sort();
  console.log(`  ${extra.length} of ${evProds?.length} species are in the catalogue but not on the note:\n`);
  for (let i = 0; i < extra.length; i += 4) {
    console.log("    " + extra.slice(i, i + 4).map((s) => s.padEnd(22)).join(""));
  }

  console.log(`\n=== summary ===`);
  console.log(`  client list:            ${CLIENT_LIST.length}`);
  console.log(`  matched in Evergreen:   ${CLIENT_LIST.length - notInEvergreen.length}`);
  console.log(`  missing from Evergreen: ${notInEvergreen.length}${notInEvergreen.length ? " → " + notInEvergreen.join(", ") : ""}`);
  console.log(`  Evergreen total:        ${evProds?.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
