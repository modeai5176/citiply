"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SpecsEditor() {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Dynamic Specs</h3>
        <Button type="button" variant="ghost" className="px-3 py-2"><Plus className="h-4 w-4" /> Row</Button>
      </div>
      {[1, 2, 3].map((row) => (
        <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" key={row}>
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Spec name" />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Spec value" />
          <button className="cursor-pointer rounded-lg border border-border px-3 text-text-muted hover:text-red-600" aria-label="Remove row"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
