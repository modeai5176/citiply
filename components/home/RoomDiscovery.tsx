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
    x: 48,
    y: 4,
    products: [
      { name: 'Linear Oak Panel', type: 'Veneer Panel', finish: 'Matte Natural' },
      { name: 'Slatted Ash', type: 'Acoustic Panel', finish: 'Brushed' },
    ],
  },
  {
    id: 'wall',
    label: 'Feature Wall',
    x: 30,
    y: 35,
    products: [
      { name: 'Ebony Grain Wall', type: 'Wall Veneer', finish: 'High-Gloss' },
      { name: 'Figured Maple Sheet', type: 'Decorative Veneer', finish: 'Satin' },
      { name: 'Smoked Oak Panel', type: 'Wall Panel', finish: 'Matte' },
    ],
  },
  {
    id: 'door',
    label: 'Entry Door',
    x: 70,
    y: 43,
    products: [
      { name: 'Walnut Flush Door', type: 'Interior Door', finish: 'Semi-Gloss' },
      { name: 'Teak Frame Set', type: 'Door Frame', finish: 'Oiled' },
    ],
  },
  {
    id: 'furniture',
    label: 'Built-in Unit',
    x: 55,
    y: 68,
    products: [
      { name: 'Marine Ply Board', type: 'Plywood', finish: 'Calibrated' },
      { name: 'Cherry Veneer Face', type: 'Furniture Veneer', finish: 'Lacquered' },
    ],
  },
  {
    id: 'floor',
    label: 'Flooring',
    x: 62,
    y: 90,
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
  const zoomRef = useRef<HTMLDivElement>(null);
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

  // Panel slide animation — slides in from the right on desktop, up from the
  // bottom (as a sheet) on mobile so the details aren't clipped by the image.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (isMobile) {
      gsap.set(panel, { x: 0 });
      gsap.to(panel, activeHotspot
        ? { y: 0, duration: 0.45, ease: 'power3.out' }
        : { y: '100%', duration: 0.35, ease: 'power3.in' });
    } else {
      gsap.set(panel, { y: 0 });
      gsap.to(panel, activeHotspot
        ? { x: 0, duration: 0.5, ease: 'power3.out' }
        : { x: '100%', duration: 0.4, ease: 'power3.in' });
    }
  }, [activeHotspot, isMobile]);

  // Minimal zoom toward the active hotspot's position
  useEffect(() => {
    const zoom = zoomRef.current;
    if (!zoom) return;

    const target = HOTSPOTS.find((h) => h.id === activeHotspot);
    if (target) {
      // Pan via translation (not transform-origin) so switching dots while
      // zoomed eases smoothly from one focal point to the next instead of
      // jumping. Origin stays centered; we translate the focal point to center.
      const scale = 1.9;
      // Clamp the focal point so edge dots don't pan past the image and expose gaps.
      const maxShift = (1 - 1 / scale) / 2; // furthest the center can move, as a fraction
      const clamp = (v: number) => Math.max(0.5 - maxShift, Math.min(0.5 + maxShift, v / 100));
      const xPercent = -(clamp(target.x) - 0.5) * scale * 100;
      const yPercent = -(clamp(target.y) - 0.5) * scale * 100;
      gsap.to(zoom, {
        scale,
        xPercent,
        yPercent,
        transformOrigin: 'center center',
        duration: 1,
        ease: 'power2.inOut',
      });
    } else {
      gsap.to(zoom, { scale: 1, xPercent: 0, yPercent: 0, duration: 0.7, ease: 'power2.inOut' });
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
          <div ref={zoomRef} className="absolute inset-0">
            <Image
              src="/images/sections/room-discovery.png"
              alt="Premium interior room showcasing various wood surfaces and materials"
              fill
              className="object-cover scale-[1.1]"
              sizes="100vw"
            />

            {/* Hotspot Markers — inside the zoom wrapper so they pan with the image.
                Shown on all screen sizes (callouts scale down via CSS media queries). */}
            {HOTSPOTS.map((hotspot) => {
                // Flip the callout to the left for dots on the right half so it stays on-screen.
                const flip = hotspot.x > 55;
                // Drop the callout below the dot for dots near the top so the box isn't clipped.
                const drop = hotspot.y < 15;
                const isActive = activeHotspot === hotspot.id;
                // Hide the other dots while one is active.
                const dimmed = activeHotspot !== null && !isActive;
                return (
                  <button
                    key={hotspot.id}
                    className={`hotspot-marker${isActive ? ' is-active' : ''}${flip ? ' flip' : ''}${drop ? ' drop' : ''}${dimmed ? ' is-hidden' : ''}`}
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    onClick={() => setActiveHotspot(isActive ? null : hotspot.id)}
                    aria-label={`Explore ${hotspot.label}`}
                  >
                    <span className="ring" />
                    <span className="dot" />
                    <span className="hotspot-callout">
                      <span className="hotspot-callout-line" />
                      <span className="hotspot-callout-box">
                        <span className="hotspot-callout-label">{hotspot.label}</span>
                        <span className="hotspot-callout-product">{hotspot.products[0].name}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Backdrop dim when panel open — covers the image on desktop, the
              whole viewport on mobile (where the panel is a bottom sheet). */}
          {activeHotspot && (
            <div
              className={`${isMobile ? 'fixed z-40' : 'absolute z-10'} inset-0 bg-[rgb(var(--scrim)/0.3)] transition-opacity duration-500 cursor-pointer`}
              onClick={() => setActiveHotspot(null)}
            />
          )}
        </div>

        {/* Slide-in Panel — side panel on desktop, bottom sheet on mobile */}
        <div
          ref={panelRef}
          className={isMobile
            ? "fixed bottom-0 left-0 right-0 z-50 overflow-y-auto rounded-t-2xl shadow-2xl"
            : "absolute top-0 right-0 h-full overflow-y-auto z-20"}
          style={{
            width: isMobile ? '100%' : '400px',
            maxWidth: '100%',
            maxHeight: isMobile ? '75vh' : undefined,
            background: 'var(--color-ivory)',
            borderLeft: isMobile ? 'none' : '1px solid var(--color-beige)',
            borderTop: isMobile ? '1px solid var(--color-beige)' : 'none',
            transform: isMobile ? 'translateY(100%)' : 'translateX(100%)',
          }}
        >
          {activeData && (
            <div className="p-6 sm:p-8">
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
    </section>
  );
}
