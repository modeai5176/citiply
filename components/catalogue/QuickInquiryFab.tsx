"use client";

import { MessageCircle } from "lucide-react";
import { useQuoteModal } from "@/components/catalogue/QuoteModal";

export function QuickInquiryFab() {
  const { openQuote } = useQuoteModal();

  return (
    <button
      className="fixed bottom-20 right-5 z-50 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[rgb(var(--on-image))] shadow-premium transition hover:bg-[var(--accent-hover)] sm:bottom-24"
      onClick={() => openQuote()}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">Quick Inquiry</span>
    </button>
  );
}
