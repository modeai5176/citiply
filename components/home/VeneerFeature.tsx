'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface VeneerFamily {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  link: string;
  tag: string;
  specs: string;
}

const VENEER_FAMILIES: VeneerFamily[] = [
  {
    id: 'natural-veneers',
    title: 'Natural Wood Veneers',
    subtitle: 'European Oak, Walnut & Teak',
    description: 'Authentic crown and cathedral wood grains celebrating pure timber beauty.',
    imageUrl: '/images/categories/natural-veneers.png',
    link: '/categories/natural-veneers',
    tag: 'Natural Series',
    specs: 'Standard 8x4 · Crown Cut'
  },
  {
    id: 'exotic-veneers',
    title: 'Exotic & Rare Series',
    subtitle: 'Burls, Pomelle & Statement Figures',
    description: 'Exclusive species and rare grain formations selected for luxury focal features.',
    imageUrl: '/images/categories/exotic-veneers.png',
    link: '/categories/exotic-veneers',
    tag: 'Exotic Series',
    specs: 'High Figure · Artisanal'
  },
  {
    id: 'coloured-veneers',
    title: 'Dyed & Coloured Veneers',
    subtitle: 'Pre-Finished Architectural Shades',
    description: 'Deep-penetration dyed veneers offering uniform shade consistency across scale.',
    imageUrl: '/images/categories/coloured-veneers.png',
    link: '/categories/coloured-veneers',
    tag: 'Coloured Series',
    specs: 'Chroma & Prism · Pre-finished'
  },
  {
    id: 'textured-veneers',
    title: 'Textured & Fluted Panels',
    subtitle: '3D Relief & Linear Grooves',
    description: 'Rough-cut sawn surfaces, wire-brushed finishes, and 3D fluted timber profiles.',
    imageUrl: '/images/categories/textured-veneers.png',
    link: '/categories/textured-veneers',
    tag: 'Textured Series',
    specs: 'LegnöLuxé & Barcode · 3D Groove'
  }
];

export function VeneerFeature() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;
    if (!section || !header || !cards) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const headerElements = header.querySelectorAll('.reveal-item');
    const cardElements = cards.querySelectorAll('.veneer-card');

    if (prefersReducedMotion) {
      gsap.fromTo(headerElements, { opacity: 0 }, { opacity: 1, duration: 0.6 });
      gsap.fromTo(cardElements, { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.1 });
    } else {
      // Header entrance animation
      gsap.fromTo(
        headerElements,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: 'top 75%' }
        }
      );

      // Cards staggered entrance animation
      gsap.fromTo(
        cardElements,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: cards, start: 'top 80%' }
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section || st.trigger === cards) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-padding overflow-hidden"
      style={{ background: 'var(--color-ivory)' }}
    >
      <div className="content-container">
        {/* Header Row */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="reveal-item text-eyebrow block mb-3" style={{ color: 'var(--color-gold)', opacity: 0 }}>
              Veneer Showcase
            </span>
            <h2 className="reveal-item text-h2 font-serif" style={{ color: 'var(--color-charcoal)', opacity: 0 }}>
              Natural elegance, crafted for distinction.
            </h2>
            <p
              className="reveal-item mt-4 font-sans text-sm md:text-base"
              style={{ color: 'var(--color-stone)', lineHeight: 1.7, opacity: 0 }}
            >
              Explore our signature veneer families — from classic natural hardwoods and rare exotic burls to pre-finished architectural shades and tactile 3D fluted panels.
            </p>
          </div>

          <div className="reveal-item shrink-0 hidden md:block" style={{ opacity: 0 }}>
            <Link
              href="/catalogues/veneers"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)] px-6 py-3 text-xs uppercase tracking-[0.18em] font-medium text-[var(--color-gold)] transition-all duration-300 hover:bg-[var(--color-gold)] hover:text-[var(--color-ivory)] group"
            >
              <span>View All Veneers</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* Top 4 Families/Products Cards Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {VENEER_FAMILIES.map((family) => (
            <article
              key={family.id}
              className="veneer-card group relative flex flex-col overflow-hidden rounded-xl border border-[var(--color-beige)] bg-[var(--surface)] transition-all duration-500 hover:border-[var(--color-gold)] hover:shadow-2xl hover:shadow-[rgb(var(--scrim)/0.4)]"
              style={{ opacity: 0 }}
            >
              <Link href={family.link} className="block relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={family.imageUrl}
                  alt={family.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Dark Gradient Overlay */}
                <div
                  className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                  style={{
                    background: 'linear-gradient(to top, rgb(var(--scrim) / 0.85) 0%, rgb(var(--scrim) / 0.2) 60%, transparent 100%)'
                  }}
                />

                {/* Tag Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className="inline-block rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider backdrop-blur-md"
                    style={{
                      background: 'rgb(var(--color-ivory-rgb) / 0.85)',
                      color: 'var(--color-gold)',
                      border: '1px solid rgb(var(--color-gold-rgb) / 0.3)'
                    }}
                  >
                    {family.tag}
                  </span>
                </div>

                {/* Overlaid Card Info at bottom of image area */}
                <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end">
                  <span className="text-[11px] uppercase tracking-[0.18em] font-medium" style={{ color: 'var(--color-gold)' }}>
                    {family.subtitle}
                  </span>
                  <h3 className="font-serif text-xl mt-1 text-[rgb(var(--on-image))] group-hover:text-[var(--color-gold)] transition-colors duration-300">
                    {family.title}
                  </h3>
                </div>
              </Link>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5 border-t border-[var(--color-beige)] bg-[var(--surface)]">
                <div>
                  <p className="text-xs font-sans text-[var(--color-stone)] leading-relaxed">
                    {family.description}
                  </p>
                  <p className="mt-3 text-[11px] text-[var(--color-soft-grey)] font-mono">
                    {family.specs}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[rgb(var(--color-beige-rgb)/0.5)]">
                  <Link
                    href={family.link}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-medium text-[var(--color-gold)] transition-colors group-hover:text-[var(--color-charcoal)]"
                  >
                    <span>Explore Family</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-10 text-center md:hidden">
          <Link
            href="/catalogues/veneers"
            className="inline-flex items-center justify-center w-full gap-2 rounded-full border border-[var(--color-gold)] px-6 py-3.5 text-xs uppercase tracking-[0.18em] font-medium text-[var(--color-gold)] transition-all duration-300 hover:bg-[var(--color-gold)] hover:text-[var(--color-ivory)]"
          >
            <span>View All Veneers</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
