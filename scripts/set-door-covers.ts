/**
 * set-door-covers.ts
 *
 * Sets real cover images (not just product-card / product-page images) for the
 * doors catalogue: the `doors` catalogue image, its category images, and each
 * door collection's banner. Covers reuse the door photos already uploaded to S3
 * by scripts/upload-door-images.ts (doors/<code>.webp), so no new upload needed.
 *
 * Idempotent — safe to re-run.
 *
 * Run:  npm run covers:doors
 * Needs env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_S3_BASE_URL
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

function s3(code: string, thumb = false): string {
  const base = (process.env.NEXT_PUBLIC_S3_BASE_URL ?? "").replace(/\/$/, "");
  if (!base) throw new Error("NEXT_PUBLIC_S3_BASE_URL is not configured");
  return `${base}/doors/${code}${thumb ? "_thumb" : ""}.webp`;
}

// Representative product code chosen as the cover for each collection.
const COLLECTION_COVER: Record<string, string> = {
  "designer-veneer-doors": "0124", // brass cubic-lattice statement door
  "classic-european-doors": "0251", // white gold-lined classic
  "solid-wood-doors": "0609",       // brass-studded carved double door
  "basic-veneer-doors": "0231",     // clean rosewood grain veneer
  "laminated-doors": "0801"         // walnut laminate with metal strips
};

// Cover for each category (a strong door from within it).
const CATEGORY_COVER: Record<string, string> = {
  "designer-doors": "0284", // diamond carved designer face
  "flush-doors": "0604"     // 3D diamond carved solid wood
};

// Cover for the whole doors catalogue.
const CATALOGUE_COVER = "0280"; // full chevron walnut — clean hero

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const supabase = createClient(url, key, { realtime: { transport: ws as unknown as WebSocketLikeConstructor } });

  // Catalogue cover.
  {
    const { error } = await supabase
      .from("catalogues")
      .update({ image_url: s3(CATALOGUE_COVER) })
      .eq("slug", "doors");
    if (error) throw error;
    console.log(`  ✓ catalogue doors  →  ${CATALOGUE_COVER}.webp`);
  }

  // Category covers.
  for (const [slug, code] of Object.entries(CATEGORY_COVER)) {
    const { error } = await supabase
      .from("categories")
      .update({ image_url: s3(code) })
      .eq("slug", slug);
    if (error) throw error;
    console.log(`  ✓ category ${slug}  →  ${code}.webp`);
  }

  // Collection banners.
  for (const [slug, code] of Object.entries(COLLECTION_COVER)) {
    const { error } = await supabase
      .from("collections")
      .update({ banner_url: s3(code) })
      .eq("slug", slug);
    if (error) throw error;
    console.log(`  ✓ collection ${slug}  →  ${code}.webp`);
  }

  console.log("\nDone. Door covers updated.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
