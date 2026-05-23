import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: { sku: string } }) {
  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_specs(*)")
    .eq("sku", params.sku)
    .eq("is_active", true)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ data: product });
}
