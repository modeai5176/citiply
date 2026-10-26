import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { ProjectBriefValues, QuoteFormValues } from "@/lib/validations";

export type QuoteEmailProduct = {
  code?: string;
  name?: string;
  collection?: string;
  category?: string;
  url?: string;
  quantity?: string;
};

export type EnquiryItemDetail = {
  productId?: string;
  sku: string;
  name: string;
  collectionName?: string | null;
  categoryName?: string | null;
  quantity?: string | null;
  note?: string | null;
};

export type EnquiryContactDetail = {
  full_name: string;
  email?: string | null;
  phone: string;
  whatsapp?: string | null;
  firm?: string | null;
  city: string;
  message?: string | null;
};

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char] ?? char));
}

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function getEnv(key: string): string | undefined {
  if (process.env[key]?.trim()) return process.env[key]?.trim();
  try {
    const envPath = join(process.cwd(), ".env");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match) return match[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return undefined;
}

/**
 * Creates and returns the Gmail SMTP transporter using Gmail App Password.
 */
export function getGmailTransporter() {
  const user = getEnv("GMAIL_USER");
  const pass = getEnv("GMAIL_APP_PASSWORD")?.replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

function getEmailConfig() {
  const recipient =
    getEnv("ADMIN_NOTIFICATION_EMAIL") ||
    getEnv("QUOTE_RECIPIENT_EMAIL") ||
    getEnv("QUOTE_EMAIL_TO") ||
    getEnv("GMAIL_USER");

  const senderUser = getEnv("GMAIL_USER");
  const from = senderUser
    ? `Citiply Notifications <${senderUser}>`
    : "Citiply Catalogue <onboarding@resend.dev>";

  return { recipient, from };
}

/**
 * Generic mail dispatcher: Attempts Gmail SMTP first, then Resend as fallback.
 */
async function dispatchEmail({
  subject,
  html,
  text,
  to,
  replyTo
}: {
  subject: string;
  html: string;
  text?: string;
  to?: string | string[];
  replyTo?: string;
}): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const { recipient, from } = getEmailConfig();
  const targetRecipients = to ?? recipient;

  if (!targetRecipients || (Array.isArray(targetRecipients) && !targetRecipients.length)) {
    console.warn("[Email Dispatcher] No recipient email specified in environment variables.");
    return { success: false, skipped: true };
  }

  const transporter = getGmailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: targetRecipients,
        replyTo,
        subject,
        html,
        text: text ?? html.replace(/<[^>]+>/g, " ")
      });
      return { success: true };
    } catch (smtpError) {
      console.error("[Gmail SMTP Error] Failed to send email via Gmail:", smtpError);
      // Fall through to try Resend if configured
    }
  }

  // Fallback to Resend if Gmail SMTP credentials are not set or failed
  const resendKey = getEnv("RESEND_API_KEY");
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Citiply Catalogue <onboarding@resend.dev>",
        to: Array.isArray(targetRecipients) ? targetRecipients : [targetRecipients],
        reply_to: replyTo,
        subject,
        html
      });
      return { success: true };
    } catch (resendError) {
      console.error("[Resend Error] Failed to send email via Resend:", resendError);
      return { success: false, error: String(resendError) };
    }
  }

  console.warn("[Email Dispatcher] Neither Gmail SMTP nor Resend is configured. Set GMAIL_USER & GMAIL_APP_PASSWORD in .env.");
  return { success: false, skipped: true };
}

/**
 * Send email notification for single-product enquiry (Quote Request).
 */
export async function sendQuoteEmail(values: QuoteFormValues, product?: QuoteEmailProduct) {
  const code = product?.code ?? values.productCode ?? "General Inquiry";
  const productName = product?.name ? ` — ${product.name}` : "";
  const subject = `[New Enquiry] Single Product: ${code}${productName}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 24px; background-color: #f9fafb; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #18181b; color: #ffffff; padding: 24px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
        .header p { margin: 6px 0 0 0; color: #a1a1aa; font-size: 13px; }
        .content { padding: 24px; }
        .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 12px; }
        .item-box { background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .item-box h2 { margin: 0 0 4px 0; font-size: 16px; color: #18181b; }
        .item-meta { font-size: 13px; color: #52525b; margin: 2px 0; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .data-table td { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .data-table td.label { width: 130px; font-weight: 600; color: #4b5563; }
        .data-table td.value { color: #111827; }
        .btn { display: inline-block; background: #c25e00; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px; margin-top: 12px; }
        .footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>New Product Enquiry</h1>
          <p>Received via Citiply Website on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
        </div>
        <div class="content">
          <div class="section-title">Product Details</div>
          <div class="item-box">
            <h2>${escapeHtml(code)}${escapeHtml(productName)}</h2>
            ${product?.collection ? `<p class="item-meta">Collection: <strong>${escapeHtml(product.collection)}</strong></p>` : ""}
            ${product?.category ? `<p class="item-meta">Category: <strong>${escapeHtml(product.category)}</strong></p>` : ""}
            ${values.quantity ? `<p class="item-meta">Customer Requested Quantity: <strong>${escapeHtml(values.quantity)}</strong></p>` : ""}
            ${product?.url ? `<p class="item-meta"><a href="${escapeHtml(product.url)}" style="color:#c25e00;text-decoration:none;">View on website &rarr;</a></p>` : ""}
          </div>

          <div class="section-title">Customer Information</div>
          <table class="data-table">
            <tr><td class="label">Full Name</td><td class="value"><strong>${escapeHtml(values.fullName)}</strong></td></tr>
            ${values.email ? `<tr><td class="label">Email</td><td class="value"><a href="mailto:${escapeHtml(values.email)}" style="color:#c25e00;text-decoration:none;">${escapeHtml(values.email)}</a></td></tr>` : ""}
            <tr><td class="label">Phone</td><td class="value"><a href="tel:${escapeHtml(values.phone)}" style="color:#111827;text-decoration:none;">${escapeHtml(values.phone)}</a></td></tr>
            <tr><td class="label">WhatsApp</td><td class="value">${values.whatsapp ? `<a href="https://wa.me/${escapeHtml(values.whatsapp.replace(/\D/g, ""))}" style="color:#16a34a;text-decoration:none;">${escapeHtml(values.whatsapp)}</a>` : "Not provided"}</td></tr>
            <tr><td class="label">City</td><td class="value">${escapeHtml(values.city)}</td></tr>
            <tr><td class="label">Firm / Company</td><td class="value">${escapeHtml(values.firm || "Not provided")}</td></tr>
            <tr><td class="label">Message</td><td class="value">${escapeHtml(values.message || "None")}</td></tr>
          </table>

          ${siteUrl ? `<a href="${siteUrl}/admin/quotes" class="btn">View in Admin Dashboard &rarr;</a>` : ""}
        </div>
        <div class="footer">
          Citiply Architectural Panels & Veneers &bull; Automated Enquiry Notification
        </div>
      </div>
    </body>
    </html>
  `;

  const adminEmail = getEmailConfig().recipient;
  const recipients = [adminEmail, values.email].filter((e): e is string => Boolean(e && e.includes("@")));

  return dispatchEmail({
    to: recipients.length ? recipients : adminEmail,
    replyTo: values.email || undefined,
    subject,
    html
  });
}

/**
 * Send email notification for multi-product enquiry (Enquiry Drawer Session).
 */
export async function sendEnquiryEmail(
  contact: EnquiryContactDetail,
  items: EnquiryItemDetail[],
  sessionId: string
) {
  const subject = `[New Enquiry] Multi-Product (${items.length} items) — ${contact.full_name}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const rowsHtml = items.map((item, index) => `
    <tr style="background:${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
      <td style="padding:10px 12px;font-family:monospace;font-size:12px;font-weight:600;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.sku)}</td>
      <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e5e7eb;font-weight:500;">${escapeHtml(item.name)}</td>
      <td style="padding:10px 12px;font-size:13px;color:#52525b;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.collectionName || "-")}</td>
      <td style="padding:10px 12px;font-size:13px;color:#18181b;font-weight:600;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.quantity || "1")}</td>
      <td style="padding:10px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.note || "-")}</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 24px; background-color: #f9fafb; }
        .card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #18181b; color: #ffffff; padding: 24px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .header p { margin: 6px 0 0 0; color: #a1a1aa; font-size: 13px; }
        .content { padding: 24px; }
        .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 12px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .data-table td { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .data-table td.label { width: 130px; font-weight: 600; color: #4b5563; }
        .data-table td.value { color: #111827; }
        .items-table { width: 100%; border-collapse: collapse; margin: 12px 0 24px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .items-table th { background: #f4f4f5; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 12px; text-align: left; }
        .btn { display: inline-block; background: #c25e00; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px; margin-top: 8px; }
        .footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>New Multi-Product Enquiry (${items.length} Products)</h1>
          <p>Received via Citiply Website on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
        </div>
        <div class="content">
          <div class="section-title">Customer Information</div>
          <table class="data-table">
            <tr><td class="label">Customer Name</td><td class="value"><strong>${escapeHtml(contact.full_name)}</strong></td></tr>
            ${contact.email ? `<tr><td class="label">Email</td><td class="value"><a href="mailto:${escapeHtml(contact.email)}" style="color:#c25e00;text-decoration:none;">${escapeHtml(contact.email)}</a></td></tr>` : ""}
            <tr><td class="label">Phone</td><td class="value"><a href="tel:${escapeHtml(contact.phone)}" style="color:#111827;text-decoration:none;">${escapeHtml(contact.phone)}</a></td></tr>
            <tr><td class="label">WhatsApp</td><td class="value">${contact.whatsapp ? `<a href="https://wa.me/${escapeHtml(contact.whatsapp.replace(/\D/g, ""))}" style="color:#16a34a;text-decoration:none;">${escapeHtml(contact.whatsapp)}</a>` : "Not provided"}</td></tr>
            <tr><td class="label">City</td><td class="value">${escapeHtml(contact.city)}</td></tr>
            <tr><td class="label">Firm</td><td class="value">${escapeHtml(contact.firm || "Not provided")}</td></tr>
            <tr><td class="label">Customer Message</td><td class="value">${escapeHtml(contact.message || "None")}</td></tr>
            <tr><td class="label">Session ID</td><td class="value"><code style="font-size:12px;background:#f3f4f6;padding:2px 6px;border-radius:4px;">${escapeHtml(sessionId)}</code></td></tr>
          </table>

          <div class="section-title">Enquired Products (${items.length})</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Collection</th>
                <th>Qty</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${siteUrl ? `<a href="${siteUrl}/admin/enquiries" class="btn">View Session in Admin Dashboard &rarr;</a>` : ""}
        </div>
        <div class="footer">
          Citiply Architectural Panels & Veneers &bull; Automated Enquiry Notification
        </div>
      </div>
    </body>
    </html>
  `;

  const adminEmail = getEmailConfig().recipient;
  const recipients = [adminEmail, contact.email].filter((e): e is string => Boolean(e && e.includes("@")));

  return dispatchEmail({
    to: recipients.length ? recipients : adminEmail,
    replyTo: contact.email || undefined,
    subject,
    html
  });
}

/**
 * Send email notification for Project Brief lead submissions.
 */
export async function sendLeadEmail(values: ProjectBriefValues, attachmentUrl?: string | null) {
  const subject = `[Project Brief] New Lead${values.projectType ? ` — ${values.projectType}` : ""}${values.city ? ` — ${values.city}` : ""}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 24px; background-color: #f9fafb; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #18181b; color: #ffffff; padding: 24px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .content { padding: 24px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .data-table td { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .data-table td.label { width: 140px; font-weight: 600; color: #4b5563; }
        .data-table td.value { color: #111827; }
        .footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>New Project Brief Lead</h1>
        </div>
        <div class="content">
          <table class="data-table">
            <tr><td class="label">Project Type</td><td class="value">${escapeHtml(values.projectType || "-")}</td></tr>
            <tr><td class="label">City</td><td class="value">${escapeHtml(values.city || "-")}</td></tr>
            <tr><td class="label">Phone</td><td class="value"><a href="tel:${escapeHtml(values.phone)}">${escapeHtml(values.phone)}</a></td></tr>
            <tr><td class="label">Email</td><td class="value">${escapeHtml(values.email)}</td></tr>
            <tr><td class="label">Required Materials</td><td class="value">${escapeHtml(values.requiredMaterials || "-")}</td></tr>
            <tr><td class="label">Finish / Mood</td><td class="value">${escapeHtml(values.finishMood || "-")}</td></tr>
            <tr><td class="label">Timeline</td><td class="value">${escapeHtml(values.timeline || "-")}</td></tr>
            <tr><td class="label">Attachment</td><td class="value">${attachmentUrl ? `<a href="${escapeHtml(attachmentUrl)}">${escapeHtml(attachmentUrl)}</a>` : "None"}</td></tr>
          </table>
        </div>
        <div class="footer">
          Citiply &bull; Automated Project Lead Notification
        </div>
      </div>
    </body>
    </html>
  `;

  return dispatchEmail({ subject, html });
}
