"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/AdminTable";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { Button } from "@/components/ui/Button";
import type { ProjectRow } from "@/lib/supabase/types";

export default function AdminProjectsPage() {
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProjectRow | null>(null);

  async function fetchItems() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/projects", { cache: "no-store" });
    const json = (await response.json()) as { data?: ProjectRow[]; error?: string };
    if (!response.ok) setError(json.error ?? "Could not load projects");
    setItems(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchItems(); }, []);

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this project?")) return;
    const response = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not delete project");
      return;
    }
    await fetchItems();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="Projects"
        description="Manage the Applications / Projects browse path — imagery, concept and the recommended materials, tones, panels, doors and laminates."
        action={<Button onClick={() => { setEditItem(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add Project</Button>}
      />
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <AdminTable headers={["Name", "Category", "Order", "Status", <span className="block text-right" key="actions">Actions</span>]} empty={!loading && !items.length}>
        {loading ? <AdminTableRow><AdminTableCell colSpan={5}>Loading projects...</AdminTableCell></AdminTableRow> : items.map((project) => (
          <AdminTableRow key={project.id}>
            <AdminTableCell className="font-medium text-text-primary">{project.name}<p className="mt-1 font-mono text-xs text-text-muted">{project.slug}</p></AdminTableCell>
            <AdminTableCell>{project.category ?? "-"}</AdminTableCell>
            <AdminTableCell>{project.sort_order}</AdminTableCell>
            <AdminTableCell><AdminStatusBadge status={project.is_active ? "active" : "hidden"} /></AdminTableCell>
            <AdminTableCell className="text-right">
              <button className="mr-2 cursor-pointer rounded-full p-2 hover:bg-surface" onClick={() => { setEditItem(project); setOpen(true); }} aria-label={`Edit ${project.name}`}><Edit className="h-4 w-4" /></button>
              <button className="cursor-pointer rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => void deleteItem(project.id)} aria-label={`Delete ${project.name}`}><Trash2 className="h-4 w-4" /></button>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminTable>
      {open ? <AdminModal onClose={() => setOpen(false)}><ProjectForm initial={editItem} onSaved={() => { setOpen(false); void fetchItems(); }} onCancel={() => setOpen(false)} /></AdminModal> : null}
    </>
  );
}
