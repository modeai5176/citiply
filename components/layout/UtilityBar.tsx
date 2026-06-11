"use client";

import Link from "next/link";
import { Download, MessageCircle, Send } from "lucide-react";
import { useQuoteModal } from "@/components/catalogue/QuoteModal";

export function UtilityBar() {
  const { openQuote } = useQuoteModal();

  return (
    <div className="border-b border-border bg-surface text-xs text-text-secondary">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 sm:justify-end sm:px-6 lg:gap-x-5 lg:px-8">
        <a className="inline-flex items-center gap-1.5 hover:text-accent" href="https://wa.me/918600000029" target="_blank" rel="noreferrer">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
        <Link className="inline-flex items-center gap-1.5 hover:text-accent" href="/downloads">
          <Download className="h-3.5 w-3.5" /> Downloads
        </Link>
        <button className="inline-flex cursor-pointer items-center gap-1.5 hover:text-accent" onClick={() => openQuote()}>
          <Send className="h-3.5 w-3.5" /> Quick Inquiry
        </button>
      </div>
    </div>
  );
}
