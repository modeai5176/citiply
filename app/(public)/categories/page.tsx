import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CategoryCard } from "@/components/catalogue/CategoryCard";
import { getCategories } from "@/lib/catalogue-data";

export const revalidate = 300;

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <Breadcrumb items={[{ label: "Categories" }]} />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-semibold">Categories</h1>
        <p className="mt-4 max-w-2xl text-text-secondary">Select a material family and move quickly into curated architectural collections.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => <CategoryCard category={category} key={category.id} />)}
        </div>
      </section>
    </>
  );
}
