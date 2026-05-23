"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type EnquiryItem = {
  productId: string;
  sku: string;
  name: string;
  collectionName: string;
  categoryName: string;
  thumbnailUrl?: string;
  quantity: string;
  note: string;
};

type EnquiryState = {
  items: EnquiryItem[];
  drawerOpen: boolean;
};

const storageKey = "citiply-enquiry-list";
let state: EnquiryState = { items: [], drawerOpen: false };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(next: Partial<EnquiryState>) {
  state = { ...state, ...next };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(state.items));
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return { items: [], drawerOpen: false };
}

export function useEnquiryStore() {
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) state = { ...state, items: JSON.parse(stored) as EnquiryItem[] };
      emit();
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((item: Omit<EnquiryItem, "quantity" | "note">) => {
    if (state.items.some((existing) => existing.productId === item.productId)) {
      setState({ drawerOpen: true });
      return;
    }
    setState({ items: [...state.items, { ...item, quantity: "", note: "" }], drawerOpen: true });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setState({ items: state.items.filter((item) => item.productId !== productId) });
  }, []);

  const updateItem = useCallback((productId: string, patch: Partial<Pick<EnquiryItem, "quantity" | "note">>) => {
    setState({ items: state.items.map((item) => item.productId === productId ? { ...item, ...patch } : item) });
  }, []);

  const clearItems = useCallback(() => setState({ items: [] }), []);
  const openDrawer = useCallback(() => setState({ drawerOpen: true }), []);
  const closeDrawer = useCallback(() => setState({ drawerOpen: false }), []);

  return { ...current, addItem, removeItem, updateItem, clearItems, openDrawer, closeDrawer };
}
