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

  const productData = product.data;
  if (!productData.quantity) {
    const specQty = specs.data?.find((s) => s.spec_name.toLowerCase() === "quantity")?.spec_value;
    const descQty = productData.short_description?.match(/Qty:\s*([^)]+)/i)?.[1]?.trim();
    productData.quantity = specQty ?? descQty ?? null;
  }

  return NextResponse.json({ data: productData, specs: specs.data, images: images.data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = (await request.json()) as ProductPayload;
  const supabase = createAdminClient();

  let productUpdate = { ...payload.product };
  let pendingSpecs = [...(payload.specs ?? [])];

  let { error } = await supabase.from("products").update(productUpdate).eq("id", params.id);

  // Graceful fallback if quantity column is not present in live Supabase table
  if (error && error.message?.includes("quantity") && "quantity" in productUpdate) {
    const qtyValue = String(productUpdate.quantity ?? "");
    delete productUpdate.quantity;
    if (qtyValue) {
      pendingSpecs = pendingSpecs.filter((s) => s.spec_name.toLowerCase() !== "quantity");
      pendingSpecs.push({ spec_name: "Quantity", spec_value: qtyValue });
    }
    const retry = await supabase.from("products").update(productUpdate).eq("id", params.id);
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("product_specs").delete().eq("product_id", params.id);
  if (pendingSpecs.length) {
    const { error: specError } = await supabase.from("product_specs").insert(pendingSpecs.map((spec, index) => ({ ...spec, product_id: params.id, sort_order: spec.sort_order ?? index })));
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
