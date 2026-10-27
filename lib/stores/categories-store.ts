import { create } from "zustand";
import type { CatalogueRow, CategoryRow } from "@/lib/supabase/types";

type CategoriesState = {
  categories: CategoryRow[];
  catalogues: CatalogueRow[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;
  setError: (error: string | null) => void;
};

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  catalogues: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const [catRes, cataRes] = await Promise.all([
        fetch("/api/admin/categories", { cache: "no-store" }),
        fetch("/api/admin/catalogues", { cache: "no-store" })
      ]);
      const catJson = (await catRes.json()) as { data?: CategoryRow[]; error?: string };
      const cataJson = (await cataRes.json()) as { data?: CatalogueRow[] };

      if (!catRes.ok) {
        set({ error: catJson.error ?? "Could not load categories", loading: false });
        return;
      }
      set({
        categories: catJson.data ?? [],
        catalogues: cataJson.data ?? [],
        loading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error", loading: false });
    }
  },

  deleteCategory: async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        set({ error: json.error ?? "Could not delete category" });
        return false;
      }
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
        error: null
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error" });
      return false;
    }
  },

  setError: (error) => set({ error })
}));
