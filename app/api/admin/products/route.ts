import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ProductPayload = {
  product: Record<string, unknown>;
  specs?: Array<{ spec_name: string; spec_value: string; sort_order?: number }>;
  images?: Array<{ image_url: string; thumbnail_url: string; blur_data_url: string | null; kind: string; sort_order?: number }>;
};

export async function GET() {
  const supabase = createAdminClient();
  const [products, collections] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("collections").select("*").order("name")
  ]);
  if (products.error) return NextResponse.json({ error: products.error.message }, { status: 500 });
  if (collections.error) return NextResponse.json({ error: collections.error.message }, { status: 500 });
  return NextResponse.json({ data: products.data, collections: collections.data });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ProductPayload;
  const supabase = createAdminClient();
  const { data: product, error } = await supabase.from("products").insert(payload.product).select("id").single();
  if (error || !product) return NextResponse.json({ error: error?.message ?? "Could not create product" }, { status: 500 });

  const productId = product.id as string;
  if (payload.specs?.length) {
    const { error: specError } = await supabase.from("product_specs").insert(payload.specs.map((spec, index) => ({ ...spec, product_id: productId, sort_order: spec.sort_order ?? index })));
    if (specError) return NextResponse.json({ error: specError.message }, { status: 500 });
  }
  if (payload.images?.length) {
    const { error: imageError } = await supabase.from("product_images").insert(payload.images.map((image, index) => ({ ...image, product_id: productId, sort_order: image.sort_order ?? index })));
    if (imageError) return NextResponse.json({ error: imageError.message }, { status: 500 });
  }
  return NextResponse.json({ data: { id: productId } });
}
