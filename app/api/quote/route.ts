import { NextResponse } from "next/server";
import { sendQuoteEmail } from "@/lib/email";
import { saveQuoteRequest } from "@/lib/supabase/quotes";
import { createAdminClient } from "@/lib/supabase/admin";
import { quoteSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();
    const { data: product } = parsed.data.productCode
      ? await supabase.from("products").select("*, collections(name), categories(name)").eq("sku", parsed.data.productCode).eq("is_active", true).maybeSingle()
      : { data: null };
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

    await saveQuoteRequest({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp || null,
      firm: parsed.data.firm || null,
      city: parsed.data.city,
      product_code: parsed.data.productCode || null,
      quantity: parsed.data.quantity || null,
      message: parsed.data.message || null,
      status: "pending"
    });

    await sendQuoteEmail(parsed.data, {
      code: product?.sku ?? parsed.data.productCode,
      name: product?.name,
      collection: product && "collections" in product ? (product.collections as { name?: string } | null)?.name : undefined,
      category: product && "categories" in product ? (product.categories as { name?: string } | null)?.name : undefined,
      url: product ? `${siteUrl}/products/${product.sku}` : undefined
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
