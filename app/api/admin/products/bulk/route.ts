import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const body = (await request.json()) as { ids?: string[]; is_active?: boolean };
  if (!body.ids?.length || typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "ids and is_active are required" }, { status: 400 });
  }
  const { error } = await createAdminClient().from("products").update({ is_active: body.is_active }).in("id", body.ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
