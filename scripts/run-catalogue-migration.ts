const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sql = `
CREATE TABLE IF NOT EXISTS public.catalogues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS catalogue_id uuid REFERENCES public.catalogues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_catalogues_active_sort ON public.catalogues (is_active, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_categories_catalogue_id ON public.categories (catalogue_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON public.categories (is_active, sort_order, name);

ALTER TABLE public.catalogues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_catalogues ON public.catalogues;
CREATE POLICY public_read_catalogues ON public.catalogues FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS admin_all_catalogues ON public.catalogues;
CREATE POLICY admin_all_catalogues ON public.catalogues FOR ALL USING (auth.role() = 'authenticated');

GRANT SELECT ON public.catalogues TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalogues TO authenticated, service_role;
`;

async function run() {
  // Supabase project ref from URL
  const ref = url.replace("https://", "").replace(".supabase.co", "");
  
  // Use the Supabase Management API to run SQL
  // But we don't have the management API key, so let's use the pg REST approach
  // Actually, let's use the /rest/v1/rpc endpoint with a custom function approach
  
  // Simpler: use the supabase-js client with raw query via RPC
  // Since we can't run raw SQL directly, let's try the sql endpoint
  const res = await fetch(`${url}/rest/v1/rpc/`, {
    method: "POST",  
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({})
  });
  
  console.log("Cannot run raw SQL via REST API directly.");
  console.log("Please go to your Supabase Dashboard SQL Editor and run the migration SQL.");
  console.log("");
  console.log("Supabase Dashboard: https://supabase.com/dashboard/project/" + ref + "/sql");
  console.log("");
  console.log("SQL to run:");
  console.log(sql);
}

run();
