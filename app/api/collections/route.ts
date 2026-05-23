import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const categoryId = new URL(request.url).searchParams.get("category_id");
  let query = supabase.from("collections").select("*").eq("is_active", true).order("name");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
