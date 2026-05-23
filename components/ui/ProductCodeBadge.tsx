import { cn } from "@/lib/utils";

export function ProductCodeBadge({ code, className }: { code: string; className?: string }) {
  return (
    <span className={cn("inline-flex rounded bg-surface px-2 py-1 font-mono text-xs uppercase tracking-widest text-text-secondary", className)}>
      {code}
    </span>
  );
}
