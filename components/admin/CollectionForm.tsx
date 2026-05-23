"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { slugify } from "@/lib/admin/slug";
import type { CategoryRow, CollectionRow } from "@/lib/supabase/types";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphens only"),
  category_id: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  tagline: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true)
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

export function CollectionForm({ initial, onSaved, onCancel }: { initial?: CollectionRow | null; onSaved: () => void; onCancel: () => void }) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [bannerUrl, setBannerUrl] = useState(initial?.banner_url ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [brochureUrl, setBrochureUrl] = useState(initial?.brochure_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      category_id: initial?.category_id ?? "",
      description: initial?.description ?? "",
      tagline: initial?.tagline ?? "",
      is_featured: initial?.is_featured ?? false,
      is_active: initial?.is_active ?? true
    }
  });

  useEffect(() => {
    void fetch("/api/admin/categories", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ data?: CategoryRow[] }>)
      .then((json) => setCategories(json.data ?? []));
  }, []);

  async function onSubmit(values: CollectionFormValues) {
    setSaving(true);
    setError("");
    const payload = { ...values, banner_url: bannerUrl || null, logo_url: logoUrl || null, brochure_url: brochureUrl || null };
    const response = await fetch(initial ? `/api/admin/collections/${initial.id}` : "/api/admin/collections", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not save collection");
      return;
    }
    onSaved();
  }

  const folder = `collections/${form.watch("slug") || "collection"}`;

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <h2 className="pr-10 text-2xl font-semibold">{initial ? "Edit" : "Add"} Collection</h2>
      <Input label="Name *" {...form.register("name")} error={form.formState.errors.name?.message} onBlur={() => !initial && !form.getValues("slug") && form.setValue("slug", slugify(form.getValues("name")))} />
      <Input label="Slug *" className="font-mono text-sm" {...form.register("slug")} error={form.formState.errors.slug?.message} />
      <label className="grid gap-2 text-sm text-text-secondary">
        Category *
        <select className="h-11 rounded-lg border border-border bg-white px-3 text-text-primary" {...form.register("category_id")}>
          <option value="">Select category</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
        {form.formState.errors.category_id ? <span className="text-xs text-red-600">{form.formState.errors.category_id.message}</span> : null}
      </label>
      <Textarea label="Description" {...form.register("description")} />
      <Input label="Tagline" {...form.register("tagline")} />
      <div className="grid gap-4 md:grid-cols-2">
        <div><p className="mb-2 text-sm text-text-secondary">Banner Image</p><ImageUploadField value={bannerUrl} onChange={setBannerUrl} folder={folder} filename="banner" /></div>
        <div><p className="mb-2 text-sm text-text-secondary">Logo Image</p><ImageUploadField value={logoUrl} onChange={setLogoUrl} folder={folder} filename="logo" /></div>
      </div>
      <div><p className="mb-2 text-sm text-text-secondary">Brochure PDF</p><ImageUploadField value={brochureUrl} onChange={setBrochureUrl} folder={folder} filename="brochure" type="pdf" /></div>
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" {...form.register("is_featured")} /> Featured</label>
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" {...form.register("is_active")} /> Active</label>
      </div>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
