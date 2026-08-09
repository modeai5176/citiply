/**
 * evergreen-completeness.ts — READ ONLY.
 *
 * Definitive audit: does the live Evergreen category contain exactly the 52
 * species printed in the Turakhia FC4 fan deck (divider p20, swatches pp22-73)
 * — no gaps, no extras, no duplicates — and is each one actually usable?
 *
 * Run: dotenv -e .env -- npx tsx scripts/evergreen-completeness.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as WebSocketLikeConstructor }
});

/** Read straight off the fan deck footer labels, pp22-73, in page order. */
const PDF_EVERGREEN: [number, string][] = [
  [22, "Black Gum"], [23, "Indian Rosewood"], [24, "Macassar Ebony"], [25, "Wenge"],
  [26, "Barbasco"], [27, "Yewtree"], [28, "Santos Rosewood"], [29, "Rosso"],
  [30, "Ontano Rosso"], [31, "Stonewood"], [32, "Zericoated"], [33, "Sucupira"],
  [34, "Ipe"], [35, "Spilted"], [36, "American Walnut"], [37, "Indian Walnut"],
  [38, "European Walnut"], [39, "Lacewood"], [40, "Zebrano"], [41, "Bocote"],
  [42, "Sassnero"], [43, "Riverwood"], [44, "Spalted Teak"], [45, "Burmese Teak"],
  [46, "Golden Wenge"], [47, "Anigre Figured"], [48, "Eucalyptus Figured"], [49, "Anigre"],
  [50, "White Oak"], [51, "American Maple"], [52, "Chestnut"], [53, "Sycamore"],
  [54, "Ash"], [55, "Hackberry"], [56, "Poplar"], [57, "Birds Eye Maple"],
  [58, "Larch"], [59, "Rivertree"], [60, "Beech"], [61, "Lebanese Cedar"],
  [62, "Plaintree"], [63, "Red Oak"], [64, "Roseheart"], [65, "Kevasingo"],
  [66, "Sapeli"], [67, "European Cherry"], [68, "African Mahogany"], [69, "African Cherry"],
  [70, "Red Cedar"], [71, "Padauk"], [72, "Sapeli Pomele"], [73, "Eucalyptus Pommele"]
];

/** loose key so "Pomele"/"Pommele" and the "(FC4)" suffix don't cause false gaps */
const norm = (s: string) =>
  s.replace(/\s*\(FC4\)\s*$/i, "").toLowerCase().replace(/mm/g, "m").replace(/[^a-z]/g, "");

async function main() {
  const { data: cat } = await db.from("categories")
    .select("id, name, slug, is_active").eq("slug", "evergreen").maybeSingle();
  if (!cat) throw new Error("evergreen category not found");
  console.log(`category: ${cat.name} (${cat.slug})  active=${cat.is_active}\n`);

  const { data: cols } = await db.from("collections")
    .select("id, name, slug, is_active").eq("category_id", cat.id);
  const colById = new Map((cols ?? []).map((c) => [c.id, c]));

  const { data: prods } = await db.from("products")
    .select("sku, name, is_active, collection_id, category_id, finish, base_material, thickness, size, short_description, product_images(id), product_specs(id)")
    .in("collection_id", (cols ?? []).map((c) => c.id));

  const dbByKey = new Map<string, any[]>();
  for (const p of prods ?? []) {
    const k = norm(p.name);
    (dbByKey.get(k) ?? dbByKey.set(k, []).get(k)!).push(p);
  }

  // --- 1. every PDF species present? ---
  const gaps: string[] = [];
  for (const [page, name] of PDF_EVERGREEN) {
    if (!dbByKey.has(norm(name))) gaps.push(`p${page} ${name}`);
  }

  // --- 2. anything in the DB that is NOT in the PDF? ---
  const pdfKeys = new Set(PDF_EVERGREEN.map(([, n]) => norm(n)));
  const extras = (prods ?? []).filter((p) => !pdfKeys.has(norm(p.name)));

  // --- 3. duplicates ---
  const dupes = Array.from(dbByKey.entries()).filter(([, v]) => v.length > 1);

  console.log("=== 1. coverage: PDF -> DB ===");
  console.log(`  PDF Evergreen species : ${PDF_EVERGREEN.length}`);
  console.log(`  products in category  : ${prods?.length}`);
  console.log(`  collections           : ${cols?.length}`);
  console.log(`  MISSING from DB       : ${gaps.length}${gaps.length ? "\n    " + gaps.join("\n    ") : "  ✓"}`);
  console.log(`  EXTRA (not in PDF)    : ${extras.length}${extras.length ? "\n    " + extras.map((e) => e.name).join("\n    ") : "  ✓"}`);
  console.log(`  DUPLICATES            : ${dupes.length}${dupes.length ? "\n    " + dupes.map(([k, v]) => v.map((x: any) => x.sku).join(" / ")).join("\n    ") : "  ✓"}`);

  console.log("\n=== 2. every product usable? ===");
  const inactive = (prods ?? []).filter((p) => !p.is_active);
  const wrongCat = (prods ?? []).filter((p) => p.category_id !== cat.id);
  const noImage = (prods ?? []).filter((p) => (p.product_images ?? []).length === 0);
  const noSpecs = (prods ?? []).filter((p) => (p.product_specs ?? []).length === 0);
  const noFinish = (prods ?? []).filter((p) => !p.finish);
  const noThick = (prods ?? []).filter((p) => !p.thickness);
  const noSize = (prods ?? []).filter((p) => !p.size);
  const noBase = (prods ?? []).filter((p) => !p.base_material);
  console.log(`  is_active=false        : ${inactive.length}${inactive.length ? " -> " + inactive.map((p) => p.sku).join(", ") : "  ✓"}`);
  console.log(`  wrong category_id      : ${wrongCat.length}${wrongCat.length ? " -> " + wrongCat.map((p) => p.sku).join(", ") : "  ✓"}`);
  console.log(`  no product image       : ${noImage.length}`);
  console.log(`  no product specs       : ${noSpecs.length}`);
  console.log(`  finish empty           : ${noFinish.length}`);
  console.log(`  thickness empty        : ${noThick.length}`);
  console.log(`  size empty             : ${noSize.length}`);
  console.log(`  base_material empty    : ${noBase.length}`);

  console.log("\n=== 3. family collections ===");
  const counts: Record<string, number> = {};
  for (const p of prods ?? []) {
    const c = colById.get(p.collection_id)!;
    counts[c.name] = (counts[c.name] ?? 0) + 1;
  }
  let sum = 0;
  for (const [n, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.padEnd(18)} ${c}`);
    sum += c;
  }
  console.log(`  ${"TOTAL".padEnd(18)} ${sum}`);
  const emptyCols = (cols ?? []).filter((c) => !counts[c.name]);
  if (emptyCols.length) console.log(`  EMPTY collections: ${emptyCols.map((c) => c.slug).join(", ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
