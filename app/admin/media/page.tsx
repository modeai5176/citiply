"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { ProductImageRow, ProductRow } from "@/lib/supabase/types";

type MediaItem = ProductImageRow & { product?: Pick<ProductRow, "sku" | "name" | "collection_id"> | null };

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function fetchItems() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/media", { cache: "no-store" });
    const json = (await response.json()) as { data?: MediaItem[]; error?: string };
    if (!response.ok) setError(json.error ?? "Could not load media");
    setItems(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchItems(); }, []);

  const filtered = useMemo(() => items.filter((item) => `${item.product?.sku ?? ""} ${item.product?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())), [items, search]);

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this media row?")) return;
    const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not delete media");
      return;
    }
    await fetchItems();
  }

  return (
    <>
      <AdminPageHeader eyebrow="Assets" title="Media Library" description="Review product images currently attached to catalogue SKUs. Deleting removes the database reference." />
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
        <input className="h-10 w-full max-w-md rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-accent" placeholder="Search by SKU or product" value={search} onChange={(event) => setSearch(event.target.value)} />
        <span className="self-center text-sm text-text-muted">{filtered.length} assets</span>
      </div>
      {loading ? <div className="rounded-xl border border-border bg-white p-8 text-text-muted">Loading media...</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((item) => (
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:shadow-md" key={item.id}>
            <div className="relative aspect-square"><Image src={item.thumbnail_url || item.image_url} alt={item.product?.name ?? "Product media"} fill sizes="25vw" className="object-cover" /></div>
            <div className="p-3">
              <p className="font-mono text-xs tracking-widest">{item.product?.sku ?? "MEDIA"}</p>
              <p className="mt-1 text-sm text-text-secondary">{item.kind}</p>
              <button className="mt-2 text-sm text-red-600" onClick={() => void deleteItem(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {!loading && !filtered.length ? <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-text-secondary">No media records found.</div> : null}
    </>
  );
}
