import { create } from "zustand";
import type { CategoryRow, CollectionRow } from "@/lib/supabase/types";

type CollectionsState = {
  collections: CollectionRow[];
  categories: CategoryRow[];
  categoryFilter: string;
  loading: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
  deleteCollection: (id: string) => Promise<boolean>;
  setCategoryFilter: (filter: string) => void;
  setError: (error: string | null) => void;
};

export const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  categories: [],
  categoryFilter: "",
  loading: false,
  error: null,

  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/admin/collections", { cache: "no-store" });
      const json = (await response.json()) as { data?: CollectionRow[]; categories?: CategoryRow[]; error?: string };
      if (!response.ok) {
        set({ error: json.error ?? "Could not load collections", loading: false });
        return;
      }
      set({
        collections: json.data ?? [],
        categories: json.categories ?? [],
        loading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error", loading: false });
    }
  },

  deleteCollection: async (id: string) => {
    try {
      const response = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        set({ error: json.error ?? "Could not delete collection" });
        return false;
      }
      set((state) => ({
        collections: state.collections.filter((item) => item.id !== id),
        error: null
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error" });
      return false;
    }
  },

  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setError: (error) => set({ error })
}));
