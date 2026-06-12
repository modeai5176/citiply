import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CategoryCard } from "@/components/catalogue/CategoryCard";
import { getCatalogueBySlug, getCategories, getCatalogues } from "@/lib/catalogue-data";

export const revalidate = 300;

export async function generateStaticParams() {
  const catalogues = await getCatalogues();
  return catalogues.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const catalogue = await getCatalogueBySlug(params.slug);
  if (!catalogue) return {};
  return {
    title: `${catalogue.name} — Citiply`,
    description: catalogue.description
  };
}

export default async function CatalogueDetailPage({ params }: { params: { slug: string } }) {
  const catalogue = await getCatalogueBySlug(params.slug);
  if (!catalogue) notFound();

  const categories = await getCategories({ catalogueId: catalogue.id });

  return (
    <>
      <Breadcrumb items={[{ label: catalogue.name }]} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.22em] text-text-muted">Catalogue</p>
          <h1 className="mt-2 text-4xl font-semibold">{catalogue.name}</h1>
          {catalogue.description ? <p className="mt-3 max-w-2xl text-lg leading-7 text-text-secondary">{catalogue.description}</p> : null}
        </div>
        {categories.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard category={category} key={category.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
            <p className="text-text-muted">No categories in this catalogue yet.</p>
          </div>
        )}
      </section>
    </>
  );
}
