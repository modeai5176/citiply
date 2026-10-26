import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as WebSocketLikeConstructor }
  }
);

async function testSingleQuote() {
  console.log("\n=================================================");
  console.log("  Task 6.1.1 — Single Product Enquiry Flow Test  ");
  console.log("=================================================");

  const payload = {
    fullName: "Test Architect Single",
    phone: "+91 9876543210",
    whatsapp: "+91 9876543210",
    firm: "Architectural Studio Mumbai",
    city: "Mumbai",
    productCode: "EVERGREEN-WHITE-OAK-LOT-1202-45",
    quantity: "25 sheets",
    message: "Automated QA test for Phase 6 single product quote"
  };

  console.log("1. Submitting quote request to http://localhost:3000/api/quote...");
  const res = await fetch("http://localhost:3000/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const responseJson = await res.json();
  console.log(`   API Response status: ${res.status}`, responseJson);

  if (res.status !== 200 || !responseJson.ok) {
    throw new Error(`Failed to submit quote: ${JSON.stringify(responseJson)}`);
  }
  console.log("   ✓ API returned { ok: true }");

  console.log("2. Verifying record in Supabase 'quote_requests' table...");
  const { data: record, error } = await db
    .from("quote_requests")
    .select("*")
    .eq("full_name", payload.fullName)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !record) {
    throw new Error(`Failed to find quote_request in database: ${error?.message}`);
  }

  console.log("   ✓ Found record in Supabase:", {
    id: record.id,
    full_name: record.full_name,
    product_code: record.product_code,
    quantity: record.quantity,
    city: record.city,
    created_at: record.created_at
  });

  console.log("3. Verifying admin quotes endpoint accessibility...");
  const adminRes = await fetch("http://localhost:3000/admin/quotes");
  console.log(`   /admin/quotes status: ${adminRes.status} ${adminRes.statusText}`);

  return record;
}

async function testMultiProductEnquiry() {
  console.log("\n=================================================");
  console.log("  Task 6.1.2 — Multi-Product Enquiry Flow Test  ");
  console.log("=================================================");

  // Pick 3 products from evergreen oak
  const { data: prods } = await db
    .from("products")
    .select("id, sku, name")
    .eq("is_active", true)
    .limit(3);

  if (!prods || prods.length < 2) {
    throw new Error("Could not find enough active products for multi-item test");
  }

  const payload = {
    contact: {
      full_name: "Test Lead Architect Multi",
      phone: "+91 9811122233",
      whatsapp: "+91 9811122233",
      firm: "Apex Interiors & Panels",
      city: "Bengaluru",
      message: "Automated QA test for Phase 6 multi-item enquiry"
    },
    items: prods.map((p, idx) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      collectionName: "Oak",
      categoryName: "Evergreen",
      quantity: `${(idx + 1) * 15} sheets`,
      note: `Requirement for Block ${String.fromCharCode(65 + idx)}`
    }))
  };

  console.log(`1. Submitting multi-item enquiry (${payload.items.length} items) to http://localhost:3000/api/enquiry...`);
  const res = await fetch("http://localhost:3000/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const responseJson = await res.json();
  console.log(`   API Response status: ${res.status}`, responseJson);

  if (res.status !== 200 || !responseJson.success) {
    throw new Error(`Failed to submit enquiry: ${JSON.stringify(responseJson)}`);
  }
  const sessionId = responseJson.sessionId;
  console.log(`   ✓ API returned success with sessionId: ${sessionId}`);

  console.log("2. Verifying record in database (enquiry_sessions or quote_requests)...");
  const { data: session } = await db
    .from("enquiry_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (session) {
    console.log("   ✓ Found in enquiry_sessions table:", {
      id: session.id,
      full_name: session.full_name,
      city: session.city
    });
    const { data: items } = await db.from("enquiry_items").select("*").eq("session_id", sessionId);
    console.log(`   ✓ Found ${items?.length ?? 0} line items in enquiry_items`);
  } else {
    const { data: quoteReq } = await db
      .from("quote_requests")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (quoteReq) {
      console.log("   ✓ Found in quote_requests table (resilient fallback):", {
        id: quoteReq.id,
        full_name: quoteReq.full_name,
        city: quoteReq.city,
        product_code: quoteReq.product_code,
        quantity: quoteReq.quantity
      });
    } else {
      throw new Error(`Record with sessionId ${sessionId} not found in database!`);
    }
  }

  console.log("4. Verifying admin enquiries endpoint accessibility...");
  const adminRes = await fetch("http://localhost:3000/admin/enquiries");
  console.log(`   /admin/enquiries status: ${adminRes.status} ${adminRes.statusText}`);

  return { success: true, sessionId };
}

async function main() {
  await testSingleQuote();
  await testMultiProductEnquiry();
  console.log("\n=================================================");
  console.log("✅ All Section 6.1 Tests Passed Successfully!");
  console.log("=================================================\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
