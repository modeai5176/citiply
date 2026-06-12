import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CatalogueCard } from "@/components/catalogue/CatalogueCard";
import { getCatalogues } from "@/lib/catalogue-data";

export const revalidate = 300;

export default async function CataloguesPage() {
  const catalogues = await getCatalogues();

  return (
    <>
      <Breadcrumb items={[{ label: "Catalogues" }]} />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-semibold">Catalogues</h1>
        <p className="mt-4 max-w-2xl text-text-secondary">Explore every catalogue and move quickly into the related categories and collections.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {catalogues.map((catalogue) => <CatalogueCard catalogue={catalogue} key={catalogue.id} />)}
        </div>
      </section>
    </>
  );
}
