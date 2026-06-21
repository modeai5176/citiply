'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Hotspot {
  id: string;
  label: string;
  x: number; // percentage from left
  y: number; // percentage from top
  products: { name: string; type: string; finish: string }[];
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'ceiling',
    label: 'Ceiling Panel',
    x: 35,
    y: 15,
    products: [
      { name: 'Linear Oak Panel', type: 'Veneer Panel', finish: 'Matte Natural' },
      { name: 'Slatted Ash', type: 'Acoustic Panel', finish: 'Brushed' },
    ],
  },
  {
    id: 'door',
    label: 'Entry Door',
    x: 18,
    y: 50,
    products: [
      { name: 'Walnut Flush Door', type: 'Interior Door', finish: 'Semi-Gloss' },
      { name: 'Teak Frame Set', type: 'Door Frame', finish: 'Oiled' },
    ],
  },
  {
    id: 'wall',
    label: 'Feature Wall',
    x: 68,
    y: 40,
    products: [
      { name: 'Ebony Grain Wall', type: 'Wall Veneer', finish: 'High-Gloss' },
      { name: 'Figured Maple Sheet', type: 'Decorative Veneer', finish: 'Satin' },
      { name: 'Smoked Oak Panel', type: 'Wall Panel', finish: 'Matte' },
    ],
  },
  {
    id: 'furniture',
    label: 'Built-in Unit',
    x: 78,
    y: 68,
    products: [
      { name: 'Marine Ply Board', type: 'Plywood', finish: 'Calibrated' },
      { name: 'Cherry Veneer Face', type: 'Furniture Veneer', finish: 'Lacquered' },
    ],
  },
  {
    id: 'floor',
    label: 'Flooring',
    x: 50,
    y: 85,
    products: [
      { name: 'Herringbone Oak', type: 'Engineered Floor', finish: 'UV Oiled' },
      { name: 'Wide Plank Walnut', type: 'Engineered Floor', finish: 'Brushed Matte' },
    ],
  },
];

export function RoomDiscovery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    if (!prefersReducedMotion) {
      const img = section.querySelector('img');
      if (img) {
        gsap.fromTo(img, { yPercent: -5 }, {
          yPercent: 5,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  // Panel slide animation
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (activeHotspot) {
      gsap.to(panel, { x: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(panel, { x: '100%', duration: 0.4, ease: 'power3.in' });
    }
  }, [activeHotspot]);

  const activeData = HOTSPOTS.find((h) => h.id === activeHotspot);

  return (
    <section
      ref={sectionRef}
      className="section-padding overflow-hidden"
      style={{ background: 'var(--color-ivory)', opacity: 0 }}
    >
      <div className="content-container">
        <span className="text-eyebrow block mb-3" style={{ color: 'var(--color-stone)' }}>
          Interactive Discovery
        </span>
        <h2 className="text-h2 font-serif mb-10" style={{ color: 'var(--color-charcoal)' }}>
          Every surface tells a story.
        </h2>
      </div>

      <div className="relative" style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Room Image */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <Image
            src="/images/sections/room-discovery.png"
            alt="Premium interior room showcasing various wood surfaces and materials"
            fill
            className="object-cover scale-[1.1]"
            sizes="100vw"
          />

          {/* Backdrop dim when panel open */}
          {activeHotspot && (
            <div
              className="absolute inset-0 bg-black/30 transition-opacity duration-500 cursor-pointer"
              onClick={() => setActiveHotspot(null)}
            />
          )}

          {/* Hotspot Markers (desktop only) */}
          {!isMobile &&
            HOTSPOTS.map((hotspot) => (
              <button
                key={hotspot.id}
                className="hotspot-marker"
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                onClick={() => setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
                aria-label={`Explore ${hotspot.label}`}
              >
                <span className="ring" />
                <span className="dot" />
              </button>
            ))}
        </div>

        {/* Slide-in Panel */}
        <div
          ref={panelRef}
          className="absolute top-0 right-0 h-full overflow-y-auto z-20"
          style={{
            width: isMobile ? '100%' : '400px',
            maxWidth: '100%',
            background: 'var(--color-ivory)',
            borderLeft: '1px solid var(--color-beige)',
            transform: 'translateX(100%)',
          }}
        >
          {activeData && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <span className="text-eyebrow" style={{ color: 'var(--color-gold)' }}>
                  {activeData.label}
                </span>
                <button
                  onClick={() => setActiveHotspot(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ color: 'var(--color-charcoal)' }}
                  aria-label="Close panel"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {activeData.products.map((product, i) => (
                  <div
                    key={i}
                    className="pb-6"
                    style={{ borderBottom: i < activeData.products.length - 1 ? '1px solid var(--color-beige)' : 'none' }}
                  >
                    <h3 className="font-serif text-lg mb-1" style={{ color: 'var(--color-charcoal)' }}>
                      {product.name}
                    </h3>
                    <p className="text-sm mb-1" style={{ color: 'var(--color-stone)' }}>
                      {product.type}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-deep-brown)', opacity: 0.6 }}>
                      Finish: {product.finish}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile fallback: tappable list */}
      {isMobile && (
        <div className="content-container mt-6">
          <div className="space-y-3">
            {HOTSPOTS.map((hotspot) => (
              <button
                key={hotspot.id}
                onClick={() => setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
                className="w-full text-left p-4 transition-colors rounded-sm"
                style={{
                  background: activeHotspot === hotspot.id ? 'var(--color-beige)' : 'transparent',
                  border: '1px solid var(--color-beige)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-gold)' }} />
                  <span className="font-sans text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>
                    {hotspot.label}
                  </span>
                  <span className="ml-auto text-xs" style={{ color: 'var(--color-stone)' }}>
                    {hotspot.products.length} products
                  </span>
                </div>

                {activeHotspot === hotspot.id && (
                  <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--color-sand)' }}>
                    {hotspot.products.map((product, i) => (
                      <div key={i}>
                        <p className="font-serif text-sm" style={{ color: 'var(--color-charcoal)' }}>
                          {product.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-stone)' }}>
                          {product.type} · {product.finish}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
