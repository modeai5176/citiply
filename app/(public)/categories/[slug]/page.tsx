import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CollectionCard } from "@/components/catalogue/CollectionCard";
import { getCategoryBySlug, getCollections } from "@/lib/catalogue-data";

export const revalidate = 300;

export default async function CategoryCollectionsPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();
  const categoryCollections = await getCollections({ categoryId: category.id, withCounts: true });

  return (
    <>
      <Breadcrumb items={[{ label: category.name }]} />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative min-h-[44vh] overflow-hidden rounded-xl bg-dark">
          <Image src={category.imageUrl} alt={category.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
          <div className="absolute bottom-0 max-w-2xl p-8 text-white">
            <h1 className="text-5xl font-semibold">{category.name}</h1>
            <p className="mt-4 text-white/80">{category.description}</p>
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {categoryCollections.length ? categoryCollections.map((collection) => <CollectionCard collection={collection} key={collection.id} />) : (
            <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center text-text-secondary">Collections are being prepared for this category.</div>
          )}
        </div>
      </section>
    </>
  );
}
