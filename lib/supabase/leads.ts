import type { Database } from "@/lib/supabase/types";

type ProjectLeadInsert = Database["public"]["Tables"]["project_leads"]["Insert"];

// Mirrors saveQuoteRequest: posts directly to the Supabase REST API and skips
// gracefully when the env (or table) is not configured, so the public lead
// form never hard-fails the request.
export async function saveProjectLead(payload: ProjectLeadInsert) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return { skipped: true };

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/project_leads`, {
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
    throw new Error(message || "Could not save project lead");
  }

  return { skipped: false };
}
