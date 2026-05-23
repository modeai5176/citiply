import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import type { Category, Collection } from "@/lib/types";

export function Footer({ categories, collections }: { categories: Category[]; collections: Collection[] }) {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 text-2xl font-semibold tracking-[0.18em] text-white">CITIPLY</div>
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="text-sm leading-6 text-white/65">Premium architectural materials catalogue for architects, interior designers, and contractors.</p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-accent">Categories</h3>
            <div className="grid gap-2 text-sm text-white/65">
              {categories.slice(0, 5).map((category) => <Link className="hover:text-white" href={`/categories/${category.slug}`} key={category.id}>{category.name}</Link>)}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-accent">Collections</h3>
            <div className="grid gap-2 text-sm text-white/65">
              {collections.map((collection) => <Link className="hover:text-white" href={`/collections/${collection.slug}`} key={collection.id}>{collection.name}</Link>)}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-accent">Company</h3>
            <div className="grid gap-2 text-sm text-white/65">
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
              <Link href="/downloads" className="hover:text-white">Downloads</Link>
              <Link href="/quote" className="hover:text-white">Request Quote</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © 2026 Citiply. All rights reserved.</p>
          <div className="flex gap-3">
            {[Facebook, Instagram, Linkedin, Youtube].map((Icon, index) => <Icon className="h-5 w-5 text-white/65" key={index} />)}
          </div>
        </div>
      </div>
    </footer>
  );
}
