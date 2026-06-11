"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Button } from "@/components/ui/Button";
import type { CatalogueRow, CategoryRow } from "@/lib/supabase/types";

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [catalogues, setCatalogues] = useState<CatalogueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<CategoryRow | null>(null);

  async function fetchItems() {
    setLoading(true);
    setError("");
    const [catRes, cataRes] = await Promise.all([
      fetch("/api/admin/categories", { cache: "no-store" }),
      fetch("/api/admin/catalogues", { cache: "no-store" })
    ]);
    const catJson = (await catRes.json()) as { data?: CategoryRow[]; error?: string };
    const cataJson = (await cataRes.json()) as { data?: CatalogueRow[] };
    if (!catRes.ok) setError(catJson.error ?? "Could not load categories");
    setItems(catJson.data ?? []);
    setCatalogues(cataJson.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchItems(); }, []);

  function getCatalogueName(id: string | null) {
    if (!id) return "—";
    return catalogues.find((c) => c.id === id)?.name ?? "—";
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this category?")) return;
    const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not delete category");
      return;
    }
    await fetchItems();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="Manage top-level material families shown across the public catalogue and mega menu."
        action={<Button onClick={() => { setEditItem(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add Category</Button>}
      />
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <AdminTable headers={["Name", "Catalogue", "Slug", "Sort", "Status", <span className="block text-right" key="actions">Actions</span>]} empty={!loading && !items.length}>
        {loading ? <AdminTableRow><AdminTableCell className="text-text-muted" colSpan={6}>Loading categories...</AdminTableCell></AdminTableRow> : items.map((category) => (
          <AdminTableRow key={category.id}>
            <AdminTableCell className="font-medium text-text-primary">{category.name}<p className="mt-1 text-xs text-text-muted">{category.description ?? "No description"}</p></AdminTableCell>
            <AdminTableCell className="text-sm text-text-secondary">{getCatalogueName(category.catalogue_id)}</AdminTableCell>
            <AdminTableCell className="font-mono text-xs">{category.slug}</AdminTableCell>
            <AdminTableCell>{category.sort_order}</AdminTableCell>
            <AdminTableCell><AdminStatusBadge status={category.is_active ? "active" : "hidden"} /></AdminTableCell>
            <AdminTableCell className="text-right">
              <button className="mr-2 cursor-pointer rounded-full p-2 hover:bg-surface" onClick={() => { setEditItem(category); setOpen(true); }} aria-label={`Edit ${category.name}`}><Edit className="h-4 w-4" /></button>
              <button className="cursor-pointer rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => void deleteItem(category.id)} aria-label={`Delete ${category.name}`}><Trash2 className="h-4 w-4" /></button>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminTable>
      {open ? <AdminModal onClose={() => setOpen(false)}><CategoryForm initial={editItem} onSaved={() => { setOpen(false); void fetchItems(); }} onCancel={() => setOpen(false)} /></AdminModal> : null}
    </>
  );
}

