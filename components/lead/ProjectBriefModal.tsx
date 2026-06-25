"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { projectBriefSchema, type ProjectBriefValues } from "@/lib/validations";

const PROJECT_TYPES = ["Residential", "Hospitality", "Corporate / Office", "Retail", "Public / Reception", "Other"];
const TIMELINES = ["Immediate", "1–3 months", "3–6 months", "Just exploring"];

const selectClass =
  "h-11 rounded-lg border border-border bg-ivory px-3 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export function ProjectBriefModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProjectBriefValues>({
    resolver: zodResolver(projectBriefSchema),
    defaultValues: { projectType: "", city: "", requiredMaterials: "", finishMood: "", timeline: "", phone: "", email: "" }
  });

  function handleClose() {
    setSubmitted(false);
    onClose();
  }

  async function onSubmit(values: ProjectBriefValues) {
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => body.append(key, value ?? ""));
    const file = fileRef.current?.files?.[0];
    if (file) body.append("file", file);

    const response = await fetch("/api/lead", { method: "POST", body });
    if (!response.ok) {
      setToast({ message: "Could not send your brief. Please try again.", type: "error" });
      return;
    }

    setSubmitted(true);
    setToast({ message: "Brief received", type: "success" });
    form.reset();
    setFileName(null);
  }

  return (
    <>
      <Modal title="Tell us about your project" open={open} onClose={handleClose}>
        {submitted ? (
          <div className="grid min-h-64 place-items-center text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-accent" />
              <h3 className="text-2xl font-semibold">Brief received</h3>
              <p className="mt-2 text-text-secondary">We&apos;ll review it and suggest veneers, panels and matching surfaces for your project.</p>
              <Button className="mt-6" onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <p className="text-sm text-text-secondary sm:col-span-2">
              Share a mood board, BOQ or finish brief and we&apos;ll come back with suggested veneers, panels and matching surfaces.
            </p>

            <label className="grid gap-2 text-sm text-text-secondary">
              <span>Project type</span>
              <select className={selectClass} {...form.register("projectType")}>
                <option value="">Select type</option>
                {PROJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>

            <Input label="City" {...form.register("city")} />

            <Input className="sm:col-span-2" label="Required materials" placeholder="e.g. veneer, fluted panels, doors, laminates" {...form.register("requiredMaterials")} />

            <Textarea className="sm:col-span-2" label="Finish direction / mood" placeholder="Tones, grain, gloss level, overall feel…" {...form.register("finishMood")} />

            <label className="grid gap-2 text-sm text-text-secondary">
              <span>Timeline</span>
              <select className={selectClass} {...form.register("timeline")}>
                <option value="">Select timeline</option>
                {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-text-secondary">
              <span>Upload drawings / reference (PDF or image)</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-border bg-ivory px-3 text-left text-text-secondary transition hover:border-accent hover:text-accent"
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span className="truncate">{fileName ?? "Choose file…"}</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>

            <Input label="Phone*" {...form.register("phone")} error={form.formState.errors.phone?.message} />
            <Input label="Email*" {...form.register("email")} error={form.formState.errors.email?.message} />

            <div className="sm:col-span-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending…" : "Send project brief"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      {toast ? <Toast message={toast.message} type={toast.type} /> : null}
    </>
  );
}
