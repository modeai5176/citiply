"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/types";

export function ImageGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(images[0]);

  return (
    <div>
      <div className="relative aspect-[5/4] overflow-hidden rounded-xl bg-surface">
        <Image src={active.imageUrl} alt={active.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" placeholder="blur" blurDataURL={active.blurDataUrl} className="object-cover" priority />
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto">
        {images.map((image) => (
          <button className="relative h-20 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-surface" onClick={() => setActive(image)} key={image.id}>
            <Image src={image.thumbnailUrl} alt={image.alt} fill sizes="96px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
