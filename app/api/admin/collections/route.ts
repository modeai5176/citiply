import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const [collections, categories] = await Promise.all([
    supabase.from("collections").select("*").order("name"),
    supabase.from("categories").select("*").order("sort_order")
  ]);
  if (collections.error) return NextResponse.json({ error: collections.error.message }, { status: 500 });
  if (categories.error) return NextResponse.json({ error: categories.error.message }, { status: 500 });
  return NextResponse.json({ data: collections.data, categories: categories.data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await createAdminClient().from("collections").insert(body).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
