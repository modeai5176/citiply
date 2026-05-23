"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/Button";
import type { CollectionRow, ProductImageRow, ProductRow, ProductSpecRow } from "@/lib/supabase/types";

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProductRow | null>(null);
  const [editSpecs, setEditSpecs] = useState<ProductSpecRow[]>([]);
  const [editImages, setEditImages] = useState<ProductImageRow[]>([]);

  async function fetchItems() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const json = (await response.json()) as { data?: ProductRow[]; collections?: CollectionRow[]; error?: string };
    if (!response.ok) setError(json.error ?? "Could not load products");
    setItems(json.data ?? []);
    setCollections(json.collections ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchItems(); }, []);

  const filtered = useMemo(() => items.filter((product) =>
    (`${product.sku} ${product.name}`.toLowerCase().includes(search.toLowerCase())) &&
    (!collectionFilter || product.collection_id === collectionFilter)
  ), [items, search, collectionFilter]);

  async function openEdit(product: ProductRow) {
    const response = await fetch(`/api/admin/products/${product.id}`, { cache: "no-store" });
    const json = (await response.json()) as { specs?: ProductSpecRow[]; images?: ProductImageRow[]; error?: string };
    if (!response.ok) {
      setError(json.error ?? "Could not load product details");
      return;
    }
    setEditItem(product);
    setEditSpecs(json.specs ?? []);
    setEditImages(json.images ?? []);
    setOpen(true);
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not delete product");
      return;
    }
    await fetchItems();
  }

  async function bulkPublish(active: boolean) {
    if (!selected.length) return;
    const response = await fetch("/api/admin/products/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, is_active: active })
    });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not update products");
      return;
    }
    setSelected([]);
    await fetchItems();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Search, filter, publish, and maintain product specifications, images, and SEO fields."
        action={<Button onClick={() => { setEditItem(null); setEditSpecs([]); setEditImages([]); setOpen(true); }}><Plus className="h-4 w-4" /> Add Product</Button>}
      />
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
        <input className="h-10 min-w-72 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-accent" placeholder="Search SKU or name" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-10 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-accent" value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}>
          <option value="">All collections</option>
          {collections.map((collection) => <option value={collection.id} key={collection.id}>{collection.name}</option>)}
        </select>
        <span className="text-sm text-text-muted">{filtered.length} shown</span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" className="px-4 py-2" disabled={!selected.length} onClick={() => void bulkPublish(true)}>Publish</Button>
          <Button type="button" variant="ghost" className="px-4 py-2" disabled={!selected.length} onClick={() => void bulkPublish(false)}>Unpublish</Button>
        </div>
      </div>
      <AdminTable headers={[<input type="checkbox" key="select" aria-label="Select all" checked={!!filtered.length && selected.length === filtered.length} onChange={(event) => setSelected(event.target.checked ? filtered.map((product) => product.id) : [])} />, "SKU", "Name", "Collection", "Status", <span className="block text-right" key="actions">Actions</span>]} empty={!loading && !filtered.length}>
        {loading ? <AdminTableRow><AdminTableCell colSpan={6}>Loading products...</AdminTableCell></AdminTableRow> : filtered.map((product) => {
          const collection = collections.find((item) => item.id === product.collection_id);
          return (
            <AdminTableRow key={product.id}>
              <AdminTableCell><input type="checkbox" checked={selected.includes(product.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, product.id] : selected.filter((id) => id !== product.id))} aria-label={`Select ${product.sku}`} /></AdminTableCell>
              <AdminTableCell className="font-mono text-xs tracking-widest text-text-primary">{product.sku}</AdminTableCell>
              <AdminTableCell className="font-medium text-text-primary">{product.name}<p className="mt-1 text-xs text-text-muted">{product.finish ?? "No finish"} / {product.color_tone ?? "No tone"}</p></AdminTableCell>
              <AdminTableCell>{collection?.name ?? "-"}</AdminTableCell>
              <AdminTableCell><AdminStatusBadge status={product.is_active ? "active" : "hidden"} /></AdminTableCell>
              <AdminTableCell className="text-right">
                <button className="mr-2 cursor-pointer rounded-full p-2 hover:bg-surface" onClick={() => void openEdit(product)} aria-label={`Edit ${product.sku}`}><Edit className="h-4 w-4" /></button>
                <button className="cursor-pointer rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => void deleteItem(product.id)} aria-label={`Delete ${product.sku}`}><Trash2 className="h-4 w-4" /></button>
              </AdminTableCell>
            </AdminTableRow>
          );
        })}
      </AdminTable>
      {open ? (
        <AdminModal wide onClose={() => setOpen(false)}>
          <ProductForm
            key={editItem?.id ?? "new-product"}
            initial={editItem}
            initialSpecs={editSpecs}
            initialImages={editImages}
            onSaved={() => { setOpen(false); void fetchItems(); }}
            onCancel={() => setOpen(false)}
          />
        </AdminModal>
      ) : null}
    </>
  );
}
