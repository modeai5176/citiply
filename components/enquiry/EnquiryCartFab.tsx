"use client";

import { ShoppingBag } from "lucide-react";
import { useEnquiryStore } from "@/lib/enquiry-store";

export function EnquiryCartFab() {
  const { items, openDrawer } = useEnquiryStore();
  if (!items.length) return null;

  return (
    <button
      className="fixed bottom-24 right-5 z-50 inline-flex cursor-pointer items-center gap-2 rounded-full bg-text-primary px-5 py-3 text-sm font-semibold text-[rgb(var(--color-ivory-rgb))] shadow-premium transition hover:opacity-90"
      onClick={openDrawer}
      type="button"
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="hidden sm:inline">Enquiry List</span>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-ivory text-xs font-bold text-text-primary">{items.length}</span>
    </button>
  );
}
