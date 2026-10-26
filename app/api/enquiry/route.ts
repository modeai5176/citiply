import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEnquiryEmail } from "@/lib/email";

const schema = z.object({
  contact: z.object({
    full_name: z.string().min(2),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().min(7),
    whatsapp: z.string().optional(),
    firm: z.string().optional(),
    city: z.string().min(2),
    message: z.string().optional()
  }),
  items: z.array(z.object({
    productId: z.string(),
    sku: z.string(),
    name: z.string(),
    collectionName: z.string(),
    categoryName: z.string(),
    quantity: z.string().optional(),
    note: z.string().optional()
  })).min(1)
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid enquiry data" }, { status: 400 });

  const { contact, items } = parsed.data;
  const supabase = createAdminClient();

  // 1. Transactional insertion into Supabase (with fallback to quote_requests if enquiry_sessions is not yet migrated)
  const { data: session, error: sessionError } = await supabase
    .from("enquiry_sessions")
    .insert({
      full_name: contact.full_name,
      phone: contact.phone,
      whatsapp: contact.whatsapp || null,
      firm: contact.firm || null,
      city: contact.city,
      message: [contact.email ? `Email: ${contact.email}` : "", contact.message || ""].filter(Boolean).join("\n") || null,
      status: "pending"
    })
    .select("id")
    .single();

  let sessionId = session?.id;

  if (sessionError || !session) {
    console.warn("[Enquiry API] enquiry_sessions insert error, falling back to quote_requests:", sessionError?.message);
    const summaryProductCode = items.map((i) => i.sku).join(", ");
    const summaryQuantity = items.map((i) => `${i.sku}: ${i.quantity || "1"}`).join("; ");
    const structuredItemsPayload = JSON.stringify(items);
    const summaryMessage = [
      contact.email ? `Email: ${contact.email}` : "",
      contact.message ? `Customer Message: ${contact.message}` : "",
      `Multi-Product Enquiry (${items.length} items):`,
      ...items.map(
        (i, idx) =>
          `${idx + 1}. [${i.sku}] ${i.name} (${i.collectionName ?? ""} / ${i.categoryName ?? ""}) — Qty: ${i.quantity || "1"}${i.note ? ` | Note: ${i.note}` : ""}`
      ),
      `<!--ITEMS_JSON:${structuredItemsPayload}-->`
    ]
      .filter(Boolean)
      .join("\n");

    const { data: fallbackReq, error: fallbackErr } = await supabase
      .from("quote_requests")
      .insert({
        full_name: contact.full_name,
        phone: contact.phone,
        whatsapp: contact.whatsapp || null,
        firm: contact.firm || null,
        city: contact.city,
        product_code: summaryProductCode.slice(0, 500),
        quantity: summaryQuantity.slice(0, 500),
        message: summaryMessage,
        status: "pending"
      })
      .select("id")
      .single();

    if (fallbackErr || !fallbackReq) {
      return NextResponse.json({ error: fallbackErr?.message ?? sessionError?.message ?? "Could not save enquiry" }, { status: 500 });
    }
    sessionId = fallbackReq.id;
  } else {
    const { error: itemsError } = await supabase.from("enquiry_items").insert(items.map((item) => ({
      session_id: session.id,
      product_id: item.productId,
      product_code: item.sku,
      product_name: item.name,
      collection_name: item.collectionName,
      category_name: item.categoryName,
      quantity: item.quantity || null,
      note: item.note || null
    })));

    if (itemsError) {
      console.warn("[Enquiry API] Failed to insert enquiry_items:", itemsError.message);
    }
  }

  // 2. Dispatch email notification via Gmail SMTP (graceful fallback)
  try {
    await sendEnquiryEmail(contact, items, sessionId);
  } catch (emailError) {
    console.error("[Enquiry Notification] Email dispatch failed:", emailError);
  }

  return NextResponse.json({ success: true, sessionId });
}
