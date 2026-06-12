import { ArrowRight, Palette, Ruler, Search, Shapes, Sparkles } from "lucide-react";
import { CategoryCard } from "@/components/catalogue/CategoryCard";
import { Button } from "@/components/ui/Button";
import { getCategories } from "@/lib/catalogue-data";

export const revalidate = 300;

export default async function HomePage() {
  const categories = await getCategories();
  const browseShortcuts = [
    { href: "/search?q=warm%20wood", label: "Warm wood tones", icon: Palette },
    { href: "/search?q=matte%20finish", label: "Matte finish", icon: Sparkles },
    { href: "/search?q=wall%20panels", label: "Wall panels", icon: Shapes },
    { href: "/search?q=8x4", label: "8x4 sheets", icon: Ruler }
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-dark text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=82')] bg-cover bg-center opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/42 to-black/16" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-7xl items-center px-4 py-14 sm:min-h-[56vh] sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70 sm:text-sm sm:tracking-[0.28em]">Architectural Catalogue</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:mt-5 sm:text-5xl lg:text-7xl">Start with a category</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/78 sm:mt-5 sm:text-lg sm:leading-8">
              Choose the material family first, then move into collections and product SKUs with a cleaner path.
            </p>
            <Button className="mt-7 w-full border border-white bg-accent text-white shadow-lg shadow-black/25 hover:bg-[#b79657] sm:mt-8 sm:w-auto" href="#categories">
              Browse categories
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
      <section id="categories" className="bg-surface py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted sm:text-sm sm:tracking-[0.22em]">Browse by category</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Product Families</h2>
              <p className="mt-3 max-w-2xl text-text-secondary">Large visual tiles make each category easy to scan before you go deeper.</p>
            </div>
            <a className="inline-flex items-center gap-2 text-sm font-medium text-accent" href="/categories">View all <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {categories.slice(0, 8).map((category) => <CategoryCard category={category} key={category.id} />)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted sm:text-sm sm:tracking-[0.22em]">Browse by</p>
            <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Shortcuts for attribute-first browsing</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {browseShortcuts.map((shortcut) => (
              <a className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent" href={shortcut.href} key={shortcut.href}>
                <shortcut.icon className="h-4 w-4" />
                {shortcut.label}
              </a>
            ))}
            <a className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent" href="/search">
              <Search className="h-4 w-4" />
              Search all
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
