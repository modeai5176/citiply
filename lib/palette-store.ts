"use client";

// Shared selection state for the homepage "Build Your Palette" configurator
// (components/home/BuildPalette.tsx) and the enquiry form it feeds
// (components/home/WarmEnquiry.tsx). Same module-level singleton +
// useSyncExternalStore pattern as lib/enquiry-store.ts — no persistence,
// since a palette pick only matters within the current homepage visit.

import { useCallback, useSyncExternalStore } from "react";

export type PaletteStep = "veneer" | "panel" | "flooring" | "accent";

export type PaletteSelection = Partial<Record<PaletteStep, string>>;

let state: PaletteSelection = {};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PaletteSelection {
  return state;
}

function getServerSnapshot(): PaletteSelection {
  return {};
}

export function usePaletteStore() {
  const selection = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setStep = useCallback((step: PaletteStep, value: string) => {
    state = { ...state, [step]: state[step] === value ? undefined : value };
    emit();
  }, []);

  const clear = useCallback(() => {
    state = {};
    emit();
  }, []);

  return { selection, setStep, clear };
}

// Renders the current selection as a short human-readable line, e.g.
// "Veneer: Smoked Oak · Panel: Fluted Walnut · Flooring: Wide Plank Ash" —
// used both in the live preview board and as the enquiry pre-fill text.
export function formatPaletteSelection(selection: PaletteSelection): string {
  const labels: Record<PaletteStep, string> = {
    veneer: "Veneer",
    panel: "Panel / Door finish",
    flooring: "Flooring",
    accent: "Accent"
  };
  return (Object.keys(labels) as PaletteStep[])
    .filter((step) => selection[step])
    .map((step) => `${labels[step]}: ${selection[step]}`)
    .join(" · ");
}
