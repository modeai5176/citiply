import { FileDown } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getCategories, getCollections } from "@/lib/catalogue-data";

export const revalidate = 300;

export default async function DownloadsPage() {
  const [categories, collections] = await Promise.all([getCategories(), getCollections()]);

  return (
    <>
      <Breadcrumb items={[{ label: "Downloads" }]} />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-semibold">Downloads</h1>
        <div className="mt-10 grid gap-8">
          {categories.map((category) => {
            const items = collections.filter((collection) => collection.categoryId === category.id);
            if (!items.length) return null;
            return (
              <div key={category.id}>
                <h2 className="mb-4 text-2xl font-semibold">{category.name}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.filter((collection) => collection.brochureUrl !== "#").map((collection) => (
                    <div className="rounded-xl border border-border bg-white p-5" key={collection.id}>
                      <FileDown className="h-8 w-8 text-accent" />
                      <h3 className="mt-4 text-xl font-semibold">{collection.name}</h3>
                      <Badge className="mt-3">{category.name}</Badge>
                      <Button className="mt-5" href={collection.brochureUrl} target="_blank">Download</Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
