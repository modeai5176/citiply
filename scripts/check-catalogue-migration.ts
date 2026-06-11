import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function migrate() {
  console.log("Running catalogue migration...");

  // 1. Create catalogues table via raw SQL
  const sqlRes = await fetch(`${url}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    }
  }).catch(() => null);

  // Try creating the table using the Supabase SQL API
  const createTableSQL = `
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

  // Execute via Supabase Management API / SQL endpoint
  const mgmtRes = await fetch(`${url}/rest/v1/`, {
    method: "HEAD",
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  }).catch(() => null);

  // Try querying the table first
  const { data, error } = await supabase.from("catalogues").select("id").limit(1);
  
  if (error && error.message.includes("catalogues")) {
    console.log("⚠️  The 'catalogues' table does not exist in Supabase yet.");
    console.log("");
    console.log("Please run this SQL in your Supabase Dashboard (SQL Editor):");
    console.log("─".repeat(60));
    console.log(createTableSQL);
    console.log("─".repeat(60));
    process.exit(1);
  } else if (error) {
    console.log("Query error:", error.message);
  } else {
    console.log("✅ 'catalogues' table exists. Rows found:", data?.length ?? 0);
  }
  
  // Check if categories has catalogue_id column
  const { data: catData, error: catError } = await supabase
    .from("categories")
    .select("catalogue_id")
    .limit(1);
  
  if (catError && catError.message.includes("catalogue_id")) {
    console.log("⚠️  The 'catalogue_id' column does not exist on categories yet.");
    console.log("Add it via the SQL above.");
  } else {
    console.log("✅ 'categories.catalogue_id' column exists.");
  }
}

migrate();
