"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import type { QuoteRequestRow } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

type QuoteStatus = "pending" | "contacted" | "closed";

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchQuotes() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/quotes", { cache: "no-store" });
    const json = (await response.json()) as { data?: QuoteRequestRow[]; error?: string };
    if (!response.ok) setError(json.error ?? "Could not load quotes");
    setQuotes(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchQuotes(); }, []);

  async function updateStatus(id: string, status: QuoteStatus) {
    const response = await fetch(`/api/admin/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not update quote");
      return;
    }
    await fetchQuotes();
  }

  const filtered = useMemo(() => quotes.filter((quote) => {
    const matchesSearch = `${quote.full_name} ${quote.phone} ${quote.city} ${quote.product_code ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [quotes, search, statusFilter]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Sales"
        title="Quote Requests"
        description="Review enquiries, open WhatsApp, and move each request through pending, contacted, and closed states."
      />
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
        <input className="h-10 min-w-72 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-accent" placeholder="Search name, phone, city, product" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-10 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-accent" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
        <span className="self-center text-sm text-text-muted">{filtered.length} requests</span>
      </div>
      <AdminTable headers={["", "Date", "Name", "Phone", "Product", "City", "Status"]} empty={!loading && !filtered.length}>
        {loading ? <AdminTableRow><AdminTableCell colSpan={7}>Loading quotes...</AdminTableCell></AdminTableRow> : filtered.map((quote) => (
          <Fragment key={quote.id}>
            <AdminTableRow onClick={() => setExpanded(expanded === quote.id ? null : quote.id)}>
              <AdminTableCell><ChevronDown className={`h-4 w-4 transition ${expanded === quote.id ? "rotate-180" : ""}`} /></AdminTableCell>
              <AdminTableCell>{formatDate(quote.created_at)}</AdminTableCell>
              <AdminTableCell className="font-medium text-text-primary">{quote.full_name}<p className="mt-1 text-xs text-text-muted">{quote.firm ?? "No firm"}</p></AdminTableCell>
              <AdminTableCell>{quote.phone}</AdminTableCell>
              <AdminTableCell className="font-mono text-xs tracking-widest">{quote.product_code ?? "GENERAL"}</AdminTableCell>
              <AdminTableCell>{quote.city}</AdminTableCell>
              <AdminTableCell>
                <div onClick={(event) => event.stopPropagation()}>
                  <select className="rounded-full border border-border bg-white px-3 py-1 text-xs" value={quote.status} onChange={(event) => void updateStatus(quote.id, event.target.value as QuoteStatus)}>
                    <option value="pending">pending</option>
                    <option value="contacted">contacted</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
              </AdminTableCell>
            </AdminTableRow>
            {expanded === quote.id ? (
              <tr className="border-t border-border bg-surface/60">
                <td className="px-4 py-5" colSpan={7}>
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <p><span className="text-text-muted">Firm:</span> {quote.firm ?? "-"}</p>
                    <p><span className="text-text-muted">WhatsApp:</span> {quote.whatsapp ? <a className="text-accent" href={`https://wa.me/${quote.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{quote.whatsapp}</a> : "-"}</p>
                    <p><span className="text-text-muted">Quantity:</span> {quote.quantity ?? "-"}</p>
                    <p className="md:col-span-3"><span className="text-text-muted">Message:</span> {quote.message ?? "-"}</p>
                  </div>
                  <button className="mt-4 rounded-full bg-accent px-4 py-2 text-sm text-white" onClick={() => void updateStatus(quote.id, "contacted")}>Mark as contacted</button>
                  <span className="ml-3"><AdminStatusBadge status={(quote.status || "pending") as QuoteStatus} /></span>
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </AdminTable>
    </>
  );
}
