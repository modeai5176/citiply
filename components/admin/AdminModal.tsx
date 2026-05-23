"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function AdminModal({ children, onClose, wide = false }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`relative w-full rounded-xl bg-white p-6 shadow-premium ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <button className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-text-muted hover:bg-surface hover:text-text-primary" onClick={onClose} aria-label="Close modal">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
