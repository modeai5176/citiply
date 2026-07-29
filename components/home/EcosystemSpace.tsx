'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Callout = {
  id: string;
  label: string;
  x: number; // percentage from left
  y: number; // percentage from top
  family: string;
  catalogueSlug: string;
  detail: string;
};

// One space, every family — the module that states outright what the dot-map
// (RoomDiscovery) only implies: this is one brand's coordinated ecosystem, not
// SKUs assembled by chance. Each callout names the product family rather than
// a product name.
const CALLOUTS: Callout[] = [
  {
    id: 'wall',
    label: 'Veneer wall',
    x: 22,
    y: 40,
    family: 'Veneers',
    catalogueSlug: 'veneers',
    detail: 'A single flitch sequence-matched across the feature wall, so grain reads as one continuous surface.',
  },
  {
    id: 'ceiling',
    label: 'Fluted panel ceiling',
    x: 50,
    y: 10,
    family: 'Panels',
    catalogueSlug: 'panels',
    detail: 'Linear fluted panels overhead, toned to the wall veneer rather than picked as a separate finish.',
  },
  {
    id: 'door',
    label: 'Flush door',
    x: 76,
    y: 46,
    family: 'Doors',
    catalogueSlug: 'doors',
    detail: 'A flush door skinned in the same species as the surrounding walls, so the threshold disappears into the room.',
  },
  {
    id: 'floor',
    label: 'Engineered flooring',
    x: 58,
    y: 88,
    family: 'Flooring',
    catalogueSlug: 'flooring',
    detail: 'Engineered wide-plank flooring, warm-toned to sit beneath the veneer rather than compete with it.',
  },
  {
    id: 'shelving',
    label: 'Millwork shelving',
    x: 14,
    y: 68,
    family: 'Millwork',
    catalogueSlug: 'millwork',
    detail: 'Bespoke joinery built from the same core material as the panelling, finished to match in the same run.',
  },
  {
    id: 'laminate',
    label: 'Laminate joinery',
    x: 40,
    y: 72,
    family: 'Laminates',
    catalogueSlug: 'laminates',
    detail: 'Interior cabinetry faced in a laminate colour-matched to the veneer tone for consistency inside every drawer.',
  },
];

export function EcosystemSpace() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = CALLOUTS.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.fromTo(
      section,
      { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.6 : 1.1,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 78%' },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  function selectCallout(id: string) {
    setActiveId((current) => (current === id ? null : id));
  }

  return (
    <section
      ref={sectionRef}
      className="section-padding"
      style={{ background: 'var(--color-ivory)', opacity: 0 }}
    >
      <div className="content-container">
        <span className="text-eyebrow block mb-3" style={{ color: 'var(--color-stone)' }}>
          One Space, Every Family
        </span>
        <h2 className="text-h2 font-serif mb-4" style={{ color: 'var(--color-charcoal)', maxWidth: '820px' }}>
          Specified together, not assembled by chance.
        </h2>
        <p
          className="max-w-2xl font-sans mb-10"
          style={{ color: 'var(--color-charcoal)', opacity: 0.75, fontSize: 'var(--text-body)', lineHeight: 1.7 }}
        >
          Every surface in this room — wall, ceiling, door, floor and joinery — comes from one material house.
          That is the CITIPLY difference: veneer, panel, door, flooring and millwork specified as one ecosystem,
          not sourced from five different suppliers and hoped into agreement.
        </p>
      </div>

      <div className="content-container">
        <div
          className="relative w-full overflow-hidden rounded-sm aspect-[16/9]"
          style={{ background: 'var(--surface)' }}
        >
          <Image
            src="/images/sections/room-discovery.png"
            alt="A single living space finished entirely in coordinated CITIPLY surfaces — veneer wall, fluted ceiling, flush door, engineered flooring and millwork"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 1600px, 100vw"
          />

          {CALLOUTS.map((callout) => {
            const isActive = activeId === callout.id;
            const dimmed = activeId !== null && !isActive;
            const flip = callout.x > 55;
            const drop = callout.y < 15;
            return (
              <button
                key={callout.id}
                className={`hotspot-marker${flip ? ' flip' : ''}${drop ? ' drop' : ''}${dimmed ? ' is-hidden' : ''}${isActive ? ' ecosystem-marker-selected' : ''}`}
                style={{ left: `${callout.x}%`, top: `${callout.y}%` }}
                onClick={() => selectCallout(callout.id)}
                aria-label={`Explore ${callout.label}`}
                aria-pressed={isActive}
              >
                <span className="ring" />
                <span className="dot" />
                <span className="hotspot-callout">
                  <span className="hotspot-callout-line" />
                  <span className="hotspot-callout-box">
                    <span className="hotspot-callout-label">{callout.family}</span>
                    <span className="hotspot-callout-product">{callout.label}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail card — opens below the image rather than overlaying it, so
            the coordinated-space photo is never obscured. */}
        <div
          className="grid transition-[grid-template-rows] duration-500 ease-out"
          style={{ gridTemplateRows: active ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            {active ? (
              <div
                className="mt-4 flex flex-col gap-3 rounded-sm p-6 sm:flex-row sm:items-center sm:justify-between"
                style={{ background: 'var(--surface)', border: '1px solid var(--color-beige)' }}
              >
                <div>
                  <span className="text-eyebrow" style={{ color: 'var(--color-gold)' }}>{active.family}</span>
                  <h3 className="mt-1 font-serif text-lg" style={{ color: 'var(--color-charcoal)' }}>{active.label}</h3>
                  <p className="mt-2 max-w-xl font-sans text-sm" style={{ color: 'var(--color-charcoal)', opacity: 0.75, lineHeight: 1.6 }}>
                    {active.detail}
                  </p>
                </div>
                <Link
                  href={`/catalogues/${active.catalogueSlug}`}
                  className="cta-underline shrink-0"
                  style={{ color: 'var(--color-gold)' }}
                >
                  Explore {active.family} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
