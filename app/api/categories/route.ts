import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data: categories, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const data = await Promise.all((categories ?? []).map(async (category) => {
    const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("category_id", category.id).eq("is_active", true);
    return { ...category, productCount: count ?? 0 };
  }));

  return NextResponse.json({ data });
}
