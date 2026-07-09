"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useQuoteModal } from "@/components/catalogue/QuoteModal";

export function QuickInquiryFab() {
  const { openQuote } = useQuoteModal();
  // Lifts up when the ProjectBriefStrip reveals (same scroll threshold), so the
  // strip never covers the button.
  const [stripShown, setStripShown] = useState(false);

  useEffect(() => {
    function threshold() {
      const hero = document.getElementById("hero-section");
      if (hero) {
        return hero.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.4;
      }
      return window.innerHeight * 0.6;
    }
    function onScroll() {
      setStripShown(window.scrollY > threshold());
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      className="fixed bottom-5 right-5 z-50 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[rgb(var(--on-image))] shadow-premium transition-all duration-500 ease-out hover:bg-[var(--accent-hover)]"
      style={{
        // Raise the button above the ~72px project-brief strip when it's shown.
        transform: stripShown ? "translateY(-84px)" : "translateY(0)",
      }}
      onClick={() => openQuote()}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">Quick Inquiry</span>
    </button>
  );
}
