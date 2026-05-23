import { cn } from "@/lib/utils";

export function AdminStatusBadge({ status }: { status: "active" | "hidden" | "pending" | "contacted" | "closed" | "featured" }) {
  const label = status[0].toUpperCase() + status.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "active" && "border-green-200 bg-green-50 text-green-700",
        status === "hidden" && "border-border bg-surface text-text-muted",
        status === "pending" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "contacted" && "border-blue-200 bg-blue-50 text-blue-700",
        status === "closed" && "border-zinc-200 bg-zinc-100 text-zinc-700",
        status === "featured" && "border-accent/35 bg-accent/10 text-text-primary"
      )}
    >
      {label}
    </span>
  );
}
