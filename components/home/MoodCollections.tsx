'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const COLLECTIONS = [
  {
    name: 'Warm Naturals',
    mood: 'Sun-dappled oak and honeyed tones',
    src: '/images/collections/warm-naturals.png',
    size: 'tall', // tall tile
  },
  {
    name: 'Dark Elegance',
    mood: 'Rich espresso and midnight walnut',
    src: '/images/collections/dark-elegance.png',
    size: 'wide', // wide tile
  },
  {
    name: 'Modern Neutrals',
    mood: 'Cool ash, clean lines, quiet confidence',
    src: '/images/collections/modern-neutrals.png',
    size: 'tall',
  },
  {
    name: 'Statement Grains',
    mood: 'Bold figuring, dramatic contrast',
    src: '/images/collections/statement-grains.png',
    size: 'wide',
  },
];

export function MoodCollections() {
  const sectionRef = useRef<HTMLElement>(null);
  const tilesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const tiles = tilesRef.current;
    if (!section || !tiles) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = tiles.querySelectorAll('.collection-tile');

    gsap.fromTo(
      items,
      {
        opacity: 0,
        y: prefersReducedMotion ? 0 : 40,
        scale: prefersReducedMotion ? 1 : 0.96,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: prefersReducedMotion ? 0.6 : 1.2,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.15,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-padding"
      style={{ background: 'var(--color-ivory)' }}
    >
      <div className="content-container">
        <span className="text-eyebrow block mb-3" style={{ color: 'var(--color-stone)' }}>
          Curated Collections
        </span>
        <h2 className="text-h2 font-serif mb-12" style={{ color: 'var(--color-charcoal)' }}>
          Find your mood.
        </h2>

        {/* Editorial Masonry Grid */}
        <div
          ref={tilesRef}
          className="grid gap-4 md:gap-5"
          style={{
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: 'minmax(180px, auto)',
          }}
        >
          {COLLECTIONS.map((collection, i) => {
            // Masonry-like placement — alternate between tall and wide spans
            const gridStyles: Record<string, string> = {};

            if (i === 0) {
              gridStyles.gridColumn = '1 / 6';
              gridStyles.gridRow = '1 / 3';
            } else if (i === 1) {
              gridStyles.gridColumn = '6 / 13';
              gridStyles.gridRow = '1 / 2';
            } else if (i === 2) {
              gridStyles.gridColumn = '6 / 9';
              gridStyles.gridRow = '2 / 4';
            } else if (i === 3) {
              gridStyles.gridColumn = '9 / 13';
              gridStyles.gridRow = '2 / 4';
            }

            return (
              <CollectionTile key={i} collection={collection} style={gridStyles} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CollectionTile({
  collection,
  style,
}: {
  collection: (typeof COLLECTIONS)[number];
  style: Record<string, string>;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="collection-tile relative overflow-hidden cursor-pointer group"
      style={{ ...style, opacity: 0, minHeight: '220px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={collection.src}
        alt={collection.name}
        fill
        className="object-cover transition-transform duration-700 ease-out"
        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
        sizes="(min-width: 768px) 50vw, 100vw"
      />

      {/* Bottom gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(30,27,24,0.7) 0%, transparent 50%)',
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <h3
          className="font-serif text-lg md:text-xl"
          style={{ color: 'var(--color-ivory)' }}
        >
          {collection.name}
        </h3>
        <p
          className="font-sans text-sm mt-1 transition-all duration-500"
          style={{
            color: 'rgba(247,243,236,0.75)',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          {collection.mood}
        </p>
      </div>
    </div>
  );
}
