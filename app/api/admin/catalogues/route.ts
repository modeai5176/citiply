import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const cataloguePayloadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens"),
  description: z.string().trim().nullable().optional(),
  image_url: z.string().trim().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true)
});

export async function GET() {
  const { data, error } = await createAdminClient().from("catalogues").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const parsed = cataloguePayloadSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid catalogue" }, { status: 400 });

  const { data, error } = await createAdminClient().from("catalogues").insert(parsed.data).select("*").single();
  if (error?.code === "23505") return NextResponse.json({ error: "A catalogue with this slug already exists" }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
