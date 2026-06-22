"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={cn("fixed bottom-24 right-5 z-[90] flex items-center gap-2 rounded-full px-4 py-3 text-sm shadow-premium", type === "success" ? "bg-text-primary text-[rgb(var(--color-ivory-rgb))]" : "bg-red-600 text-white")}>
      {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {message}
    </div>
  );
}
