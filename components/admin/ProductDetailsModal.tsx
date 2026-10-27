"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Download, Edit, ExternalLink, Layers, Package, Trash2 } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductCodeBadge } from "@/components/ui/ProductCodeBadge";
import { formatDate } from "@/lib/utils";
import type { CollectionRow, ProductImageRow, ProductRow, ProductSpecRow } from "@/lib/supabase/types";

export function ProductDetailsModal({
  product,
  collections,
  onEdit,
  onDelete,
  onClose
}: {
  product: ProductRow;
  collections: CollectionRow[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [specs, setSpecs] = useState<ProductSpecRow[]>([]);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const collection = collections.find((col) => col.id === product.collection_id);

  useEffect(() => {
    let mounted = true;
    async function loadDetails() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/products/${product.id}`, { cache: "no-store" });
        if (!response.ok) return;
        const json = (await response.json()) as { specs?: ProductSpecRow[]; images?: ProductImageRow[] };
        if (mounted) {
          setSpecs(json.specs ?? []);
          setImages(json.images ?? []);
          setActiveImage(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadDetails();
    return () => {
      mounted = false;
    };
  }, [product.id]);

  const currentImage = images[activeImage];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-border pb-4 pr-10">
        <div className="flex flex-wrap items-center gap-3">
          <ProductCodeBadge code={product.sku} className="text-xs" />
          <AdminStatusBadge status={product.is_active ? "active" : "hidden"} />
          {product.quantity ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Qty: {product.quantity}
            </span>
          ) : null}
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">{product.name}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span>Slug: <code className="font-mono">{product.slug}</code></span>
          {collection ? (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                <Layers className="h-3.5 w-3.5" />
                {collection.name}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Main Grid: Images & Details */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr]">
        {/* Images Preview */}
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-surface">
            {currentImage?.image_url ? (
              <Image
                src={currentImage.image_url}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 340px, 280px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-text-muted">
                <Package className="h-12 w-12 stroke-[1.2] opacity-40" />
                <p className="mt-2 text-xs">No image uploaded</p>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id ?? idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    activeImage === idx ? "border-accent ring-2 ring-accent/20" : "border-border hover:border-text-secondary"
                  }`}
                >
                  <Image src={img.thumbnail_url || img.image_url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Product Details & Specifications */}
        <div className="flex flex-col gap-5">
          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <span className="block text-xs uppercase tracking-wider text-text-muted">Collection</span>
              <span className="mt-1 block font-medium text-text-primary text-sm">{collection?.name ?? "—"}</span>
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <span className="block text-xs uppercase tracking-wider text-text-muted">Size</span>
              <span className="mt-1 block font-medium text-text-primary text-sm">{product.size || "—"}</span>
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <span className="block text-xs uppercase tracking-wider text-text-muted">Available Quantity</span>
              <span className="mt-1 block font-medium text-text-primary text-sm">{product.quantity || "—"}</span>
            </div>
          </div>

          {/* Applications */}
          {product.applications && product.applications.length > 0 ? (
            <div>
              <span className="text-xs uppercase tracking-wider text-text-muted">Applications</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.applications.map((app) => (
                  <Badge key={app}>{app}</Badge>
                ))}
              </div>
            </div>
          ) : null}

          {/* Technical Specs */}
          <div>
            <span className="text-xs uppercase tracking-wider text-text-muted">Technical Specifications</span>
            {loading ? (
              <p className="mt-2 text-xs text-text-muted">Loading specs...</p>
            ) : specs.length > 0 ? (
              <div className="mt-2 overflow-hidden rounded-lg border border-border">
                <dl className="divide-y divide-border">
                  {specs.map((spec, i) => (
                    <div className="flex justify-between gap-4 px-3 py-2 text-xs" key={spec.id ?? i}>
                      <dt className="font-medium text-text-secondary">{spec.spec_name}</dt>
                      <dd className="text-right text-text-primary">{spec.spec_value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="mt-2 text-xs text-text-muted">No custom technical specs configured.</p>
            )}
          </div>

          {/* Brochure & Public Links */}
          <div className="flex flex-wrap items-center gap-3">
            {product.brochure_url && product.brochure_url !== "#" ? (
              <a
                href={product.brochure_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download Brochure
              </a>
            ) : null}
            <Link
              href={`/products/${product.sku}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on live site
            </Link>
          </div>

          {/* Timestamps */}
          <div className="mt-auto border-t border-border pt-3 text-xs text-text-muted">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Added: {formatDate(product.created_at)}
              </span>
              {product.updated_at ? (
                <span>Modified: {formatDate(product.updated_at)}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <Trash2 className="h-4 w-4" />
          Delete Product
        </button>

        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={onEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Product
          </Button>
        </div>
      </div>
    </div>
  );
}
