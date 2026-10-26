import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const migrationSQL = `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity text;`;

async function checkQuantityColumn() {
  const ref = url.replace("https://", "").replace(".supabase.co", "");
  console.log("Checking Supabase database for 'products.quantity' column...\n");

  const { data, error } = await supabase
    .from("products")
    .select("id, sku, quantity")
    .limit(1);

  if (error && error.message.includes("quantity")) {
    console.log("⚠️  The 'quantity' column does not exist on 'products' table in Supabase yet.");
    console.log("\nTo apply the migration, please run the following SQL command in your Supabase SQL Editor:");
    console.log("─".repeat(70));
    console.log(migrationSQL);
    console.log("─".repeat(70));
    console.log(`\nDirect Link to Supabase SQL Editor:\nhttps://supabase.com/dashboard/project/${ref}/sql/new\n`);
    process.exit(1);
  } else if (error) {
    console.error("Error checking products table:", error.message);
    process.exit(1);
  } else {
    console.log("✅ 'products.quantity' column exists and is accessible in Supabase!");
    console.log("Sample row queried:", data?.[0] ? { id: data[0].id, sku: data[0].sku, quantity: data[0].quantity } : "No products found in table yet.");
  }
}

void checkQuantityColumn();
