import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-5 text-sm text-text-muted sm:px-6 lg:px-8">
      <Link href="/" className="hover:text-accent">Home</Link>
      {items.map((item) => (
        <span className="flex items-center gap-2" key={item.label}>
          <ChevronRight className="h-3.5 w-3.5" />
          {item.href ? <Link href={item.href} className="hover:text-accent">{item.label}</Link> : <span className="text-text-secondary">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
