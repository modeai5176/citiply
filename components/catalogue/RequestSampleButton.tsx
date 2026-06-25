"use client";

import { Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useQuoteModal } from "@/components/catalogue/QuoteModal";

export function RequestSampleButton({ collectionName }: { collectionName: string }) {
  const { openQuote } = useQuoteModal();

  return (
    <Button
      variant="ghost"
      onClick={() => openQuote({ sku: "", name: `Sample request — ${collectionName}` })}
    >
      <Package className="h-4 w-4" /> Request Sample
    </Button>
  );
}
