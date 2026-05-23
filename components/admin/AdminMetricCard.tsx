import type { LucideIcon } from "lucide-react";

export function AdminMetricCard({ label, value, hint, icon: Icon }: { label: string; value: number | string; hint?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-text-primary">{value}</p>
        </div>
        <div className="rounded-lg bg-surface p-2 text-accent">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {hint ? <p className="mt-4 text-sm text-text-secondary">{hint}</p> : null}
    </div>
  );
}
