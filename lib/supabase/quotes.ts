import type { Database } from "@/lib/supabase/types";

type QuoteInsert = Database["public"]["Tables"]["quote_requests"]["Insert"];

export async function saveQuoteRequest(payload: QuoteInsert) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return { skipped: true };

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/quote_requests`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=minimal"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not save quote request");
  }

  return { skipped: false };
}
