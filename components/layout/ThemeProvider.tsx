"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const THEMES = [
  { id: "warm-oak", label: "Warm Oak" },
  { id: "slate-brass", label: "Slate & Brass" },
  { id: "noir-walnut", label: "Noir Walnut" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "citiply-theme";
const DEFAULT_THEME: ThemeId = "warm-oak";
const ALLOWED: ThemeId[] = ["warm-oak", "slate-brass", "noir-walnut"];

/** Inline script injected before paint to set data-theme and avoid a flash of the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var allowed=["warm-oak","slate-brass","noir-walnut"];if(!t||allowed.indexOf(t)===-1){t="${DEFAULT_THEME}";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}");}})();`;

/* ──────────────────────────────────────────────────────────────────────────
   The theme is applied purely via the `data-theme` attribute on <html>, which
   re-skins all CSS variables. We deliberately keep the *current theme value*
   OUT of any React state that wraps the page tree — otherwise switching themes
   would re-render (and re-run the mount effects of) every section, which breaks
   GSAP ScrollTrigger layout/animations. Components that need the value (the
   switcher) subscribe to a tiny external store instead.
   ────────────────────────────────────────────────────────────────────────── */

let currentTheme: ThemeId = DEFAULT_THEME;
const listeners = new Set<() => void>();

function readDomTheme(): ThemeId {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const t = document.documentElement.getAttribute("data-theme") as ThemeId | null;
  return t && ALLOWED.includes(t) ? t : DEFAULT_THEME;
}

function applyTheme(next: ThemeId) {
  currentTheme = next;
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore storage failures (private mode) */
  }
  listeners.forEach((l) => l());

  // A theme swap can subtly change layout metrics (font rendering, etc.).
  // Nudge GSAP ScrollTrigger to recompute its positions so scroll-driven
  // reveals stay accurate.
  if (typeof window !== "undefined") {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Read the active theme + a setter. Only re-renders the calling component, not the page tree. */
export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => currentTheme,
    () => DEFAULT_THEME,
  );
  const setTheme = useCallback((next: ThemeId) => applyTheme(next), []);
  return { theme, setTheme };
}

/**
 * Provider only initializes the store from the DOM once and renders children
 * verbatim. Children are NOT re-rendered when the theme changes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    currentTheme = readDomTheme();
    listeners.forEach((l) => l());
  }, []);

  return <>{children}</>;
}
