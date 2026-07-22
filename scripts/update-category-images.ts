import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

for (const file of [".env", ".env.local"]) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const CATEGORY_IMAGES: Record<string, string> = {
  "natural-veneers": "/images/categories/natural-veneers.png",
  "exotic-veneers": "/images/categories/exotic-veneers.png",
  "coloured-veneers": "/images/categories/coloured-veneers.png",
  "textured-veneers": "/images/categories/textured-veneers.png",
  "specialty-series": "/images/categories/specialty-series.png",
  "premium-collections": "/images/categories/premium-collections.png",
  "fluted-veneers": "/images/categories/fluted-veneers.png",
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role environment variables missing");
  }

  const supabase = createClient(url, key);
  console.log("Updating category image URLs in Supabase...");

  for (const [slug, imageUrl] of Object.entries(CATEGORY_IMAGES)) {
    const { data, error } = await supabase
      .from("categories")
      .update({ image_url: imageUrl })
      .eq("slug", slug)
      .select("name, slug, image_url");

    if (error) {
      console.error(`Error updating category ${slug}:`, error.message);
    } else {
      console.log(`Updated ${slug}:`, data);
    }
  }

  console.log("Done!");
}

main().catch(console.error);
