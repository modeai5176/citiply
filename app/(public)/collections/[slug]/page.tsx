import Image from "next/image";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FilterBar } from "@/components/catalogue/FilterBar";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { Button } from "@/components/ui/Button";
import { getCategories, getCollectionBySlug, getProducts } from "@/lib/catalogue-data";

export const revalidate = 3600;

export default async function CollectionListingPage({ params }: { params: { slug: string } }) {
  const collection = await getCollectionBySlug(params.slug, true);
  if (!collection) notFound();
  const [categories, listing] = await Promise.all([
    getCategories(),
    getProducts({ collectionId: collection.id, limit: 24 })
  ]);
  const category = categories.find((item) => item.id === collection.categoryId);

  return (
    <>
      <Breadcrumb
        items={[
          ...(category?.catalogueName && category.catalogueSlug ? [{ label: category.catalogueName, href: `/catalogues/${category.catalogueSlug}` }] : []),
          { label: category?.name ?? "Category", href: category ? `/categories/${category.slug}` : undefined },
          { label: collection.name }
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative mb-10 min-h-[50vh] overflow-hidden rounded-xl bg-dark">
          <Image src={collection.bannerUrl} alt={collection.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/28 to-black/5" />
          <div className="absolute bottom-0 max-w-2xl p-8 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">{category?.name}</p>
            <h1 className="mt-3 text-5xl font-semibold">{collection.name}</h1>
            <p className="mt-4 text-xl text-white/80">{collection.tagline}</p>
            {collection.brochureUrl !== "#" ? <Button className="mt-6" href={collection.brochureUrl} target="_blank"><Download className="h-4 w-4" /> Download Brochure</Button> : null}
          </div>
        </div>
        <FilterBar />
        <ProductGrid products={listing} />
      </section>
    </>
  );
}
