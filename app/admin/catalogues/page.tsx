"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import { CatalogueForm } from "@/components/admin/CatalogueForm";
import { Button } from "@/components/ui/Button";
import type { CatalogueRow } from "@/lib/supabase/types";

export default function AdminCataloguesPage() {
  const [items, setItems] = useState<CatalogueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogueRow | null>(null);

  async function fetchItems() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/catalogues", { cache: "no-store" });
    const json = (await response.json()) as { data?: CatalogueRow[]; error?: string };
    if (!response.ok) setError(json.error ?? "Could not load catalogues");
    setItems(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchItems(); }, []);

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this catalogue? All associated categories will lose their catalogue assignment.")) return;
    const response = await fetch(`/api/admin/catalogues/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not delete catalogue");
      return;
    }
    await fetchItems();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue Management"
        title="Catalogues"
        description="Manage top-level catalogues. Each catalogue groups related categories together."
        action={<Button onClick={() => { setEditItem(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add Catalogue</Button>}
      />
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <AdminTable headers={["Name", "Slug", "Sort", "Status", <span className="block text-right" key="actions">Actions</span>]} empty={!loading && !items.length}>
        {loading ? <AdminTableRow><AdminTableCell className="text-text-muted" colSpan={5}>Loading catalogues...</AdminTableCell></AdminTableRow> : items.map((catalogue) => (
          <AdminTableRow key={catalogue.id}>
            <AdminTableCell className="font-medium text-text-primary">{catalogue.name}<p className="mt-1 text-xs text-text-muted">{catalogue.description ?? "No description"}</p></AdminTableCell>
            <AdminTableCell className="font-mono text-xs">{catalogue.slug}</AdminTableCell>
            <AdminTableCell>{catalogue.sort_order}</AdminTableCell>
            <AdminTableCell><AdminStatusBadge status={catalogue.is_active ? "active" : "hidden"} /></AdminTableCell>
            <AdminTableCell className="text-right">
              <button className="mr-2 cursor-pointer rounded-full p-2 hover:bg-surface" onClick={() => { setEditItem(catalogue); setOpen(true); }} aria-label={`Edit ${catalogue.name}`}><Edit className="h-4 w-4" /></button>
              <button className="cursor-pointer rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => void deleteItem(catalogue.id)} aria-label={`Delete ${catalogue.name}`}><Trash2 className="h-4 w-4" /></button>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminTable>
      {open ? <AdminModal onClose={() => setOpen(false)}><CatalogueForm initial={editItem} onSaved={() => { setOpen(false); void fetchItems(); }} onCancel={() => setOpen(false)} /></AdminModal> : null}
    </>
  );
}
