"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { THEMES, useTheme } from "@/components/layout/ThemeProvider";

export function ThemeSwitcher({ isTransparent = false }: { isTransparent?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="cursor-pointer rounded-full p-2 transition-all duration-300"
        style={{
          border: `1px solid ${isTransparent ? "rgb(var(--on-image) / 0.25)" : "var(--color-beige)"}`,
          color: isTransparent ? "rgb(var(--on-image) / 0.95)" : "var(--color-charcoal)",
        }}
        aria-label="Change color theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg py-1 shadow-lg z-50"
          style={{
            background: "rgb(var(--color-ivory-rgb) / 0.98)",
            border: "1px solid var(--color-beige)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                role="menuitemradio"
                aria-checked={active}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors"
                style={{ color: "var(--color-charcoal)" }}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-beige)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    data-theme={t.id}
                    style={{ background: "var(--color-gold)", border: "1px solid var(--color-stone)" }}
                  />
                  {t.label}
                </span>
                {active && <Check className="h-4 w-4" style={{ color: "var(--color-gold)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
