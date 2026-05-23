"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { ProductCodeBadge } from "@/components/ui/ProductCodeBadge";
import { useQuoteModal } from "@/components/catalogue/QuoteModal";
import { AddToEnquiryButton } from "@/components/enquiry/AddToEnquiryButton";

export function ProductCard({ product }: { product: Product }) {
  const { openQuote } = useQuoteModal();
  const main = product.images[0];
  const openProductQuote = () => {
    openQuote({
      sku: product.sku,
      name: product.name,
      finish: product.finish,
      colorTone: product.colorTone,
      imageUrl: main.thumbnailUrl
    });
  };

  return (
    <motion.article whileHover={{ y: -4 }} className="group overflow-hidden rounded-xl border border-border bg-white transition hover:shadow-md">
      <Link href={`/products/${product.sku}`} className="block">
        <div className="relative aspect-[4/5] bg-surface">
          <Image src={main.thumbnailUrl} alt={main.alt} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" placeholder="blur" blurDataURL={main.blurDataUrl} className="object-cover" />
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.sku}`} className="block">
          <ProductCodeBadge code={product.sku} />
          <h3 className="mt-3 font-medium">{product.name}</h3>
          <p className="mt-1 text-sm text-text-muted">{product.finish} / {product.colorTone}</p>
        </Link>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            className="w-full cursor-pointer rounded-full border border-accent bg-white px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/25"
            onClick={openProductQuote}
          >
            Enquire Now
          </button>
          <AddToEnquiryButton product={product} />
        </div>
      </div>
    </motion.article>
  );
}
