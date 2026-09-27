"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { FilterBar, emptyFilters, type FilterGroup, type FilterState } from "@/components/catalogue/FilterBar";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { getVeneerFacets } from "@/lib/veneer-facets";

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function CollectionExplorer({
  products,
  speciesById
}: {
  products: Product[];
  /**
   * Real species label per product id. getVeneerFacets() only derives a
   * synthetic species from the SKU hash, so pass this wherever the true
   * species is known (e.g. the family collection a product sits in) and the
   * Species filter becomes accurate instead of decorative.
   */
  speciesById?: Record<string, string>;
}) {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  // Compute facets once per product, then reuse for both the option lists and
  // the active filtering below.
  const facetMap = useMemo(
    () =>
      new Map(
        products.map((product) => {
          const facets = getVeneerFacets(product);
          const species = speciesById?.[product.id];
          return [product.id, species ? { ...facets, species } : facets] as const;
        })
      ),
    [products, speciesById]
  );

  const groups = useMemo<FilterGroup[]>(() => {
    const all = products.map((product) => facetMap.get(product.id)!);
    const candidates: FilterGroup[] = [
      { key: "species", label: "Species", options: uniqueSorted(all.map((f) => f.species)) },
      { key: "tone", label: "Tone", options: uniqueSorted(all.map((f) => f.tone)) },
      { key: "grain", label: "Grain", options: uniqueSorted(all.map((f) => f.grain)) },
      { key: "finish", label: "Finish", options: uniqueSorted(all.map((f) => f.finish)) },
      { key: "application", label: "Application", options: uniqueSorted(all.flatMap((f) => f.applications)) },
      { key: "availability", label: "Availability", options: uniqueSorted(all.map((f) => f.availability)) }
    ];
    return candidates.filter((group) => group.options.length > 0);
  }, [products, facetMap]);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return products.filter((product) => {
      const facets = facetMap.get(product.id)!;
      if (search && !`${product.name} ${product.sku}`.toLowerCase().includes(search)) return false;
      if (filters.species && facets.species !== filters.species) return false;
      if (filters.tone && facets.tone !== filters.tone) return false;
      if (filters.grain && facets.grain !== filters.grain) return false;
      if (filters.finish && facets.finish !== filters.finish) return false;
      if (filters.application && !facets.applications.includes(filters.application)) return false;
      if (filters.availability && facets.availability !== filters.availability) return false;
      return true;
    });
  }, [products, facetMap, filters]);

  return (
    <>
      <FilterBar groups={groups} value={filters} onChange={setFilters} />
      <ProductGrid products={filtered} />
    </>
  );
}
