import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CollectionCard } from "@/components/catalogue/CollectionCard";
import { CollectionExplorer } from "@/components/catalogue/CollectionExplorer";
import { getCategoryBySlug, getCollections, getProducts } from "@/lib/catalogue-data";

// Short window: the catalogue is actively being restructured, and a 5-minute
// cache meant data changes kept appearing "not applied" on the live pages.
export const revalidate = 60;

/**
 * Categories rendered fully expanded: every product in the category is listed
 * in one filterable grid instead of behind a grid of collection cards. The
 * collections stay exactly as they are in the DB and their own pages still
 * work — this only changes how the category page presents them.
 * Only worth doing for categories small enough to show on one page.
 */
const EXPANDED_CATEGORIES = new Set([
  "evergreen",
  "exotic-veneers",
  "coloured-veneers",
  "textured-veneers",
  "specialty-series",
  "premium-collections",
  "fluted-veneers"
]);

export default async function CategoryCollectionsPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();
  const categoryCollections = await getCollections({ categoryId: category.id, withCounts: true });
  const expanded = EXPANDED_CATEGORIES.has(category.slug);

  // One query for the whole category rather than a round trip per collection.
  const allProducts = expanded ? await getProducts({ categoryId: category.id }) : [];

  // getProducts() filters products.is_active but never collections.is_active, so
  // a retired collection's products still come back carrying this category_id.
  // Keep only what a visitor can actually reach: categoryCollections is already
  // restricted to active collections.
  const collectionNameById = new Map(categoryCollections.map((collection) => [collection.id, collection.name]));
  const products = allProducts.filter((product) => collectionNameById.has(product.collectionId));

  // The collection a product sits in IS its species family here, so feed that
  // to the Species filter instead of the synthetic SKU-hash facet.
  const speciesById: Record<string, string> = {};
  for (const product of products) {
    speciesById[product.id] = collectionNameById.get(product.collectionId)!;
  }

  return (
    <>
      <Breadcrumb
        items={[
          ...(category.catalogueName && category.catalogueSlug ? [{ label: category.catalogueName, href: `/catalogues/${category.catalogueSlug}` }] : []),
          { label: category.name }
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative min-h-[44vh] overflow-hidden rounded-xl bg-dark">
          <Image src={category.imageUrl} alt={category.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--scrim)/0.7)] to-[rgb(var(--scrim)/0.1)]" />
          <div className="absolute bottom-0 max-w-2xl p-8 text-[rgb(var(--on-image))]">
            <h1 className="text-5xl font-semibold">{category.name}</h1>
            <p className="mt-4 text-[rgb(var(--on-image)/0.8)]">{category.description}</p>
          </div>
        </div>
        {expanded ? (
          <div className="mt-10">
            <CollectionExplorer products={products} speciesById={speciesById} />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {categoryCollections.length ? categoryCollections.map((collection) => <CollectionCard collection={collection} key={collection.id} />) : (
              <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center text-text-secondary">Collections are being prepared for this category.</div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
