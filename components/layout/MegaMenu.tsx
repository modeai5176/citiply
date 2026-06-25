"use client";

import Link from "next/link";
import type { ProductFamily } from "@/lib/types";

/**
 * A single top-level Product Family nav item. The label links to the family page
 * (`/catalogues/{slug}`); hovering reveals that family's category filters, each of
 * which links through to its collections.
 */
export function FamilyNavItem({ family, isTransparent = false }: { family: ProductFamily; isTransparent?: boolean }) {
  return (
    <div className="group relative">
      <Link
        href={`/catalogues/${family.slug}`}
        className="block cursor-pointer whitespace-nowrap px-2 py-7 text-sm font-medium transition-colors duration-500"
        style={{ color: isTransparent ? 'rgb(var(--on-image) / 0.85)' : 'var(--color-charcoal)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-gold)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = isTransparent ? 'rgb(var(--on-image) / 0.85)' : 'var(--color-charcoal)'; }}
      >
        {family.name}
      </Link>
      {family.categories.length ? (
        <div className="pointer-events-none absolute left-1/2 top-[calc(100%-8px)] z-50 w-64 -translate-x-1/2 translate-y-2 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <div className="overflow-hidden rounded-xl border border-border bg-ivory p-3 shadow-xl">
            <p className="px-2 pb-2 text-xs uppercase tracking-[0.2em] text-text-muted">{family.name}</p>
            <div className="grid gap-1">
              {family.categories.map((category) => (
                <Link
                  className="rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-accent"
                  href={`/categories/${category.slug}`}
                  key={category.id}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
