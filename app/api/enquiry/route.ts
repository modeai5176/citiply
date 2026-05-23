import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  contact: z.object({
    full_name: z.string().min(2),
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

  const { data: session, error: sessionError } = await supabase
    .from("enquiry_sessions")
    .insert({
      full_name: contact.full_name,
      phone: contact.phone,
      whatsapp: contact.whatsapp || null,
      firm: contact.firm || null,
      city: contact.city,
      message: contact.message || null,
      status: "pending"
    })
    .select("id")
    .single();

  if (sessionError || !session) return NextResponse.json({ error: sessionError?.message ?? "Could not save enquiry" }, { status: 500 });

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

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  await sendEnquiryEmail(contact, items, session.id);
  return NextResponse.json({ success: true, sessionId: session.id });
}

async function sendEnquiryEmail(contact: z.infer<typeof schema>["contact"], items: z.infer<typeof schema>["items"], sessionId: string) {
  const recipient = process.env.QUOTE_RECIPIENT_EMAIL ?? process.env.QUOTE_EMAIL_TO;
  if (!process.env.RESEND_API_KEY || !recipient) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const rows = items.map((item, index) => `
    <tr style="background:${index % 2 === 0 ? "#f8f8f8" : "#ffffff"}">
      <td style="padding:8px 10px;font-family:monospace">${escapeHtml(item.sku)}</td>
      <td style="padding:8px 10px">${escapeHtml(item.name)}</td>
      <td style="padding:8px 10px">${escapeHtml(item.collectionName)}</td>
      <td style="padding:8px 10px">${escapeHtml(item.quantity || "-")}</td>
      <td style="padding:8px 10px">${escapeHtml(item.note || "-")}</td>
    </tr>
  `).join("");

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Citiply Catalogue <quotes@citiply.local>",
    to: recipient,
    subject: `New Multi-Product Enquiry - ${items.length} products - ${contact.full_name}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;line-height:1.5">
        <h2>New Multi-Product Enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(contact.full_name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(contact.phone)}</p>
        <p><strong>WhatsApp:</strong> ${escapeHtml(contact.whatsapp || "-")}</p>
        <p><strong>Firm:</strong> ${escapeHtml(contact.firm || "-")}</p>
        <p><strong>City:</strong> ${escapeHtml(contact.city)}</p>
        <p><strong>Message:</strong> ${escapeHtml(contact.message || "-")}</p>
        <h3>Products (${items.length})</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee">
          <thead><tr style="background:#1a1a1a;color:white"><th style="padding:10px;text-align:left">SKU</th><th style="padding:10px;text-align:left">Product</th><th style="padding:10px;text-align:left">Collection</th><th style="padding:10px;text-align:left">Quantity</th><th style="padding:10px;text-align:left">Note</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:20px;color:#777;font-size:12px">Session: ${sessionId}${siteUrl ? `<br />Admin: ${siteUrl}/admin/enquiries` : ""}</p>
      </div>
    `
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}
