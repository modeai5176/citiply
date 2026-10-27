"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { slugify } from "@/lib/admin/slug";
import { cn } from "@/lib/utils";
import type { CatalogueRow, CategoryRow, CollectionRow, ProductImageRow, ProductRow, ProductSpecRow } from "@/lib/supabase/types";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  category_id: z.string().min(1, "Category is required"),
  collection_id: z.string().min(1, "Collection is required"),
  size: z.string().optional(),
  quantity: z.string().optional(),
  is_active: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof productSchema>;
type SpecDraft = Pick<ProductSpecRow, "spec_name" | "spec_value">;
type ImageDraft = Pick<ProductImageRow, "image_url" | "thumbnail_url" | "blur_data_url" | "kind">;

const selectClass = "h-11 rounded-lg border border-border bg-ivory px-3 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const rowInputClass = "h-10 rounded-lg border border-border bg-ivory px-3 text-sm text-text-primary outline-none focus:border-accent";

function getProductFormDefaults(initial?: ProductRow | null): ProductFormValues {
  return {
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    category_id: initial?.category_id ?? "",
    collection_id: initial?.collection_id ?? "",
    size: initial?.size ?? "",
    quantity: initial?.quantity ?? "",
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
  const [catalogues, setCatalogues] = useState<CatalogueRow[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("");
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
      fetch("/api/admin/catalogues", { cache: "no-store" }).then((response) => response.json() as Promise<{ data?: CatalogueRow[] }>),
      fetch("/api/admin/categories", { cache: "no-store" }).then((response) => response.json() as Promise<{ data?: CategoryRow[] }>),
      fetch("/api/admin/collections", { cache: "no-store" }).then((response) => response.json() as Promise<{ data?: CollectionRow[] }>)
    ]).then(([catalogueResult, categoryResult, collectionResult]) => {
      setCatalogues(catalogueResult.data ?? []);
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

  // Synchronize family selection from initial product or current category
  useEffect(() => {
    if (!categories.length) return;
    const catId = form.getValues("category_id") || initial?.category_id;
    if (catId) {
      const match = categories.find((c) => c.id === catId);
      if (match?.catalogue_id) {
        setSelectedFamily(match.catalogue_id);
      }
    }
  }, [categories, form, initial]);

  const selectedCategory = form.watch("category_id");
  const selectedCollection = form.watch("collection_id");
  const isActive = form.watch("is_active");
  const name = form.watch("name");
  const slug = initial?.slug || slugify(name ?? "");

  const filteredCategories = useMemo(
    () => (selectedFamily ? categories.filter((category) => category.catalogue_id === selectedFamily) : categories),
    [categories, selectedFamily]
  );

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

  function handleFamilyChange(familyId: string) {
    setSelectedFamily(familyId);
    const currentCategory = categories.find((cat) => cat.id === form.getValues("category_id"));
    if (currentCategory && currentCategory.catalogue_id !== familyId) {
      form.setValue("category_id", "", { shouldDirty: true, shouldValidate: true });
      form.setValue("collection_id", "", { shouldDirty: true });
    }
  }

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextCategoryId = event.target.value;
    const currentCollection = collections.find((collection) => collection.id === form.getValues("collection_id"));
    const matchingCategory = categories.find((c) => c.id === nextCategoryId);

    if (matchingCategory?.catalogue_id && matchingCategory.catalogue_id !== selectedFamily) {
      setSelectedFamily(matchingCategory.catalogue_id);
    }

    form.setValue("category_id", nextCategoryId, { shouldDirty: true, shouldValidate: true });
    if (!currentCollection || currentCollection.category_id !== nextCategoryId) {
      form.setValue("collection_id", "", { shouldDirty: true });
    }
  }

  const mainImage = images.find((item) => item.kind === "main") ?? images[0];

  function setMainImage(image: ImageDraft | null) {
    setImages((current) => {
      const others = current.filter((item) => item.kind !== "main");
      return image?.image_url ? [{ ...image, kind: "main" as const }, ...others] : others;
    });
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
    const validImages = images.filter((img) => img.image_url);
    return fetch(initial ? `/api/admin/products/${initial.id}` : "/api/admin/products", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product,
        specs: cleanSpecs.map((spec, index) => ({ ...spec, sort_order: index })),
        images: validImages.map((image, index) => ({ ...image, sort_order: index }))
      })
    });
  }

  async function onSubmit(values: ProductFormValues) {
    setSaving(true);
    setError("");
    const payload = {
      sku: values.sku.trim(),
      name: values.name.trim(),
      slug: initial?.slug || slugify(values.name),
      category_id: values.category_id,
      collection_id: values.collection_id,
      size: values.size?.trim() || null,
      quantity: values.quantity?.trim() || null,
      applications: applications.map((item) => item.trim()).filter(Boolean),
      brochure_url: brochureUrl || null,
      seo_title: values.name.trim(),
      seo_description: initial?.seo_description ?? null,
      is_active: values.is_active
    };

    let response = await save(payload);
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
      {/* Sticky Header with Save and Cancel in top-right */}
      <div className="sticky -top-6 -mx-6 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-white/95 px-6 py-4 backdrop-blur shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">{initial ? "Edit" : "Add"} Product</h2>
          <p className="text-xs text-text-muted">
            {initial?.sku ? (
              <>SKU: <span className="font-mono font-medium text-text-primary">{initial.sku}</span></>
            ) : (
              "Configure family, category, product details, and image"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 pr-8 sm:pr-10">
          <Button type="button" variant="ghost" className="h-10 px-4 text-text-primary hover:bg-surface" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="h-10 px-5 shadow-sm">
            {saving ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      {/* Product Image Section (Single Main Image Only) */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="font-semibold text-text-primary">Product Image</h3>
        <p className="mb-4 mt-1 text-sm text-text-secondary">Main product image displayed across cards, search, and catalogue listings.</p>
        <div className="max-w-xs">
          <ImageUploadField
            value={mainImage?.image_url ?? ""}
            onChange={(url) => setMainImage(url ? { image_url: url, thumbnail_url: url, blur_data_url: null, kind: "main" } : null)}
            onUploaded={(payload) => {
              if (!payload.imageUrl) return;
              setMainImage({
                image_url: payload.imageUrl,
                thumbnail_url: payload.thumbnailUrl ?? payload.imageUrl,
                blur_data_url: payload.blurDataUrl ?? null,
                kind: "main"
              });
            }}
            folder={folder}
            filename="main"
          />
        </div>
      </section>

      {/* Main Form Fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Name *" placeholder="e.g. American Walnut" {...form.register("name")} error={form.formState.errors.name?.message} />
        <Input label="SKU *" placeholder="e.g. EVR-WALNUT-01" className="font-mono text-sm" {...form.register("sku")} onBlur={checkSku} error={form.formState.errors.sku?.message} />
        <p className="-mt-2 text-xs text-text-muted md:col-span-2">
          Slug: <span className="font-mono">{slug || "…"}</span>{initial ? " (kept stable for existing products)" : " (generated from name)"}
        </p>

        {/* Family Selection as selectable clickable boxes */}
        <div className="grid gap-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Product Family *</span>
            {selectedFamily ? (
              <span className="text-xs text-text-muted">
                Selected: <strong className="text-accent">{catalogues.find((c) => c.id === selectedFamily)?.name}</strong>
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {catalogues.map((cat) => {
              const isSelected = selectedFamily === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleFamilyChange(cat.id)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-3.5 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent/30",
                    isSelected
                      ? "border-accent bg-accent/10 text-accent font-semibold ring-2 ring-accent/20 shadow-sm"
                      : "border-border bg-ivory text-text-secondary hover:border-accent/40 hover:text-text-primary"
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          {!selectedFamily ? (
            <span className="text-xs text-amber-700">Please select a product family to filter available categories.</span>
          ) : null}
        </div>

        {/* Category Dropdown (Filtered dynamically by Family) */}
        <label className="grid gap-2 text-sm text-text-secondary">
          <span>Category *</span>
          <select
            className={selectClass}
            value={selectedCategory}
            disabled={!selectedFamily}
            onChange={handleCategoryChange}
          >
            <option value="">
              {selectedFamily
                ? (filteredCategories.length ? "Select category" : "No categories in this family")
                : "Select family first"}
            </option>
            {filteredCategories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {!selectedFamily ? (
            <span className="text-xs text-amber-700">Select a family first to see its categories.</span>
          ) : form.formState.errors.category_id ? (
            <span className="text-xs text-red-600">{form.formState.errors.category_id.message}</span>
          ) : null}
        </label>

        {/* Collection Dropdown (Filtered dynamically by Category) */}
        <label className="grid gap-2 text-sm text-text-secondary">
          <span>Collection *</span>
          <select
            className={selectClass}
            value={selectedCollection}
            disabled={!selectedCategory}
            onChange={(event) => form.setValue("collection_id", event.target.value, { shouldDirty: true, shouldValidate: true })}
          >
            <option value="">
              {selectedCategory
                ? (filteredCollections.length ? "Select collection" : "No collections in this category")
                : "Select category first"}
            </option>
            {filteredCollections.map((collection) => (
              <option value={collection.id} key={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
          {!selectedCategory ? (
            <span className="text-xs text-amber-700">Select a category first to see its collections.</span>
          ) : form.formState.errors.collection_id ? (
            <span className="text-xs text-red-600">{form.formState.errors.collection_id.message}</span>
          ) : null}
        </label>

        {/* Size and Quantity in 2 Columns */}
        <div className="grid gap-4 md:col-span-2 sm:grid-cols-2">
          <Input label="Size" placeholder="e.g. 8x4 ft" {...form.register("size")} />
          <Input label="Quantity" placeholder="e.g. 50 sheets or In Stock" {...form.register("quantity")} />
        </div>
      </div>

      {/* Active / Inactive Switch */}
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

      {/* Applications Section */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-text-primary">Applications <span className="text-sm font-normal text-text-muted">(optional)</span></h3>
          <Button type="button" variant="ghost" className="px-3 py-2 text-text-primary" onClick={() => setApplications([...applications, ""])}>
            <Plus className="h-4 w-4" /> Add application
          </Button>
        </div>
        {applications.length ? (
          <div className="mt-3 grid gap-2">
            {applications.map((application, index) => (
              <div className="grid grid-cols-[1fr_auto] gap-2" key={index}>
                <input
                  className={rowInputClass}
                  placeholder="e.g. Wall panelling"
                  autoFocus={!application}
                  value={application}
                  onChange={(event) => setApplications(applications.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                />
                <button
                  type="button"
                  aria-label="Remove application"
                  className="cursor-pointer rounded-lg border border-border px-3 text-red-600 hover:bg-red-50"
                  onClick={() => setApplications(applications.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Technical Specs Section */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-text-primary">Technical Specs <span className="text-sm font-normal text-text-muted">(optional)</span></h3>
          <Button type="button" variant="ghost" className="px-3 py-2 text-text-primary" onClick={() => setSpecs([...specs, { spec_name: "", spec_value: "" }])}>
            <Plus className="h-4 w-4" /> Add spec
          </Button>
        </div>
        {specs.length ? (
          <div className="mt-3 grid gap-2">
            {specs.map((spec, index) => (
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" key={index}>
                <input
                  className={rowInputClass}
                  placeholder="Spec name"
                  autoFocus={!spec.spec_name && !spec.spec_value}
                  value={spec.spec_name}
                  onChange={(event) => setSpecs(specs.map((item, itemIndex) => itemIndex === index ? { ...item, spec_name: event.target.value } : item))}
                />
                <input
                  className={rowInputClass}
                  placeholder="Spec value"
                  value={spec.spec_value}
                  onChange={(event) => setSpecs(specs.map((item, itemIndex) => itemIndex === index ? { ...item, spec_value: event.target.value } : item))}
                />
                <button
                  type="button"
                  aria-label="Remove spec"
                  className="cursor-pointer rounded-lg border border-border px-3 text-red-600 hover:bg-red-50"
                  onClick={() => setSpecs(specs.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Brochure PDF Section */}
      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">Brochure PDF <span className="font-normal text-text-muted">(optional)</span></p>
        <ImageUploadField value={brochureUrl} onChange={setBrochureUrl} folder={folder} filename="brochure" type="pdf" />
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="ghost" className="text-text-primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Product"}
        </Button>
      </div>
    </form>
  );
}
