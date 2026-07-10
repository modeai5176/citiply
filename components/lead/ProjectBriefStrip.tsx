"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { ProjectBriefModal } from "@/components/lead/ProjectBriefModal";

export function ProjectBriefStrip() {
  const [revealed, setRevealed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Reveal only once the user has scrolled past the hero section (or, on pages
  // without a hero, past one viewport). Dismissal is in-memory only, so the
  // strip returns on every reload.
  useEffect(() => {
    function threshold() {
      const hero = document.getElementById("hero-section");
      if (hero) {
        // Reveal a bit before the hero fully leaves the viewport.
        return hero.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.4;
      }
      return window.innerHeight * 0.6;
    }
    function onScroll() {
      setRevealed(window.scrollY > threshold());
    }
    onScroll(); // check initial position
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const visible = revealed && !dismissed;

  function dismiss() {
    setDismissed(true);
  }

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgb(var(--color-gold-rgb)/0.35)] shadow-premium transition-transform duration-500 ease-out"
        style={{
          background: "rgb(var(--color-charcoal-rgb))",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          pointerEvents: visible ? "auto" : "none",
        }}
        aria-hidden={!visible}
        role="region"
        aria-label="Project brief"
      >
          <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
            <Sparkles className="hidden h-5 w-5 shrink-0 text-[rgb(var(--color-gold-rgb))] sm:block" />
            <div className="min-w-0 flex-1">
              <p className="font-serif text-base leading-tight text-[rgb(var(--color-ivory-rgb))] sm:text-lg">
                Need samples for a project?
              </p>
              <p className="hidden truncate text-sm text-[rgb(var(--color-ivory-rgb)/0.7)] sm:block">
                Upload a mood board, BOQ or finish brief — we&apos;ll suggest veneers, panels and matching surfaces.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="shrink-0 cursor-pointer rounded-full bg-[rgb(var(--color-gold-rgb))] px-4 py-2 text-sm font-semibold text-[rgb(var(--color-charcoal-rgb))] transition hover:opacity-90 sm:px-5"
            >
              Start a brief
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 cursor-pointer rounded-full p-2 text-[rgb(var(--color-ivory-rgb)/0.7)] transition hover:bg-[rgb(var(--color-ivory-rgb)/0.1)] hover:text-[rgb(var(--color-ivory-rgb))]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
      </div>

      <ProjectBriefModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
