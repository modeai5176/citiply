'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GalleryImage {
  src: string;
  caption: string;
}

interface FamilyGallery {
  id: string;
  label: string;
  images: GalleryImage[];
}

// Family tabs, each with its own set of gallery images. Behaviour (tabs,
// crossfade, hover captions) is shared; only the images change per tab.
// Images reuse existing section/collection art — swap in real per-family
// photography later.
const FAMILIES: FamilyGallery[] = [
  {
    id: 'veneers',
    label: 'Veneers',
    images: [
      { src: '/images/collections/warm-naturals.png', caption: 'Warm Naturals' },
      { src: '/images/collections/statement-grains.png', caption: 'Statement Grains' },
      { src: '/images/sections/room-discovery.png', caption: 'Living Feature Wall' },
      { src: '/images/collections/dark-elegance.png', caption: 'Dark Elegance' },
      { src: '/hero/img_1.jpg', caption: 'Wooden Staircase' },
      { src: '/images/collections/modern-neutrals.png', caption: 'Modern Neutrals' },
    ],
  },
  {
    id: 'plywood',
    label: 'Plywood',
    images: [
      { src: '/images/sections/plywood-feature.png', caption: 'Calibrated Plywood' },
      { src: '/hero/img_4.jpg', caption: 'Crafted to Endure' },
      { src: '/images/sections/architect-mode.png', caption: 'Architectural Build' },
      { src: '/hero/img_2.jpg', caption: 'Marine Grade' },
      { src: '/images/collections/modern-neutrals.png', caption: 'Cool Ash Ply' },
      { src: '/hero/img_5.jpg', caption: 'Workshop Detail' },
    ],
  },
  {
    id: 'doors',
    label: 'Doors',
    images: [
      { src: '/images/sections/door-feature.png', caption: 'Statement Entry' },
      { src: '/hero/img_3.jpg', caption: 'Flush Interior Door' },
      { src: '/images/sections/room-discovery.png', caption: 'Concealed Door' },
      { src: '/images/collections/dark-elegance.png', caption: 'Walnut Panelled' },
      { src: '/hero/img_6.jpg', caption: 'Oiled Teak Frame' },
      { src: '/images/collections/warm-naturals.png', caption: 'Natural Oak Door' },
    ],
  },
  {
    id: 'laminates',
    label: 'Laminates & Panels',
    images: [
      { src: '/images/sections/enquiry-texture.png', caption: 'Fluted Panel' },
      { src: '/images/collections/statement-grains.png', caption: 'Figured Laminate' },
      { src: '/hero/img_2.jpg', caption: 'Acoustic Panel' },
      { src: '/images/sections/architect-mode.png', caption: 'Feature Soffit' },
      { src: '/images/collections/modern-neutrals.png', caption: 'Matte Laminate' },
      { src: '/hero/img_1.jpg', caption: 'Slatted Ceiling' },
    ],
  },
];

export function InteractiveGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeFamily, setActiveFamily] = useState(0);

  const family = FAMILIES[activeFamily];

  // Section entrance
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.fromTo(
      section,
      { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.6 : 1.2,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  // Crossfade/stagger the tiles in whenever the active family changes.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tiles = grid.querySelectorAll('.gallery-tile');

    gsap.fromTo(
      tiles,
      { opacity: 0, y: prefersReducedMotion ? 0 : 24, scale: prefersReducedMotion ? 1 : 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: prefersReducedMotion ? 0.4 : 0.7,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.06,
        overwrite: true,
      }
    );
  }, [activeFamily]);

  function selectFamily(index: number) {
    if (index === activeFamily) return;
    setActiveFamily(index);
  }

  return (
    <section
      ref={sectionRef}
      className="section-padding"
      style={{ background: 'var(--surface)', opacity: 0 }}
    >
      <div className="content-container">
        <span className="text-eyebrow block mb-3" style={{ color: 'var(--color-stone)' }}>
          Interactive Gallery
        </span>
        <h2 className="text-h2 font-serif mb-8" style={{ color: 'var(--color-charcoal)' }}>
          Explore by family.
        </h2>

        {/* Family tabs — switch the gallery below */}
        <div
          className="flex gap-1 overflow-x-auto border-b border-[var(--color-beige)] pb-px"
          style={{ scrollbarWidth: 'none' }}
          role="tablist"
          aria-label="Product families"
        >
          {FAMILIES.map((fam, i) => {
            const isActive = i === activeFamily;
            return (
              <button
                key={fam.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => selectFamily(i)}
                className="relative shrink-0 cursor-pointer whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: isActive ? 'var(--color-charcoal)' : 'var(--color-stone)' }}
              >
                {fam.label}
                <span
                  className="absolute inset-x-3 -bottom-px h-[2px] transition-opacity duration-300"
                  style={{ background: 'var(--color-gold)', opacity: isActive ? 1 : 0 }}
                />
              </button>
            );
          })}
        </div>

        {/* Gallery grid — swaps per family. 1 col on mobile, 2 on sm, an
            editorial 3-col rhythm on lg where the first tile spans 2 rows. */}
        <div
          ref={gridRef}
          key={family.id}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[200px] sm:auto-rows-[220px] gap-4 md:gap-5 mt-8"
        >
          {family.images.map((image, i) => (
            <GalleryTile key={`${family.id}-${i}`} image={image} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryTile({ image, index }: { image: GalleryImage; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  // Editorial rhythm on lg: the first tile spans two rows for a hero feel; the
  // rest fill the 3-col grid. On smaller screens every tile is a simple cell.
  const span = index === 0 ? 'lg:row-span-2' : '';

  return (
    <div
      className={`gallery-tile ${span} relative overflow-hidden cursor-pointer group`}
      style={{ opacity: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={image.src}
        alt={image.caption}
        fill
        className="object-cover transition-transform duration-700 ease-out"
        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
        sizes="(min-width: 768px) 50vw, 100vw"
      />

      {/* Bottom gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgb(var(--scrim) / 0.7) 0%, transparent 55%)',
        }}
      />

      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <h3
          className="font-serif text-base md:text-lg transition-all duration-500"
          style={{
            color: 'rgb(var(--on-image))',
            transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
          }}
        >
          {image.caption}
        </h3>
      </div>
    </div>
  );
}
