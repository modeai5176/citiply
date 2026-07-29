'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ProductFamilyWithCount } from '@/lib/catalogue-data';

gsap.registerPlugin(ScrollTrigger);

// The single highest-impact module on the page — proves the eight-family
// ecosystem in one scroll (Apple's product-line-grid move). Reuses the same
// catalogue data and routes as CatalogueCard, just at homepage scale with a
// collection counter.
export function FullRangeGrid({ families }: { families: ProductFamilyWithCount[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heading = section.querySelectorAll('.reveal-text');
    const tiles = grid.querySelectorAll('.family-tile');

    gsap.fromTo(
      heading,
      { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.5 : 0.9,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 78%' },
      }
    );

    gsap.fromTo(
      tiles,
      { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.5 : 0.8,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: grid, start: 'top 82%' },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section || st.trigger === grid) st.kill();
      });
    };
  }, []);

  if (!families.length) return null;

  return (
    <section
      ref={sectionRef}
      className="section-padding"
      style={{ background: 'var(--color-ivory)' }}
    >
      <div className="content-container">
        <span className="reveal-text text-eyebrow block mb-3" style={{ color: 'var(--color-stone)', opacity: 0 }}>
          The Full Range
        </span>
        <h2 className="reveal-text text-h2 font-serif mb-4" style={{ color: 'var(--color-charcoal)', opacity: 0 }}>
          The Complete Citiply Universe.
        </h2>
        <p
          className="reveal-text max-w-2xl font-sans mb-10"
          style={{ color: 'var(--color-charcoal)', opacity: 0, fontSize: 'var(--text-body)', lineHeight: 1.7 }}
        >
          Eight product families, one material house — every surface engineered, finished and specified to
          work as a single coordinated system.
        </p>

        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
        >
          {families.map((family) => (
            <FamilyTile key={family.id} family={family} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FamilyTile({ family }: { family: ProductFamilyWithCount }) {
  return (
    <Link
      href={`/catalogues/${family.slug}`}
      className="family-tile group relative block aspect-[4/5] overflow-hidden rounded-sm"
      style={{ opacity: 0 }}
    >
      <Image
        src={family.imageUrl}
        alt={family.name}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgb(var(--scrim) / 0.8) 0%, rgb(var(--scrim) / 0.15) 55%, transparent 75%)' }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg md:text-xl" style={{ color: 'rgb(var(--on-image))' }}>
            {family.name}
          </h3>
          <span
            className="shrink-0 whitespace-nowrap text-xs font-sans opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ color: 'rgb(var(--on-image) / 0.75)' }}
          >
            {family.collectionCount} collection{family.collectionCount === 1 ? '' : 's'}
          </span>
        </div>
        {family.description ? (
          <p className="mt-2 line-clamp-2 text-sm font-sans" style={{ color: 'rgb(var(--on-image) / 0.75)' }}>
            {family.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
