"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { slugify } from "@/lib/admin/slug";
import { cn } from "@/lib/utils";
import type { CategoryRow, CollectionRow, ProductImageRow, ProductRow, ProductSpecRow } from "@/lib/supabase/types";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  category_id: z.string().min(1, "Category is required"),
  collection_id: z.string().min(1, "Collection is required"),
  size: z.string().optional(),
  color_tone: z.string().optional(),
  short_description: z.string().optional(),
  is_active: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof productSchema>;
type SpecDraft = Pick<ProductSpecRow, "spec_name" | "spec_value">;
type ImageDraft = Pick<ProductImageRow, "image_url" | "thumbnail_url" | "blur_data_url" | "kind">;

const IMAGE_KINDS = ["main", "closeup", "application", "texture"] as const;
const selectClass = "h-11 rounded-lg border border-border bg-ivory px-3 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const rowInputClass = "h-10 rounded-lg border border-border bg-ivory px-3 text-sm text-text-primary outline-none focus:border-accent";

function getProductFormDefaults(initial?: ProductRow | null): ProductFormValues {
  return {
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    category_id: initial?.category_id ?? "",
    collection_id: initial?.collection_id ?? "",
    size: initial?.size ?? "",
    color_tone: initial?.color_tone ?? "",
    short_description: initial?.short_description ?? "",
    is_active: initial?.is_active ?? true
  };
}

export function ProductForm({
  initial,
  initialSpecs = [],
  initialImages = [],
  onSaved,
  onCancel
}: {
  initial?: ProductRow | null;
  initialSpecs?: ProductSpecRow[];
  initialImages?: ProductImageRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [specs, setSpecs] = useState<SpecDraft[]>(initialSpecs);
  const [applications, setApplications] = useState<string[]>(initial?.applications ?? []);
  const [images, setImages] = useState<ImageDraft[]>(initialImages.map((image) => ({ image_url: image.image_url, thumbnail_url: image.thumbnail_url, blur_data_url: image.blur_data_url, kind: image.kind })));
  const [brochureUrl, setBrochureUrl] = useState(initial?.brochure_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getProductFormDefaults(initial)
  });

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/categories", { cache: "no-store" }).then((response) => response.json() as Promise<{ data?: CategoryRow[] }>),
      fetch("/api/admin/collections", { cache: "no-store" }).then((response) => response.json() as Promise<{ data?: CollectionRow[] }>)
    ]).then(([categoryResult, collectionResult]) => {
      setCategories(categoryResult.data ?? []);
      setCollections(collectionResult.data ?? []);
    });
  }, []);

  useEffect(() => {
    form.reset(getProductFormDefaults(initial));
    setSpecs(initialSpecs);
    setApplications(initial?.applications ?? []);
    setImages(initialImages.map((image) => ({ image_url: image.image_url, thumbnail_url: image.thumbnail_url, blur_data_url: image.blur_data_url, kind: image.kind })));
    setBrochureUrl(initial?.brochure_url ?? "");
    setError("");
  }, [form, initial, initialImages, initialSpecs]);

  const selectedCategory = form.watch("category_id");
  const selectedCollection = form.watch("collection_id");
  const isActive = form.watch("is_active");
  const name = form.watch("name");
  const slug = initial?.slug || slugify(name ?? "");
  const filteredCollections = useMemo(
    () => (selectedCategory ? collections.filter((collection) => collection.category_id === selectedCategory) : []),
    [collections, selectedCategory]
  );

  // Legacy rows can carry a category that doesn't match their collection — trust the collection.
  useEffect(() => {
    if (!collections.length) return;
    const currentCollection = collections.find((collection) => collection.id === form.getValues("collection_id"));
    if (currentCollection && currentCollection.category_id !== form.getValues("category_id")) {
      form.setValue("category_id", currentCollection.category_id, { shouldDirty: false });
    }
  }, [collections, form]);

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextCategoryId = event.target.value;
    const currentCollection = collections.find((collection) => collection.id === form.getValues("collection_id"));

    form.setValue("category_id", nextCategoryId, { shouldDirty: true, shouldValidate: true });
    if (!currentCollection || currentCollection.category_id !== nextCategoryId) {
      form.setValue("collection_id", "", { shouldDirty: true });
    }
  }

  function setImage(kind: ImageDraft["kind"], image: ImageDraft | null) {
    setImages((current) => [...current.filter((item) => item.kind !== kind), ...(image?.image_url ? [image] : [])]);
  }

  async function checkSku() {
    const sku = form.getValues("sku");
    if (!sku || initial?.sku === sku) return;
    const response = await fetch(`/api/admin/products/sku/${encodeURIComponent(sku)}`);
    const json = (await response.json()) as { data?: { id: string } | null };
    if (json.data) form.setError("sku", { message: "SKU already exists" });
  }

  async function save(product: Record<string, unknown>) {
    const cleanSpecs = specs.filter((spec) => spec.spec_name.trim() && spec.spec_value.trim());
    const orderedImages = [...images].sort((a, b) => IMAGE_KINDS.indexOf(a.kind as (typeof IMAGE_KINDS)[number]) - IMAGE_KINDS.indexOf(b.kind as (typeof IMAGE_KINDS)[number]));
    return fetch(initial ? `/api/admin/products/${initial.id}` : "/api/admin/products", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product,
        specs: cleanSpecs.map((spec, index) => ({ ...spec, sort_order: index })),
        images: orderedImages.map((image, index) => ({ ...image, sort_order: index }))
      })
    });
  }

  async function onSubmit(values: ProductFormValues) {
    setSaving(true);
    setError("");
    const shortDescription = values.short_description?.trim() || null;
    // finish / base_material / thickness are no longer edited here; omitting them keeps existing values on update.
    const payload = {
      sku: values.sku.trim(),
      name: values.name.trim(),
      slug: initial?.slug || slugify(values.name),
      category_id: values.category_id,
      collection_id: values.collection_id,
      size: values.size?.trim() || null,
      color_tone: values.color_tone?.trim() || null,
      applications: applications.map((item) => item.trim()).filter(Boolean),
      short_description: shortDescription,
      brochure_url: brochureUrl || null,
      seo_title: values.name.trim(),
      seo_description: shortDescription,
      is_active: values.is_active
    };

    let response = await save(payload);
    // Two products can share a name — fall back to a SKU-suffixed slug on a unique-key clash.
    if (!response.ok && !initial) {
      const json = (await response.clone().json()) as { error?: string };
      if (json.error?.includes("slug")) {
        response = await save({ ...payload, slug: `${payload.slug}-${slugify(values.sku)}` });
      }
    }

    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setSaving(false);
      setError(json.error ?? "Could not save product");
      return;
    }

    setSaving(false);
    onSaved();
  }

  const folder = `products/${form.watch("sku") || "product"}`;

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      <h2 className="pr-10 text-2xl font-semibold text-text-primary">{initial ? "Edit" : "Add"} Product</h2>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="font-semibold text-text-primary">Product Images</h3>
        <p className="mb-4 mt-1 text-sm text-text-secondary">The main image is used on cards and listings.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMAGE_KINDS.map((kind) => {
            const image = images.find((item) => item.kind === kind);
            return (
              <div key={kind}>
                <p className="mb-2 text-sm font-medium capitalize text-text-primary">{kind}</p>
                <ImageUploadField
                  value={image?.image_url ?? ""}
                  onChange={(url) => setImage(kind, url ? { image_url: url, thumbnail_url: url, blur_data_url: null, kind } : null)}
                  onUploaded={(payload) => {
                    if (!payload.imageUrl) return;
                    setImage(kind, {
                      image_url: payload.imageUrl,
                      thumbnail_url: payload.thumbnailUrl ?? payload.imageUrl,
                      blur_data_url: payload.blurDataUrl ?? null,
                      kind
                    });
                  }}
                  folder={folder}
                  filename={kind}
                />
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Name *" {...form.register("name")} error={form.formState.errors.name?.message} />
        <Input label="SKU *" className="font-mono text-sm" {...form.register("sku")} onBlur={checkSku} error={form.formState.errors.sku?.message} />
        <p className="-mt-2 text-xs text-text-muted md:col-span-2">
          Slug: <span className="font-mono">{slug || "…"}</span>{initial ? " (kept stable for existing products)" : " (generated from name)"}
        </p>
        <label className="grid gap-2 text-sm text-text-secondary">
          <span>Category *</span>
          <select className={selectClass} value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">Select category</option>
            {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
          {form.formState.errors.category_id ? <span className="text-xs text-red-600">{form.formState.errors.category_id.message}</span> : null}
        </label>
        <label className="grid gap-2 text-sm text-text-secondary">
          <span>Collection *</span>
          <select
            className={selectClass}
            value={selectedCollection}
            disabled={!selectedCategory}
            onChange={(event) => form.setValue("collection_id", event.target.value, { shouldDirty: true, shouldValidate: true })}
          >
            <option value="">{selectedCategory ? (filteredCollections.length ? "Select collection" : "No collections in this category") : "Select category first"}</option>
            {filteredCollections.map((collection) => <option value={collection.id} key={collection.id}>{collection.name}</option>)}
          </select>
          {!selectedCategory ? (
            <span className="text-xs text-amber-700">Select a category first to see its collections.</span>
          ) : form.formState.errors.collection_id ? (
            <span className="text-xs text-red-600">{form.formState.errors.collection_id.message}</span>
          ) : null}
        </label>
        <Input label="Size" {...form.register("size")} />
        <Input label="Color tone" {...form.register("color_tone")} />
      </div>

      <Textarea label="Short Description (also used as SEO description)" {...form.register("short_description")} />

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
        <div>
          <p className="font-medium text-text-primary">{isActive ? "Active" : "Inactive"}</p>
          <p className="text-sm text-text-secondary">{isActive ? "Visible on the public site." : "Hidden from the public site."}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label="Toggle product active"
          onClick={() => form.setValue("is_active", !isActive, { shouldDirty: true })}
          className={cn("relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors", isActive ? "bg-emerald-600" : "bg-stone")}
        >
          <span className={cn("absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform", isActive && "translate-x-5")} />
        </button>
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-text-primary">Applications <span className="text-sm font-normal text-text-muted">(optional)</span></h3>
          <Button type="button" variant="ghost" className="px-3 py-2 text-text-primary" onClick={() => setApplications([...applications, ""])}><Plus className="h-4 w-4" /> Add application</Button>
        </div>
        {applications.length ? (
          <div className="mt-3 grid gap-2">
            {applications.map((application, index) => (
              <div className="grid grid-cols-[1fr_auto] gap-2" key={index}>
                <input className={rowInputClass} placeholder="e.g. Wall panelling" autoFocus={!application} value={application} onChange={(event) => setApplications(applications.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />
                <button type="button" aria-label="Remove application" className="cursor-pointer rounded-lg border border-border px-3 text-red-600" onClick={() => setApplications(applications.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-text-primary">Technical Specs <span className="text-sm font-normal text-text-muted">(optional)</span></h3>
          <Button type="button" variant="ghost" className="px-3 py-2 text-text-primary" onClick={() => setSpecs([...specs, { spec_name: "", spec_value: "" }])}><Plus className="h-4 w-4" /> Add spec</Button>
        </div>
        {specs.length ? (
          <div className="mt-3 grid gap-2">
            {specs.map((spec, index) => (
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" key={index}>
                <input className={rowInputClass} placeholder="Spec name" autoFocus={!spec.spec_name && !spec.spec_value} value={spec.spec_name} onChange={(event) => setSpecs(specs.map((item, itemIndex) => itemIndex === index ? { ...item, spec_name: event.target.value } : item))} />
                <input className={rowInputClass} placeholder="Spec value" value={spec.spec_value} onChange={(event) => setSpecs(specs.map((item, itemIndex) => itemIndex === index ? { ...item, spec_value: event.target.value } : item))} />
                <button type="button" aria-label="Remove spec" className="cursor-pointer rounded-lg border border-border px-3 text-red-600" onClick={() => setSpecs(specs.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">Brochure PDF <span className="font-normal text-text-muted">(optional)</span></p>
        <ImageUploadField value={brochureUrl} onChange={setBrochureUrl} folder={folder} filename="brochure" type="pdf" />
      </div>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Product"}</Button>
        <Button type="button" variant="ghost" className="text-text-primary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
