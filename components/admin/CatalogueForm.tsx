"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { slugify } from "@/lib/admin/slug";
import type { CatalogueRow } from "@/lib/supabase/types";

const catalogueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphens only"),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true)
});

type CatalogueFormValues = z.infer<typeof catalogueSchema>;

export function CatalogueForm({ initial, onSaved, onCancel }: { initial?: CatalogueRow | null; onSaved: () => void; onCancel: () => void }) {
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<CatalogueFormValues>({
    resolver: zodResolver(catalogueSchema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      sort_order: initial?.sort_order ?? 0,
      is_active: initial?.is_active ?? true
    }
  });

  async function onSubmit(values: CatalogueFormValues) {
    setSaving(true);
    setError("");
    const payload = { ...values, image_url: imageUrl || null };
    const response = await fetch(initial ? `/api/admin/catalogues/${initial.id}` : "/api/admin/catalogues", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not save catalogue");
      return;
    }
    onSaved();
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <h2 className="pr-10 text-2xl font-semibold">{initial ? "Edit" : "Add"} Catalogue</h2>
      <Input
        label="Name *"
        {...form.register("name")}
        error={form.formState.errors.name?.message}
        onBlur={() => {
          if (!initial && !form.getValues("slug")) form.setValue("slug", slugify(form.getValues("name")));
        }}
      />
      <Input label="Slug *" className="font-mono text-sm" {...form.register("slug")} error={form.formState.errors.slug?.message} />
      <Textarea label="Description" {...form.register("description")} />
      <Input label="Sort Order" type="number" {...form.register("sort_order")} error={form.formState.errors.sort_order?.message} />
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" {...form.register("is_active")} />
        Active
      </label>
      <div>
        <p className="mb-2 text-sm text-text-secondary">Catalogue Image</p>
        <ImageUploadField value={imageUrl} onChange={setImageUrl} folder="catalogues" filename={form.watch("slug") || "catalogue"} />
      </div>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
