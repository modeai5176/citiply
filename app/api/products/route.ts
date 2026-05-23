import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productsQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = productsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { category, collection, finish, color_tone: colorTone, search, page, limit } = parsed.data;
  const supabase = createAdminClient();
  const from = (page - 1) * limit;
  let categoryId = category;
  let collectionId = collection;

  if (category && !category.includes("-")) categoryId = category;
  if (category && category.includes("-")) {
    const { data } = await supabase.from("categories").select("id").eq("slug", category).maybeSingle();
    categoryId = data?.id;
  }
  if (collection && collection.includes("-")) {
    const { data } = await supabase.from("collections").select("id").eq("slug", collection).maybeSingle();
    collectionId = data?.id;
  }

  let query = supabase
    .from("products")
    .select("*, product_images(*), product_specs(*)", { count: "exact" })
    .eq("is_active", true)
    .order("name")
    .range(from, from + limit - 1);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (collectionId) query = query.eq("collection_id", collectionId);
  if (finish) query = query.eq("finish", finish);
  if (colorTone) query = query.eq("color_tone", colorTone);
  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    products: data ?? [],
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit)
  });
}
