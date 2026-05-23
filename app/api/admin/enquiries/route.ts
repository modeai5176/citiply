import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await createAdminClient()
    .from("enquiry_sessions")
    .select("*, enquiry_items(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: string; status?: string };
  if (!body.id || !body.status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });

  const { error } = await createAdminClient()
    .from("enquiry_sessions")
    .update({ status: body.status })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
