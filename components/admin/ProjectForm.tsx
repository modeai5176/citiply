"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { slugify } from "@/lib/admin/slug";
import type { ProjectChip } from "@/lib/projects-data";
import type { ProjectRow } from "@/lib/supabase/types";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphens only"),
  category: z.string().optional(),
  concept: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true)
});

type ProjectFormValues = z.infer<typeof projectSchema>;

// Chips are edited one per line as "Label" or "Label | /optional-link".
function chipsToText(value: ProjectRow["gallery"]): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "label" in item) {
        const chip = item as { label?: string; href?: string };
        return chip.href ? `${chip.label} | ${chip.href}` : chip.label ?? "";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function textToChips(text: string): ProjectChip[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((part) => part.trim());
      return href ? { label, href } : { label };
    });
}

function textToImages(text: string): string[] {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function ProjectForm({ initial, onSaved, onCancel }: { initial?: ProjectRow | null; onSaved: () => void; onCancel: () => void }) {
  const [heroImage, setHeroImage] = useState(initial?.hero_image ?? "");
  const [gallery, setGallery] = useState(Array.isArray(initial?.gallery) ? (initial?.gallery as string[]).join("\n") : "");
  const [recommended, setRecommended] = useState(chipsToText(initial?.recommended_materials ?? null));
  const [tones, setTones] = useState(chipsToText(initial?.veneer_tones ?? null));
  const [fluted, setFluted] = useState(chipsToText(initial?.fluted_panels ?? null));
  const [doors, setDoors] = useState(chipsToText(initial?.doors ?? null));
  const [laminates, setLaminates] = useState(chipsToText(initial?.laminates ?? null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      category: initial?.category ?? "",
      concept: initial?.concept ?? "",
      sort_order: initial?.sort_order ?? 0,
      is_active: initial?.is_active ?? true
    }
  });

  async function onSubmit(values: ProjectFormValues) {
    setSaving(true);
    setError("");
    const payload = {
      ...values,
      hero_image: heroImage || null,
      gallery: textToImages(gallery),
      recommended_materials: textToChips(recommended),
      veneer_tones: textToChips(tones),
      fluted_panels: textToChips(fluted),
      doors: textToChips(doors),
      laminates: textToChips(laminates)
    };
    const response = await fetch(initial ? `/api/admin/projects/${initial.id}` : "/api/admin/projects", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not save project");
      return;
    }
    onSaved();
  }

  const folder = `projects/${form.watch("slug") || "project"}`;

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <h2 className="pr-10 text-2xl font-semibold">{initial ? "Edit" : "Add"} Project</h2>
      <Input label="Name *" {...form.register("name")} error={form.formState.errors.name?.message} onBlur={() => !initial && !form.getValues("slug") && form.setValue("slug", slugify(form.getValues("name")))} />
      <Input label="Slug *" className="font-mono text-sm" {...form.register("slug")} error={form.formState.errors.slug?.message} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Category" placeholder="Spaces / Elements" {...form.register("category")} />
        <Input label="Sort Order" type="number" {...form.register("sort_order")} />
      </div>
      <Textarea label="Concept / positioning" {...form.register("concept")} />

      <div><p className="mb-2 text-sm text-text-secondary">Hero Image</p><ImageUploadField value={heroImage} onChange={setHeroImage} folder={folder} filename="hero" /></div>

      <Textarea label="Gallery image URLs (one per line)" className="font-mono text-xs" value={gallery} onChange={(e) => setGallery(e.target.value)} />

      <p className="mt-2 text-sm text-text-muted">Chip lists below — one per line, optionally <span className="font-mono">Label | /link</span></p>
      <Textarea label="Recommended Materials" value={recommended} onChange={(e) => setRecommended(e.target.value)} />
      <Textarea label="Suitable Veneer Tones & Collections" value={tones} onChange={(e) => setTones(e.target.value)} />
      <Textarea label="Fluted Panel Options" value={fluted} onChange={(e) => setFluted(e.target.value)} />
      <Textarea label="Door Options" value={doors} onChange={(e) => setDoors(e.target.value)} />
      <Textarea label="Matching Laminates / Flooring" value={laminates} onChange={(e) => setLaminates(e.target.value)} />

      <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" {...form.register("is_active")} /> Active</label>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
