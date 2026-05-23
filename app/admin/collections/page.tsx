"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { Button } from "@/components/ui/Button";
import type { CategoryRow, CollectionRow } from "@/lib/supabase/types";

export default function AdminCollectionsPage() {
  const [items, setItems] = useState<CollectionRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<CollectionRow | null>(null);

  async function fetchItems() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/collections", { cache: "no-store" });
    const json = (await response.json()) as { data?: CollectionRow[]; categories?: CategoryRow[]; error?: string };
    if (!response.ok) setError(json.error ?? "Could not load collections");
    setItems(json.data ?? []);
    setCategories(json.categories ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchItems(); }, []);

  const filtered = useMemo(() => items.filter((item) => !categoryFilter || item.category_id === categoryFilter), [items, categoryFilter]);

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this collection?")) return;
    const response = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not delete collection");
      return;
    }
    await fetchItems();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Collections"
        description="Create and maintain collection banners, brochure links, featured status, and category assignment."
        action={<Button onClick={() => { setEditItem(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add Collection</Button>}
      />
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
        <select className="h-10 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-accent" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
        <span className="text-sm text-text-muted">{filtered.length} collections</span>
      </div>
      <AdminTable headers={["Name", "Category", "Featured", "Status", <span className="block text-right" key="actions">Actions</span>]} empty={!loading && !filtered.length}>
        {loading ? <AdminTableRow><AdminTableCell colSpan={5}>Loading collections...</AdminTableCell></AdminTableRow> : filtered.map((collection) => {
          const category = categories.find((item) => item.id === collection.category_id);
          return (
            <AdminTableRow key={collection.id}>
              <AdminTableCell className="font-medium text-text-primary">{collection.name}<p className="mt-1 font-mono text-xs text-text-muted">{collection.slug}</p></AdminTableCell>
              <AdminTableCell>{category?.name ?? "-"}</AdminTableCell>
              <AdminTableCell>{collection.is_featured ? <AdminStatusBadge status="featured" /> : <span className="text-text-muted">Standard</span>}</AdminTableCell>
              <AdminTableCell><AdminStatusBadge status={collection.is_active ? "active" : "hidden"} /></AdminTableCell>
              <AdminTableCell className="text-right">
                <button className="mr-2 cursor-pointer rounded-full p-2 hover:bg-surface" onClick={() => { setEditItem(collection); setOpen(true); }} aria-label={`Edit ${collection.name}`}><Edit className="h-4 w-4" /></button>
                <button className="cursor-pointer rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => void deleteItem(collection.id)} aria-label={`Delete ${collection.name}`}><Trash2 className="h-4 w-4" /></button>
              </AdminTableCell>
            </AdminTableRow>
          );
        })}
      </AdminTable>
      {open ? <AdminModal onClose={() => setOpen(false)}><CollectionForm initial={editItem} onSaved={() => { setOpen(false); void fetchItems(); }} onCancel={() => setOpen(false)} /></AdminModal> : null}
    </>
  );
}
