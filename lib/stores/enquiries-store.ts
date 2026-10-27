import { create } from "zustand";

export type EnquiryStatus = "pending" | "contacted" | "closed";

export type EnquiryItem = {
  id: string;
  product_code: string;
  product_name: string;
  collection_name: string | null;
  category_name: string | null;
  quantity: string | null;
  note: string | null;
};

export type EnquirySession = {
  id: string;
  created_at: string;
  full_name: string;
  email?: string | null;
  phone: string;
  whatsapp: string | null;
  firm: string | null;
  city: string;
  message: string | null;
  status: EnquiryStatus;
  enquiry_items: EnquiryItem[];
};

type EnquiriesState = {
  sessions: EnquirySession[];
  loading: boolean;
  error: string | null;
  search: string;
  statusFilter: string;
  expanded: string | null;

  fetchEnquiries: () => Promise<void>;
  updateStatus: (id: string, status: EnquiryStatus) => Promise<boolean>;
  setSearch: (search: string) => void;
  setStatusFilter: (statusFilter: string) => void;
  setExpanded: (expanded: string | null) => void;
  setError: (error: string | null) => void;
};

export const useEnquiriesStore = create<EnquiriesState>((set) => ({
  sessions: [],
  loading: false,
  error: null,
  search: "",
  statusFilter: "",
  expanded: null,

  fetchEnquiries: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/admin/enquiries", { cache: "no-store" });
      const json = (await response.json()) as { data?: EnquirySession[]; error?: string };
      if (!response.ok) {
        set({ error: json.error ?? "Could not load enquiries", loading: false });
        return;
      }
      set({ sessions: json.data ?? [], loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error", loading: false });
    }
  },

  updateStatus: async (id: string, status: EnquiryStatus) => {
    try {
      const response = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        set({ error: json.error ?? "Could not update enquiry" });
        return false;
      }
      set((state) => ({
        sessions: state.sessions.map((item) => (item.id === id ? { ...item, status } : item)),
        error: null
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Network error" });
      return false;
    }
  },

  setSearch: (search) => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setExpanded: (expanded) => set({ expanded }),
  setError: (error) => set({ error })
}));
