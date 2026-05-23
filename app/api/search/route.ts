import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 20) || 20, 50);
  if (!q || q.length < 2) return NextResponse.json({ results: { categories: [], collections: [], products: [] }, total: 0 });

  const supabase = createAdminClient();
  const term = `%${q.replace(/[%_,]/g, "")}%`;

  const [categories, collections, products, specMatches] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug,image_url,description")
      .eq("is_active", true)
      .or(`name.ilike.${term},description.ilike.${term}`)
      .limit(4),
    supabase
      .from("collections")
      .select("id,name,slug,banner_url,tagline,description,categories(name,slug)")
      .eq("is_active", true)
      .or(`name.ilike.${term},tagline.ilike.${term},description.ilike.${term}`)
      .limit(6),
    supabase
      .from("products")
      .select("id,sku,name,slug,finish,base_material,color_tone,short_description,product_images(thumbnail_url,kind),collections(name,slug),categories(name,slug)")
      .eq("is_active", true)
      .or(`sku.ilike.${term},name.ilike.${term},finish.ilike.${term},base_material.ilike.${term},color_tone.ilike.${term},short_description.ilike.${term}`)
      .limit(limit),
    supabase
      .from("product_specs")
      .select("product_id,spec_name,spec_value")
      .or(`spec_name.ilike.${term},spec_value.ilike.${term}`)
      .limit(10)
  ]);

  if (categories.error) return NextResponse.json({ error: categories.error.message }, { status: 500 });
  if (collections.error) return NextResponse.json({ error: collections.error.message }, { status: 500 });
  if (products.error) return NextResponse.json({ error: products.error.message }, { status: 500 });
  if (specMatches.error) return NextResponse.json({ error: specMatches.error.message }, { status: 500 });

  const existingProductIds = new Set((products.data ?? []).map((product) => product.id));
  const specProductIds = Array.from(new Set((specMatches.data ?? []).map((spec) => spec.product_id).filter((id) => !existingProductIds.has(id)))).slice(0, 6);

  const specProducts = specProductIds.length
    ? await supabase
        .from("products")
        .select("id,sku,name,slug,finish,base_material,color_tone,short_description,product_images(thumbnail_url,kind),collections(name,slug),categories(name,slug)")
        .eq("is_active", true)
        .in("id", specProductIds)
    : { data: [], error: null };

  if (specProducts.error) return NextResponse.json({ error: specProducts.error.message }, { status: 500 });

  const query = q.toLowerCase();
  const rankedProducts = [...(products.data ?? []), ...(specProducts.data ?? [])].sort((a, b) => {
    const aRank = (a.sku.toLowerCase() === query ? 0 : 4) + (a.name.toLowerCase().startsWith(query) ? 0 : 2);
    const bRank = (b.sku.toLowerCase() === query ? 0 : 4) + (b.name.toLowerCase().startsWith(query) ? 0 : 2);
    return aRank - bRank;
  });

  return NextResponse.json({
    query: q,
    results: {
      categories: categories.data ?? [],
      collections: collections.data ?? [],
      products: rankedProducts
    },
    total: (categories.data?.length ?? 0) + (collections.data?.length ?? 0) + rankedProducts.length
  });
}
