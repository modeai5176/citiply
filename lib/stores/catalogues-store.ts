import { create } from "zustand";
import type { CatalogueRow } from "@/lib/supabase/types";

type CataloguesState = {
  catalogues: CatalogueRow[];
  loading: boolean;
  error: string | null;
  fetchCatalogues: () => Promise<void>;
  deleteCatalogue: (id: string) => Promise<boolean>;
  setCatalogues: (catalogues: CatalogueRow[]) => void;
  setError: (error: string | null) => void;
};

export const useCataloguesStore = create<CataloguesState>((set, get) => ({
  catalogues: [],
  loading: false,
  error: null,

  fetchCatalogues: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/admin/catalogues", { cache: "no-store" });
      const json = (await response.json()) as { data?: CatalogueRow[]; error?: string };
      if (!response.ok) {
        set({ error: json.error ?? "Could not load catalogues", loading: false });
        return;
      }
      set({ catalogues: json.data ?? [], loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error", loading: false });
    }
  },

  deleteCatalogue: async (id: string) => {
    try {
      const response = await fetch(`/api/admin/catalogues/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        set({ error: json.error ?? "Could not delete catalogue" });
        return false;
      }
      set((state) => ({
        catalogues: state.catalogues.filter((item) => item.id !== id),
        error: null
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error" });
      return false;
    }
  },

  setCatalogues: (catalogues) => set({ catalogues }),
  setError: (error) => set({ error })
}));
