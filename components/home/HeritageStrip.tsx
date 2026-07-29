'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Reused verbatim from app/(public)/about/page.tsx's STATS — the About page
// is the source of truth for these four figures.
const STATS: Array<[string, string]> = [
  ['75+', 'Years in business'],
  ['3', 'Generations'],
  ['Pan-India', 'Markets served'],
  ['Architects', '& designers first'],
];

// A compact, quiet strip — not a second hero. Surfaces the About page's
// heritage story (currently invisible on the homepage) without competing
// with the surrounding editorial sections.
export function HeritageStrip() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = section.querySelectorAll('.reveal-text');

    gsap.fromTo(
      items,
      { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.5 : 0.8,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: section, start: 'top 85%' },
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
      className="py-12 md:py-16"
      style={{ background: 'var(--color-beige)' }}
    >
      <div className="content-container">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:w-2/3">
            {STATS.map(([value, label]) => (
              <div className="reveal-text" style={{ opacity: 0 }} key={label}>
                <p className="font-serif text-3xl md:text-4xl" style={{ color: 'var(--color-gold)' }}>
                  {value}
                </p>
                <p className="mt-1.5 text-sm font-sans" style={{ color: 'var(--color-charcoal)', opacity: 0.7 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="reveal-text max-w-sm lg:w-1/3 lg:pl-8 lg:border-l" style={{ opacity: 0, borderColor: 'rgb(var(--color-stone-rgb) / 0.25)' }}>
            <p className="font-sans text-sm" style={{ color: 'var(--color-charcoal)', opacity: 0.75, lineHeight: 1.7 }}>
              Three generations of handling material, one curated range — built for architects and designers
              who specify with confidence.
            </p>
            <Link href="/about" className="cta-underline mt-4 inline-flex items-center gap-2" style={{ color: 'var(--color-gold)' }}>
              See our story <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
