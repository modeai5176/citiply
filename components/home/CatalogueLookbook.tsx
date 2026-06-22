'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Catalogue } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

// Fallback cover art if a catalogue has no image set in the DB.
const FALLBACK_COVERS = [
  '/images/catalogue/veneer-lookbook-cover.png',
  '/images/catalogue/door-collection-cover.png',
];

export function CatalogueLookbook({ catalogues }: { catalogues: Catalogue[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  // Showcase the (up to) first two catalogues from the database.
  const items = catalogues.slice(0, 2);

  useEffect(() => {
    const section = sectionRef.current;
    const stack = stackRef.current;
    if (!section || !stack) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const covers = Array.from(stack.querySelectorAll<HTMLElement>('.catalogue-cover'));
    if (covers.length === 0) return;

    if (prefersReducedMotion) {
      gsap.fromTo(covers, { opacity: 0 }, {
        opacity: 1,
        duration: 0.6,
        stagger: 0.12,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      });
      return () => {
        ScrollTrigger.getAll().forEach((st) => st.trigger === section && st.kill());
      };
    }

    // Scroll-driven reveal: cards start stacked + flat, then separate, tilt and
    // rise into a spread as the section scrolls through view (scrub = tied to
    // scroll position, so it scrubs back and forth with the wheel).
    const spreads = [
      { x: '-58%', rotation: -6, y: -10 }, // left card
      { x: '58%', rotation: 6, y: 10 },    // right card
    ];

    const ctx = gsap.context(() => {
      covers.forEach((cover, i) => {
        const spread = spreads[i] ?? { x: 0, rotation: 0, y: 0 };
        gsap.fromTo(
          cover,
          { xPercent: 0, x: 0, y: 40, rotation: 0, opacity: 0, scale: 0.9 },
          {
            x: spread.x,
            y: spread.y,
            rotation: spread.rotation,
            opacity: 1,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'center center',
              scrub: 1,
            },
          },
        );
      });
    }, section);

    return () => ctx.revert();
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="section-padding overflow-hidden"
      style={{ background: 'var(--color-beige)' }}
    >
      <div className="content-container text-center">
        <span className="text-eyebrow block mb-3" style={{ color: 'var(--color-stone)' }}>
          Catalogue
        </span>
        <h2 className="text-h2 font-serif mb-16" style={{ color: 'var(--color-charcoal)' }}>
          Browse like a lookbook.
        </h2>

        {/* Spread of catalogue covers */}
        <div
          ref={stackRef}
          className="relative mx-auto flex items-center justify-center h-[360px] sm:h-[420px] md:h-[480px]"
          style={{ maxWidth: '700px' }}
        >
          {items.map((catalogue, i) => (
            <Link
              key={catalogue.id}
              href={`/catalogues/${catalogue.slug}`}
              aria-label={`Browse ${catalogue.name}`}
              className="catalogue-cover absolute block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] rounded-sm"
              style={{
                width: 'clamp(180px, 38vw, 300px)',
                aspectRatio: '3/4',
                opacity: 0,
                boxShadow: '0 16px 48px rgb(var(--scrim) / 0.25)',
                zIndex: items.length - i,
              }}
            >
              <div className="relative w-full h-full overflow-hidden rounded-sm group">
                <Image
                  src={catalogue.imageUrl || FALLBACK_COVERS[i] || FALLBACK_COVERS[0]}
                  alt={catalogue.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 768px) 38vw, 60vw"
                />
                <div
                  className="absolute inset-0 flex flex-col items-center justify-end p-6"
                  style={{ background: 'linear-gradient(to top, rgb(var(--scrim) / 0.65) 0%, transparent 55%)' }}
                >
                  <h3 className="font-serif text-lg" style={{ color: 'rgb(var(--on-image))' }}>
                    {catalogue.name}
                  </h3>
                  {catalogue.description ? (
                    <p className="text-xs mt-1 line-clamp-1 max-w-[90%]" style={{ color: 'rgb(var(--on-image) / 0.7)' }}>
                      {catalogue.description}
                    </p>
                  ) : null}
                  <span
                    className="mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                    style={{ color: 'rgb(var(--on-image))' }}
                  >
                    Browse →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
