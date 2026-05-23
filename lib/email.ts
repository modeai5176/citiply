import { Resend } from "resend";
import type { QuoteFormValues } from "@/lib/validations";

type QuoteEmailProduct = {
  code?: string;
  name?: string;
  collection?: string;
  category?: string;
  url?: string;
};

export async function sendQuoteEmail(values: QuoteFormValues, product?: QuoteEmailProduct) {
  const recipient = process.env.QUOTE_RECIPIENT_EMAIL ?? process.env.QUOTE_EMAIL_TO;
  if (!process.env.RESEND_API_KEY || !recipient) {
    return { skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const code = product?.code ?? values.productCode ?? "General Inquiry";
  const subject = `New Quote Request - ${code} - ${product?.collection ?? "Citiply"}`;

  await resend.emails.send({
    from: "Citiply Catalogue <quotes@citiply.local>",
    to: recipient,
    subject,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
        <h2>New Quote Request</h2>
        <p><strong>PRODUCT:</strong> ${code}${product?.name ? ` - ${product.name}` : ""}</p>
        <p><strong>Collection:</strong> ${product?.collection ?? "-"}</p>
        <p><strong>Category:</strong> ${product?.category ?? "-"}</p>
        <p><strong>Product URL:</strong> ${product?.url ?? "-"}</p>
        <hr />
        <p><strong>NAME:</strong> ${values.fullName}</p>
        <p><strong>PHONE:</strong> ${values.phone}</p>
        <p><strong>WHATSAPP:</strong> ${values.whatsapp || "-"}</p>
        <p><strong>FIRM:</strong> ${values.firm || "-"}</p>
        <p><strong>CITY:</strong> ${values.city}</p>
        <p><strong>QUANTITY:</strong> ${values.quantity || "-"}</p>
        <p><strong>MESSAGE:</strong> ${values.message || "-"}</p>
        <p><strong>Received:</strong> ${new Date().toISOString()}</p>
      </div>
    `
  });

  return { skipped: false };
}
