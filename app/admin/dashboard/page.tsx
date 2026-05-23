import { AlertCircle, CheckCircle2, Clock3, FolderTree, Layers3, Package, Quote } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CategoryRow, ProductRow, QuoteRequestRow } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const [
    categoryResult,
    collectionResult,
    productResult,
    activeProductResult,
    hiddenProductResult,
    pendingResult,
    contactedResult,
    closedResult,
    quotesResult,
    categoriesResult,
    productsForBreakdownResult
  ] = await Promise.all([
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("collections").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", false),
    supabase.from("quote_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("quote_requests").select("*", { count: "exact", head: true }).eq("status", "contacted"),
    supabase.from("quote_requests").select("*", { count: "exact", head: true }).eq("status", "closed"),
    supabase.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("category_id,is_active")
  ]);

  const recentQuotes = (quotesResult.data ?? []) as QuoteRequestRow[];
  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const products = (productsForBreakdownResult.data ?? []) as Pick<ProductRow, "category_id" | "is_active">[];

  return (
    <>
      <AdminPageHeader
        eyebrow="Overview"
        title="Catalogue Operations"
        description="Live Supabase counts, recent quote requests, and publication coverage across the material catalogue."
        action={<Button href="/admin/products">Manage Products</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={FolderTree} label="Categories" value={categoryResult.count ?? 0} hint="Material families in the catalogue" />
        <AdminMetricCard icon={Layers3} label="Collections" value={collectionResult.count ?? 0} hint="Ranges mapped to categories" />
        <AdminMetricCard icon={Package} label="Products" value={productResult.count ?? 0} hint={`${activeProductResult.count ?? 0} active, ${hiddenProductResult.count ?? 0} hidden`} />
        <AdminMetricCard icon={Quote} label="Pending Quotes" value={pendingResult.count ?? 0} hint={`${contactedResult.count ?? 0} contacted, ${closedResult.count ?? 0} closed`} />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Quote Requests</h2>
            <Button href="/admin/quotes" variant="ghost" className="px-4 py-2">View All</Button>
          </div>
          <AdminTable headers={["Received", "Name", "Product", "City", "Status"]} empty={!recentQuotes.length}>
            {recentQuotes.map((quote) => (
              <AdminTableRow key={quote.id}>
                <AdminTableCell>{formatDate(quote.created_at)}</AdminTableCell>
                <AdminTableCell className="font-medium text-text-primary">{quote.full_name}<p className="mt-1 text-xs text-text-muted">{quote.phone}</p></AdminTableCell>
                <AdminTableCell className="font-mono text-xs tracking-widest">{quote.product_code ?? "GENERAL"}</AdminTableCell>
                <AdminTableCell>{quote.city}</AdminTableCell>
                <AdminTableCell><AdminStatusBadge status={(quote.status || "pending") as "pending" | "contacted" | "closed"} /></AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Category Coverage</h2>
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="grid gap-3">
              {categories.map((category) => {
                const total = products.filter((product) => product.category_id === category.id).length;
                const active = products.filter((product) => product.category_id === category.id && product.is_active).length;
                const percent = total ? Math.round((active / total) * 100) : 0;
                return (
                  <div key={category.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-text-primary">{category.name}</span>
                      <span className="text-text-muted">{active}/{total}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-xl border border-border bg-white p-4"><Clock3 className="h-5 w-5 text-amber-600" /><p className="mt-2 text-sm text-text-secondary">Pending requests need first response.</p></div>
            <div className="rounded-xl border border-border bg-white p-4"><CheckCircle2 className="h-5 w-5 text-green-600" /><p className="mt-2 text-sm text-text-secondary">Active products are visible publicly after page refresh.</p></div>
            <div className="rounded-xl border border-border bg-white p-4"><AlertCircle className="h-5 w-5 text-text-muted" /><p className="mt-2 text-sm text-text-secondary">Uploads require configured S3 credentials.</p></div>
          </div>
        </section>
      </div>
    </>
  );
}
