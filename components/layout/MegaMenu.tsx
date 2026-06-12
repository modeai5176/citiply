"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Grid3X3 } from "lucide-react";
import type { Category, Collection } from "@/lib/types";

export function MegaMenu({ categories, collections }: { categories: Category[]; collections: Collection[] }) {
  return (
    <div className="group relative hidden lg:block">
      <button className="cursor-pointer px-3 py-7 text-sm font-medium text-text-primary transition hover:text-accent">Collections</button>
      <div className="pointer-events-none fixed left-1/2 top-[120px] z-50 w-[min(920px,calc(100vw-2rem))] -translate-x-1/2 translate-y-2 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-[220px_1fr] overflow-hidden rounded-b-xl border border-border bg-white shadow-xl">
          <div className="bg-surface p-5">
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-text-muted">Product Families</p>
            <div className="grid gap-2">
              {categories.slice(0, 7).map((category) => (
                <Link className="rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-white hover:text-accent" href={`/categories/${category.slug}`} key={category.id}>
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5">
            {collections.map((collection) => (
              <div className="grid grid-cols-[92px_1fr] gap-4 rounded-xl border border-border p-3" key={collection.id}>
                <div className="relative min-h-24 overflow-hidden rounded-lg bg-surface">
                  <Image src={collection.bannerUrl} alt={collection.name} fill sizes="92px" className="object-cover" />
                </div>
                <div>
                  <p className="text-base font-semibold">{collection.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">{collection.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
                    <Link className="inline-flex items-center gap-1 text-accent" href={`/collections/${collection.slug}`}>
                      <Grid3X3 className="h-3.5 w-3.5" /> View Product Range
                    </Link>
                    {collection.brochureUrl !== "#" ? (
                      <a className="inline-flex items-center gap-1 text-text-secondary hover:text-accent" href={collection.brochureUrl} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5" /> Download Brochure
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
