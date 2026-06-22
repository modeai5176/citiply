"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, FileImage, Grid3X3, Layers, Plus, X } from "lucide-react";
import type { Collection } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { GlobalSearch } from "@/components/search/GlobalSearch";

export function HeroSlider({ collections }: { collections: Collection[] }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const slide = collections[index];

  if (!slide) {
    return (
      <section className="grid min-h-[56vh] place-items-center bg-dark px-4 text-center text-[rgb(var(--on-image))]">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.24em] text-[rgb(var(--on-image)/0.6)]">Architectural Catalogue</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight sm:text-7xl">Citiply Collections</h1>
          <p className="mt-5 text-[rgb(var(--on-image)/0.75)]">New collections are being prepared. Browse categories or request product guidance.</p>
          <Button className="mt-8 bg-[rgb(var(--on-image))] text-[rgb(var(--scrim))] hover:opacity-90" href="/categories">Browse Categories</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[calc(100vh-112px)] overflow-hidden bg-dark text-[rgb(var(--on-image))]">
      {collections.map((collection, itemIndex) => (
        <motion.div
          animate={{ opacity: itemIndex === index ? 1 : 0 }}
          className="absolute inset-0"
          initial={false}
          key={collection.id}
          transition={{ duration: 0.6 }}
        >
          <Image src={collection.bannerUrl} alt={collection.name} fill priority={itemIndex === 0} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--scrim)/0.72)] via-[rgb(var(--scrim)/0.32)] to-[rgb(var(--scrim)/0.08)]" />
        </motion.div>
      ))}

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-112px)] max-w-7xl items-center px-4 py-24 sm:px-6 lg:px-8">
        <motion.div className="max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-5 inline-flex rounded-full border border-[rgb(var(--on-image)/0.25)] px-4 py-1 text-xs uppercase tracking-[0.28em] text-[rgb(var(--on-image)/0.75)]">Architectural Surface Collection</p>
          <h1 className="text-5xl font-semibold leading-tight sm:text-7xl">{slide.name}</h1>
          <p className="mt-5 text-xl text-[rgb(var(--on-image)/0.82)]">{slide.tagline}</p>
          <div className="mt-8 max-w-2xl">
            <GlobalSearch />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => setExpanded((value) => !value)} className="bg-[rgb(var(--on-image))] text-[rgb(var(--scrim))] hover:opacity-90">
              {expanded ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              Explore More
            </Button>
            {expanded ? (
              <>
                <Link className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--on-image)/0.35)] px-4 py-2.5 text-sm text-[rgb(var(--on-image))] backdrop-blur transition hover:bg-[rgb(var(--on-image))] hover:text-[rgb(var(--scrim))]" href="#features">
                  <Layers className="h-4 w-4" /> Explore Features
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--on-image)/0.35)] px-4 py-2.5 text-sm text-[rgb(var(--on-image))] backdrop-blur transition hover:bg-[rgb(var(--on-image))] hover:text-[rgb(var(--scrim))]" href={`/collections/${slide.slug}`}>
                  <Grid3X3 className="h-4 w-4" /> View Product Range
                </Link>
                {slide.brochureUrl !== "#" ? (
                  <a className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--on-image)/0.35)] px-4 py-2.5 text-sm text-[rgb(var(--on-image))] backdrop-blur transition hover:bg-[rgb(var(--on-image))] hover:text-[rgb(var(--scrim))]" href={slide.brochureUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" /> Download Brochure
                  </a>
                ) : null}
                <button className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-[rgb(var(--on-image)/0.2)] px-4 py-2.5 text-sm text-[rgb(var(--on-image)/0.45)]" disabled>
                  <FileImage className="h-4 w-4" /> Download Texture
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {collections.map((collection, itemIndex) => (
          <button
            aria-label={`Show ${collection.name}`}
            className={`h-1.5 cursor-pointer rounded-full transition-all ${itemIndex === index ? "w-10 bg-accent" : "w-5 bg-[rgb(var(--on-image)/0.45)]"}`}
            key={collection.id}
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </section>
  );
}
