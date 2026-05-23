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
import type { CategoryRow, CollectionRow, ProductImageRow, ProductRow, ProductSpecRow } from "@/lib/supabase/types";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphens only"),
  category_id: z.string().min(1, "Category is required"),
  collection_id: z.string().min(1, "Collection is required"),
  finish: z.string().optional(),
  base_material: z.string().optional(),
  size: z.string().optional(),
  thickness: z.string().optional(),
  color_tone: z.string().optional(),
  applications: z.string().optional(),
  short_description: z.string().optional(),
  brochure_url: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  is_active: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof productSchema>;
type SpecDraft = Pick<ProductSpecRow, "spec_name" | "spec_value">;
type ImageDraft = Pick<ProductImageRow, "image_url" | "thumbnail_url" | "blur_data_url" | "kind">;

function getProductFormDefaults(initial?: ProductRow | null): ProductFormValues {
  return {
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    category_id: initial?.category_id ?? "",
    collection_id: initial?.collection_id ?? "",
    finish: initial?.finish ?? "",
    base_material: initial?.base_material ?? "",
    size: initial?.size ?? "",
    thickness: initial?.thickness ?? "",
    color_tone: initial?.color_tone ?? "",
    applications: initial?.applications?.join(", ") ?? "",
    short_description: initial?.short_description ?? "",
    brochure_url: initial?.brochure_url ?? "",
    seo_title: initial?.seo_title ?? "",
    seo_description: initial?.seo_description ?? "",
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
  const [specs, setSpecs] = useState<SpecDraft[]>(initialSpecs.length ? initialSpecs : [{ spec_name: "", spec_value: "" }]);
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
    setSpecs(initialSpecs.length ? initialSpecs : [{ spec_name: "", spec_value: "" }]);
    setImages(initialImages.map((image) => ({ image_url: image.image_url, thumbnail_url: image.thumbnail_url, blur_data_url: image.blur_data_url, kind: image.kind })));
    setBrochureUrl(initial?.brochure_url ?? "");
    setError("");
  }, [form, initial, initialImages, initialSpecs]);

  const selectedCategory = form.watch("category_id");
  const selectedCollection = form.watch("collection_id");
  const filteredCollections = useMemo(
    () => collections.filter((collection) => !selectedCategory || collection.category_id === selectedCategory || collection.id === selectedCollection),
    [collections, selectedCategory, selectedCollection]
  );

  useEffect(() => {
    if (!collections.length || !categories.length) return;

    const currentCollectionId = form.getValues("collection_id") || initial?.collection_id || "";
    const currentCategoryId = form.getValues("category_id") || initial?.category_id || "";
    const currentCollection = collections.find((collection) => collection.id === currentCollectionId);
    const categoryExists = categories.some((category) => category.id === currentCategoryId);

    if (currentCollection && (!currentCategoryId || !categoryExists || currentCollection.category_id !== currentCategoryId)) {
      form.setValue("category_id", currentCollection.category_id, { shouldDirty: false });
      form.setValue("collection_id", currentCollection.id, { shouldDirty: false });
    }
  }, [categories, collections, form, initial?.category_id, initial?.collection_id]);

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextCategoryId = event.target.value;
    const currentCollectionId = form.getValues("collection_id");
    const currentCollection = collections.find((collection) => collection.id === currentCollectionId);

    form.setValue("category_id", nextCategoryId, { shouldDirty: true, shouldValidate: true });
    if (currentCollection && currentCollection.category_id !== nextCategoryId) {
      form.setValue("collection_id", "", { shouldDirty: true, shouldValidate: true });
    }
  }

  function handleCollectionChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextCollectionId = event.target.value;
    const nextCollection = collections.find((collection) => collection.id === nextCollectionId);

    form.setValue("collection_id", nextCollectionId, { shouldDirty: true, shouldValidate: true });
    if (nextCollection) {
      form.setValue("category_id", nextCollection.category_id, { shouldDirty: true, shouldValidate: true });
    }
  }

  async function checkSku() {
    const sku = form.getValues("sku");
    if (!sku || initial?.sku === sku) return;
    const response = await fetch(`/api/admin/products/sku/${encodeURIComponent(sku)}`);
    const json = (await response.json()) as { data?: { id: string } | null };
    if (json.data) form.setError("sku", { message: "SKU already exists" });
  }

  async function onSubmit(values: ProductFormValues) {
    setSaving(true);
    setError("");
    const payload = {
      sku: values.sku,
      name: values.name,
      slug: values.slug,
      category_id: values.category_id,
      collection_id: values.collection_id,
      finish: values.finish || null,
      base_material: values.base_material || null,
      size: values.size || null,
      thickness: values.thickness || null,
      color_tone: values.color_tone || null,
      applications: values.applications?.split(",").map((item) => item.trim()).filter(Boolean) ?? [],
      short_description: values.short_description || null,
      brochure_url: brochureUrl || null,
      seo_title: values.seo_title || null,
      seo_description: values.seo_description || null,
      is_active: values.is_active
    };

    const cleanSpecs = specs.filter((spec) => spec.spec_name.trim() && spec.spec_value.trim());
    const response = await fetch(initial ? `/api/admin/products/${initial.id}` : "/api/admin/products", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: payload,
        specs: cleanSpecs.map((spec, index) => ({ ...spec, sort_order: index })),
        images: images.map((image, index) => ({ ...image, sort_order: index }))
      })
    });

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
    <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      <h2 className="pr-10 text-2xl font-semibold">{initial ? "Edit" : "Add"} Product</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="SKU *" className="font-mono text-sm" {...form.register("sku")} onBlur={checkSku} error={form.formState.errors.sku?.message} />
        <Input label="Name *" {...form.register("name")} error={form.formState.errors.name?.message} onBlur={() => !initial && !form.getValues("slug") && form.setValue("slug", slugify(form.getValues("name")))} />
        <Input label="Slug *" className="font-mono text-sm" {...form.register("slug")} error={form.formState.errors.slug?.message} />
        <label className="grid gap-2 text-sm text-text-secondary">
          Category *
          <select className="h-11 rounded-lg border border-border bg-white px-3 text-text-primary" value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">Select category</option>
            {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-text-secondary">
          Collection *
          <select className="h-11 rounded-lg border border-border bg-white px-3 text-text-primary" value={selectedCollection} onChange={handleCollectionChange}>
            <option value="">Select collection</option>
            {filteredCollections.map((collection) => <option value={collection.id} key={collection.id}>{collection.name}</option>)}
          </select>
        </label>
        {["finish", "base_material", "size", "thickness", "color_tone", "seo_title"].map((field) => (
          <Input label={field.replace(/_/g, " ")} key={field} {...form.register(field as keyof ProductFormValues)} />
        ))}
      </div>
      <Input label="Applications (comma-separated)" {...form.register("applications")} />
      <Textarea label="Short Description" {...form.register("short_description")} />
      <Textarea label="SEO Description" {...form.register("seo_description")} />
      <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" {...form.register("is_active")} /> Active</label>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Technical Specs</h3>
          <Button type="button" variant="ghost" className="px-3 py-2" onClick={() => setSpecs([...specs, { spec_name: "", spec_value: "" }])}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="grid gap-2">
          {specs.map((spec, index) => (
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" key={index}>
              <input className="h-10 rounded-lg border border-border px-3" placeholder="Spec name" value={spec.spec_name} onChange={(event) => setSpecs(specs.map((item, itemIndex) => itemIndex === index ? { ...item, spec_name: event.target.value } : item))} />
              <input className="h-10 rounded-lg border border-border px-3" placeholder="Spec value" value={spec.spec_value} onChange={(event) => setSpecs(specs.map((item, itemIndex) => itemIndex === index ? { ...item, spec_value: event.target.value } : item))} />
              <button type="button" className="cursor-pointer rounded-lg border border-border px-3 text-red-600" onClick={() => setSpecs(specs.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 font-semibold">Images</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {(["main", "closeup", "application", "texture"] as const).map((kind) => {
            const image = images.find((item) => item.kind === kind);
            return (
              <div key={kind}>
                <p className="mb-2 text-sm capitalize text-text-secondary">{kind}</p>
                <ImageUploadField
                  value={image?.image_url ?? ""}
                  onChange={(url) => {
                    const nextImage: ImageDraft = { image_url: url, thumbnail_url: url, blur_data_url: null, kind };
                    setImages([...images.filter((item) => item.kind !== kind), nextImage].filter((item) => item.image_url));
                  }}
                  onUploaded={(payload) => {
                    if (!payload.imageUrl) return;
                    const nextImage: ImageDraft = {
                      image_url: payload.imageUrl,
                      thumbnail_url: payload.thumbnailUrl ?? payload.imageUrl,
                      blur_data_url: payload.blurDataUrl ?? null,
                      kind
                    };
                    setImages([...images.filter((item) => item.kind !== kind), nextImage]);
                  }}
                  folder={folder}
                  filename={kind}
                />
              </div>
            );
          })}
        </div>
      </section>

      <div>
        <p className="mb-2 text-sm text-text-secondary">Brochure PDF</p>
        <ImageUploadField value={brochureUrl} onChange={setBrochureUrl} folder={folder} filename="brochure" type="pdf" />
      </div>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Product"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
