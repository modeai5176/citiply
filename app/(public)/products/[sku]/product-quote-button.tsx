"use client";

import { Button } from "@/components/ui/Button";
import { useQuoteModal } from "@/components/catalogue/QuoteModal";

export function ProductQuoteButton({ product }: { product: { sku: string; name: string; finish?: string; colorTone?: string; imageUrl?: string } }) {
  const { openQuote } = useQuoteModal();
  return <Button onClick={() => openQuote(product)}>Request Quote</Button>;
}
