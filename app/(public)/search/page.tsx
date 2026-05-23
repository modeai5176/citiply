import { GlobalSearch } from "@/components/search/GlobalSearch";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { CollectionCard } from "@/components/catalogue/CollectionCard";
import { CategoryCard } from "@/components/catalogue/CategoryCard";
import { getCategories, getCollections, getProducts } from "@/lib/catalogue-data";

export const revalidate = 0;

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? "";

  if (!q) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="mb-6 text-4xl font-semibold">Search Citiply</h1>
        <GlobalSearch autoFocus />
      </section>
    );
  }

  const [products, collections, categories] = await Promise.all([
    getProducts(),
    getCollections({ withCounts: true }),
    getCategories()
  ]);
  const term = q.toLowerCase();
  const productResults = products.filter((product) => [
    product.sku,
    product.name,
    product.finish,
    product.baseMaterial,
    product.colorTone,
    product.shortDescription,
    product.collectionName,
    product.categoryName,
    ...product.applications,
    ...product.specs.flatMap((spec) => [spec.name, spec.value])
  ].some((value) => (value ?? "").toLowerCase().includes(term)));
  const collectionResults = collections.filter((collection) => [collection.name, collection.tagline, collection.description].some((value) => (value ?? "").toLowerCase().includes(term)));
  const categoryResults = categories.filter((category) => [category.name, category.description].some((value) => (value ?? "").toLowerCase().includes(term)));
  const total = productResults.length + collectionResults.length + categoryResults.length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl"><GlobalSearch defaultQuery={q} /></div>
      <h1 className="text-3xl font-semibold">{total ? `${total} results for "${q}"` : `No results for "${q}"`}</h1>
      {total ? (
        <div className="mt-10 grid gap-12">
          {productResults.length ? <div><h2 className="mb-5 text-2xl font-semibold">Products</h2><ProductGrid products={productResults} /></div> : null}
          {collectionResults.length ? <div><h2 className="mb-5 text-2xl font-semibold">Collections</h2><div className="grid gap-5 lg:grid-cols-3">{collectionResults.map((collection) => <CollectionCard collection={collection} key={collection.id} />)}</div></div> : null}
          {categoryResults.length ? <div><h2 className="mb-5 text-2xl font-semibold">Categories</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{categoryResults.map((category) => <CategoryCard category={category} key={category.id} />)}</div></div> : null}
        </div>
      ) : (
        <div className="mt-12 rounded-xl border border-border bg-white p-10 text-center text-text-secondary">Try searching by product code, finish, collection, category, or application.</div>
      )}
    </section>
  );
}
