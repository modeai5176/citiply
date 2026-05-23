"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";

type EnquiryStatus = "pending" | "contacted" | "closed";
type EnquiryItem = {
  id: string;
  product_code: string;
  product_name: string;
  collection_name: string | null;
  category_name: string | null;
  quantity: string | null;
  note: string | null;
};
type EnquirySession = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  firm: string | null;
  city: string;
  message: string | null;
  status: EnquiryStatus;
  enquiry_items: EnquiryItem[];
};

export default function AdminEnquiriesPage() {
  const [sessions, setSessions] = useState<EnquirySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function fetchEnquiries() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/enquiries", { cache: "no-store" });
    const json = (await response.json()) as { data?: EnquirySession[]; error?: string };
    if (!response.ok) setError(json.error ?? "Could not load enquiries");
    setSessions(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchEnquiries(); }, []);

  async function updateStatus(id: string, status: EnquiryStatus) {
    const response = await fetch("/api/admin/enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not update enquiry");
      return;
    }
    await fetchEnquiries();
  }

  const filtered = useMemo(() => sessions.filter((session) => {
    const haystack = `${session.full_name} ${session.phone} ${session.city} ${session.firm ?? ""} ${session.enquiry_items.map((item) => `${item.product_code} ${item.product_name}`).join(" ")}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (!statusFilter || session.status === statusFilter);
  }), [sessions, search, statusFilter]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Sales"
        title="Product Enquiries"
        description="Review multi-product enquiry lists, product notes, and contact status."
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
        <span className="self-center text-sm text-text-muted">{filtered.length} enquiries</span>
      </div>
      <AdminTable headers={["", "Date", "Name", "Phone", "City", "Products", "Status"]} empty={!loading && !filtered.length}>
        {loading ? <AdminTableRow><AdminTableCell colSpan={7}>Loading enquiries...</AdminTableCell></AdminTableRow> : filtered.map((session) => {
          const whatsappNumber = (session.whatsapp || session.phone).replace(/\D/g, "");
          const whatsappText = encodeURIComponent(`Hi ${session.full_name}, regarding your Citiply enquiry.`);
          return (
            <Fragment key={session.id}>
              <AdminTableRow onClick={() => setExpanded(expanded === session.id ? null : session.id)}>
                <AdminTableCell><ChevronDown className={`h-4 w-4 transition ${expanded === session.id ? "rotate-180" : ""}`} /></AdminTableCell>
                <AdminTableCell>{formatDate(session.created_at)}</AdminTableCell>
                <AdminTableCell className="font-medium text-text-primary">{session.full_name}<p className="mt-1 text-xs text-text-muted">{session.firm ?? "No firm"}</p></AdminTableCell>
                <AdminTableCell>{session.phone}</AdminTableCell>
                <AdminTableCell>{session.city}</AdminTableCell>
                <AdminTableCell><span className="rounded-full bg-surface px-3 py-1 text-xs font-medium">{session.enquiry_items.length} products</span></AdminTableCell>
                <AdminTableCell>
                  <div onClick={(event) => event.stopPropagation()}>
                    <select className="rounded-full border border-border bg-white px-3 py-1 text-xs" value={session.status} onChange={(event) => void updateStatus(session.id, event.target.value as EnquiryStatus)}>
                      <option value="pending">pending</option>
                      <option value="contacted">contacted</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </AdminTableCell>
              </AdminTableRow>
              {expanded === session.id ? (
                <tr className="border-t border-border bg-surface/60">
                  <td className="px-4 py-5" colSpan={7}>
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <p><span className="text-text-muted">Phone:</span> <a className="text-accent" href={`tel:${session.phone}`}>{session.phone}</a></p>
                      <p><span className="text-text-muted">WhatsApp:</span> <a className="text-accent" href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} target="_blank" rel="noreferrer">{session.whatsapp ?? session.phone}</a></p>
                      <p><span className="text-text-muted">Firm:</span> {session.firm ?? "-"}</p>
                      <p className="md:col-span-3"><span className="text-text-muted">Message:</span> {session.message ?? "-"}</p>
                    </div>
                    <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-surface text-xs uppercase tracking-[0.16em] text-text-muted">
                          <tr><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Collection</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Note</th></tr>
                        </thead>
                        <tbody>
                          {session.enquiry_items.map((item) => (
                            <tr className="border-t border-border" key={item.id}>
                              <td className="px-4 py-3 font-mono text-xs">{item.product_code}</td>
                              <td className="px-4 py-3">{item.product_name}<p className="text-xs text-text-muted">{item.category_name ?? "-"}</p></td>
                              <td className="px-4 py-3">{item.collection_name ?? "-"}</td>
                              <td className="px-4 py-3">{item.quantity ?? "-"}</td>
                              <td className="px-4 py-3">{item.note ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <button className="rounded-full bg-accent px-4 py-2 text-sm text-white" onClick={() => void updateStatus(session.id, "contacted")}>Mark as contacted</button>
                      <AdminStatusBadge status={session.status} />
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          );
        })}
      </AdminTable>
    </>
  );
}
