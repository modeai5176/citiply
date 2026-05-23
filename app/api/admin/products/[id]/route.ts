import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ProductPayload = {
  product: Record<string, unknown>;
  specs?: Array<{ spec_name: string; spec_value: string; sort_order?: number }>;
  images?: Array<{ image_url: string; thumbnail_url: string; blur_data_url: string | null; kind: string; sort_order?: number }>;
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const [product, specs, images] = await Promise.all([
    supabase.from("products").select("*").eq("id", params.id).single(),
    supabase.from("product_specs").select("*").eq("product_id", params.id).order("sort_order"),
    supabase.from("product_images").select("*").eq("product_id", params.id).order("sort_order")
  ]);
  if (product.error) return NextResponse.json({ error: product.error.message }, { status: 500 });
  if (specs.error) return NextResponse.json({ error: specs.error.message }, { status: 500 });
  if (images.error) return NextResponse.json({ error: images.error.message }, { status: 500 });
  return NextResponse.json({ data: product.data, specs: specs.data, images: images.data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = (await request.json()) as ProductPayload;
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").update(payload.product).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("product_specs").delete().eq("product_id", params.id);
  if (payload.specs?.length) {
    const { error: specError } = await supabase.from("product_specs").insert(payload.specs.map((spec, index) => ({ ...spec, product_id: params.id, sort_order: spec.sort_order ?? index })));
    if (specError) return NextResponse.json({ error: specError.message }, { status: 500 });
  }

  await supabase.from("product_images").delete().eq("product_id", params.id);
  if (payload.images?.length) {
    const { error: imageError } = await supabase.from("product_images").insert(payload.images.map((image, index) => ({ ...image, product_id: params.id, sort_order: image.sort_order ?? index })));
    if (imageError) return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await createAdminClient().from("products").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
