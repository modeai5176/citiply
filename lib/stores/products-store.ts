import { create } from "zustand";
import type { CollectionRow, ProductRow } from "@/lib/supabase/types";

export type ProductSortOption = "recently_added" | "recently_modified" | "name_asc" | "name_desc";

type ProductsState = {
  products: ProductRow[];
  collections: CollectionRow[];
  loading: boolean;
  error: string | null;
  search: string;
  collectionFilter: string;
  sortBy: ProductSortOption;
  selected: string[];

  fetchProducts: () => Promise<void>;
  deleteProduct: (id: string) => Promise<boolean>;
  bulkPublish: (active: boolean) => Promise<boolean>;
  setSearch: (search: string) => void;
  setCollectionFilter: (filter: string) => void;
  setSortBy: (sortBy: ProductSortOption) => void;
  setSelected: (selected: string[]) => void;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelected: () => void;
  setError: (error: string | null) => void;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  collections: [],
  loading: false,
  error: null,
  search: "",
  collectionFilter: "",
  sortBy: "recently_added",
  selected: [],

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const json = (await response.json()) as { data?: ProductRow[]; collections?: CollectionRow[]; error?: string };
      if (!response.ok) {
        set({ error: json.error ?? "Could not load products", loading: false });
        return;
      }
      set({
        products: json.data ?? [],
        collections: json.collections ?? [],
        loading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error", loading: false });
    }
  },

  deleteProduct: async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        set({ error: json.error ?? "Could not delete product" });
        return false;
      }
      set((state) => ({
        products: state.products.filter((item) => item.id !== id),
        selected: state.selected.filter((selectedId) => selectedId !== id),
        error: null
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error" });
      return false;
    }
  },

  bulkPublish: async (active: boolean) => {
    const { selected } = get();
    if (!selected.length) return false;
    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, is_active: active })
      });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        set({ error: json.error ?? "Could not update products" });
        return false;
      }
      set((state) => ({
        products: state.products.map((p) => (selected.includes(p.id) ? { ...p, is_active: active } : p)),
        selected: [],
        error: null
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error" });
      return false;
    }
  },

  setSearch: (search) => set({ search }),
  setCollectionFilter: (collectionFilter) => set({ collectionFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSelected: (selected) => set({ selected }),
  toggleSelected: (id) =>
    set((state) => ({
      selected: state.selected.includes(id)
        ? state.selected.filter((item) => item !== id)
        : [...state.selected, id]
    })),
  selectAll: (ids) => set({ selected: ids }),
  clearSelected: () => set({ selected: [] }),
  setError: (error) => set({ error })
}));
