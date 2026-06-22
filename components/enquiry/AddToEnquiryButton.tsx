"use client";

import { Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { useEnquiryStore } from "@/lib/enquiry-store";
import { cn } from "@/lib/utils";

export function AddToEnquiryButton({ product, variant = "card" }: { product: Product; variant?: "card" | "detail" }) {
  const { items, addItem, openDrawer } = useEnquiryStore();
  const added = items.some((item) => item.productId === product.id);

  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/25",
        variant === "detail" ? "w-full py-3" : "w-full",
        added ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" : "border-text-primary bg-text-primary text-[rgb(var(--color-ivory-rgb))] hover:opacity-90"
      )}
      onClick={() => {
        if (added) {
          openDrawer();
          return;
        }
        addItem({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          collectionName: product.collectionName ?? "Collection",
          categoryName: product.categoryName ?? "Category",
          thumbnailUrl: product.images[0]?.thumbnailUrl
        });
      }}
      type="button"
    >
      {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      {added ? "Open Enquiry" : "Add to Enquiry"}
    </button>
  );
}
