"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductDetailsModal } from "@/components/admin/ProductDetailsModal";
import { Button } from "@/components/ui/Button";
import type { CollectionRow, ProductImageRow, ProductRow, ProductSpecRow } from "@/lib/supabase/types";

import { useProductsStore, type ProductSortOption } from "@/lib/stores/products-store";

export default function AdminProductsPage() {
  const {
    products: items,
    collections,
    loading,
    error,
    search,
    setSearch,
    collectionFilter,
    setCollectionFilter,
    sortBy,
    setSortBy,
    selected,
    setSelected,
    toggleSelected,
    selectAll,
    fetchProducts,
    deleteProduct,
    bulkPublish,
    setError
  } = useProductsStore();

  const [open, setOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<ProductRow | null>(null);
  const [editItem, setEditItem] = useState<ProductRow | null>(null);
  const [editSpecs, setEditSpecs] = useState<ProductSpecRow[]>([]);
  const [editImages, setEditImages] = useState<ProductImageRow[]>([]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    const list = items.filter((product) =>
      (`${product.sku} ${product.name}`.toLowerCase().includes(search.toLowerCase())) &&
      (!collectionFilter || product.collection_id === collectionFilter)
    );

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "recently_added": {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA;
        }
        case "recently_modified": {
          const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
          const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
          return timeB - timeA;
        }
        case "name_asc":
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        case "name_desc":
          return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
        default:
          return 0;
      }
    });
  }, [items, search, collectionFilter, sortBy]);

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

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this product?")) return;
    await deleteProduct(id);
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
        <select
          className="h-10 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-accent font-medium text-text-primary"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as ProductSortOption)}
        >
          <option value="recently_added">Recently Added</option>
          <option value="recently_modified">Recently Modified</option>
          <option value="name_asc">Name: A → Z</option>
          <option value="name_desc">Name: Z → A</option>
        </select>
        <span className="text-sm text-text-muted">{filtered.length} shown</span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" className="px-4 py-2" disabled={!selected.length} onClick={() => void bulkPublish(true)}>Publish</Button>
          <Button type="button" variant="ghost" className="px-4 py-2" disabled={!selected.length} onClick={() => void bulkPublish(false)}>Unpublish</Button>
        </div>
      </div>
      <AdminTable headers={[<input type="checkbox" key="select" aria-label="Select all" checked={!!filtered.length && selected.length === filtered.length} onChange={(event) => event.target.checked ? selectAll(filtered.map((product) => product.id)) : setSelected([])} />, "SKU", "Name", "Collection", "Status", <span className="block text-right" key="actions">Actions</span>]} empty={!loading && !filtered.length}>
        {loading ? <AdminTableRow><AdminTableCell colSpan={6}>Loading products...</AdminTableCell></AdminTableRow> : filtered.map((product) => {
          const collection = collections.find((item) => item.id === product.collection_id);
          return (
            <AdminTableRow key={product.id} onClick={() => setDetailsItem(product)}>
              <AdminTableCell>
                <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelected(product.id)} aria-label={`Select ${product.sku}`} />
                </div>
              </AdminTableCell>
              <AdminTableCell className="font-mono text-xs tracking-widest text-text-primary">{product.sku}</AdminTableCell>
              <AdminTableCell className="font-medium text-text-primary">
                {product.name}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {product.color_tone ? <span className="text-xs text-text-muted">{product.color_tone}</span> : null}
                  {product.quantity ? <span className="rounded border border-border bg-ivory px-1.5 py-0.5 text-xs text-text-secondary">Qty: {product.quantity}</span> : null}
                </div>
              </AdminTableCell>
              <AdminTableCell>{collection?.name ?? "-"}</AdminTableCell>
              <AdminTableCell><AdminStatusBadge status={product.is_active ? "active" : "hidden"} /></AdminTableCell>
              <AdminTableCell className="text-right">
                <div onClick={(e: React.MouseEvent) => e.stopPropagation()} className="inline-flex items-center">
                  <button className="mr-2 cursor-pointer rounded-full p-2 hover:bg-surface" onClick={() => void openEdit(product)} aria-label={`Edit ${product.sku}`}><Edit className="h-4 w-4" /></button>
                  <button className="cursor-pointer rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => void handleDelete(product.id)} aria-label={`Delete ${product.sku}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          );
        })}
      </AdminTable>

      {/* Product Details Modal */}
      {detailsItem ? (
        <AdminModal wide onClose={() => setDetailsItem(null)}>
          <ProductDetailsModal
            product={detailsItem}
            collections={collections}
            onEdit={() => {
              const itemToEdit = detailsItem;
              setDetailsItem(null);
              void openEdit(itemToEdit);
            }}
            onDelete={() => {
              const idToDelete = detailsItem.id;
              void handleDelete(idToDelete).then(() => {
                setDetailsItem(null);
              });
            }}
            onClose={() => setDetailsItem(null)}
          />
        </AdminModal>
      ) : null}

      {/* Product Edit / Create Modal */}
      {open ? (
        <AdminModal wide onClose={() => setOpen(false)}>
          <ProductForm
            key={editItem?.id ?? "new-product"}
            initial={editItem}
            initialSpecs={editSpecs}
            initialImages={editImages}
            onSaved={() => { setOpen(false); void fetchProducts(); }}
            onCancel={() => setOpen(false)}
          />
        </AdminModal>
      ) : null}
    </>
  );
}
