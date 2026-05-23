import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/catalogue/ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-surface text-center">
        <div>
          <p className="text-xl font-semibold">No products found</p>
          <p className="mt-2 text-text-secondary">Try another finish, tone, or search term.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => <ProductCard product={product} key={product.id} />)}
    </div>
  );
}
