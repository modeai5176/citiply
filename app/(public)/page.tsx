import { ArrowRight, BadgeCheck, Headphones, LibraryBig } from "lucide-react";
import { HeroSlider } from "@/components/catalogue/HeroSlider";
import { CategoryCard } from "@/components/catalogue/CategoryCard";
import { CollectionCard } from "@/components/catalogue/CollectionCard";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { getCategories, getCollections, getProducts } from "@/lib/catalogue-data";

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featuredCollections, newestCollections, latestProducts, carouselCollections] = await Promise.all([
    getCategories(),
    getCollections({ featuredOnly: true, limit: 3, withCounts: true }),
    getCollections({ limit: 3, withCounts: true, newest: true }),
    getProducts({ limit: 4, newest: true }),
    getCollections({ featuredOnly: true, limit: 5 })
  ]);

  return (
    <>
      <HeroSlider collections={carouselCollections.length ? carouselCollections : newestCollections} />
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Catalogue</p>
            <h2 className="mt-2 text-4xl font-semibold">Browse by Category</h2>
          </div>
          <a className="hidden items-center gap-2 text-sm font-medium text-accent sm:inline-flex" href="/categories">View all <ArrowRight className="h-4 w-4" /></a>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((category) => <CategoryCard category={category} key={category.id} />)}
        </div>
      </section>
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-4xl font-semibold">Featured Collections</h2>
            <a className="hidden items-center gap-2 text-sm font-medium text-accent sm:inline-flex" href="/downloads">Brochures <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {featuredCollections.map((collection) => <CollectionCard collection={collection} key={collection.id} />)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-text-muted">New Arrivals</p>
            <h2 className="mt-2 text-4xl font-semibold">New Collections</h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {newestCollections.map((collection) => <CollectionCard collection={collection} key={collection.id} />)}
        </div>
      </section>
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Products</p>
              <h2 className="mt-2 text-4xl font-semibold">Latest Products</h2>
            </div>
            <a className="hidden items-center gap-2 text-sm font-medium text-accent sm:inline-flex" href="/categories">Browse all <ArrowRight className="h-4 w-4" /></a>
          </div>
          <ProductGrid products={latestProducts} />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          { icon: BadgeCheck, title: "Premium Quality", text: "Curated collections with clear specifications for professional selection." },
          { icon: LibraryBig, title: "Extensive Range", text: "Veneers, panels, flooring, laminates, plywood, doors, and louvers." },
          { icon: Headphones, title: "Expert Support", text: "Fast response for architects, designers, and contractor teams." }
        ].map((item) => (
          <div className="rounded-xl border border-border bg-white p-6" key={item.title}>
            <item.icon className="h-8 w-8 text-accent" />
            <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{item.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
