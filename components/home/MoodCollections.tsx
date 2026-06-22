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

        {/* Editorial Masonry Grid — single column on mobile, 12-col editorial
            spans on md+ (placement handled in .mood-grid CSS). */}
        <div ref={tilesRef} className="mood-grid grid gap-4 md:gap-5">
          {COLLECTIONS.map((collection, i) => (
            <CollectionTile key={i} collection={collection} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionTile({
  collection,
  index,
}: {
  collection: (typeof COLLECTIONS)[number];
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`collection-tile mood-tile-${index} relative overflow-hidden cursor-pointer group`}
      style={{ opacity: 0, minHeight: '220px' }}
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
          background: 'linear-gradient(to top, rgb(var(--scrim) / 0.7) 0%, transparent 50%)',
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <h3
          className="font-serif text-lg md:text-xl"
          style={{ color: 'rgb(var(--on-image))' }}
        >
          {collection.name}
        </h3>
        <p
          className="font-sans text-sm mt-1 transition-all duration-500"
          style={{
            color: 'rgb(var(--on-image) / 0.75)',
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
