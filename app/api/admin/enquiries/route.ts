import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("enquiry_sessions")
    .select("*, enquiry_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    // If enquiry_sessions table does not exist in live Supabase, read from quote_requests
    const { data: quotes, error: quoteError } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (quoteError) return NextResponse.json({ error: quoteError.message }, { status: 500 });

    const adapted = (quotes ?? []).map((q) => {
      // Check if there is an embedded ITEMS_JSON payload
      const jsonMatch = q.message?.match(/<!--ITEMS_JSON:(.*?)-->/);
      let parsedItems: Array<{
        id: string;
        product_code: string;
        product_name: string;
        collection_name: string | null;
        category_name: string | null;
        quantity: string | null;
        note: string | null;
      }> = [];

      if (jsonMatch) {
        try {
          const rawItems = JSON.parse(jsonMatch[1]);
          parsedItems = rawItems.map((item: any, idx: number) => ({
            id: `${q.id}-${idx}`,
            product_code: item.sku || "-",
            product_name: item.name || item.sku || "Product",
            collection_name: item.collectionName || null,
            category_name: item.categoryName || null,
            quantity: item.quantity || null,
            note: item.note || null
          }));
        } catch {}
      }

      if (!parsedItems.length) {
        parsedItems = (q.product_code?.split(",") ?? []).map((code: string, idx: number) => ({
          id: `${q.id}-${idx}`,
          product_code: code.trim(),
          product_name: code.trim(),
          collection_name: null,
          category_name: null,
          quantity: q.quantity ?? null,
          note: null
        }));
      }

      // Extract email from message if present
      const emailMatch = q.message?.match(/Email:\s*([^\n]+)/i);
      const email = emailMatch ? emailMatch[1].trim() : null;

      // Clean message for display (remove internal ITEMS_JSON tag)
      const cleanMessage = q.message?.replace(/<!--ITEMS_JSON:.*?-->/, "").trim() || null;

      return {
        id: q.id,
        created_at: q.created_at,
        full_name: q.full_name,
        email,
        phone: q.phone,
        whatsapp: q.whatsapp,
        firm: q.firm,
        city: q.city,
        message: cleanMessage,
        status: q.status ?? "pending",
        enquiry_items: parsedItems
      };
    });

    return NextResponse.json({ data: adapted });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: string; status?: string };
  if (!body.id || !body.status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("enquiry_sessions")
    .update({ status: body.status })
    .eq("id", body.id);

  if (error) {
    const { error: quoteErr } = await supabase
      .from("quote_requests")
      .update({ status: body.status })
      .eq("id", body.id);

    if (quoteErr) return NextResponse.json({ error: quoteErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

