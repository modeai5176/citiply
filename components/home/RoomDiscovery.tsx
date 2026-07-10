'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Hotspot {
  id: string;
  label: string;
  x: number; // percentage from left (desktop 16/9 image space)
  y: number; // percentage from top
  // Optional mobile overrides — the square crop hides the far left/right of
  // the 16/9 image, so wide-spread features need repositioning into the
  // visible center band. Falls back to x/y when omitted.
  mx?: number;
  my?: number;
  products: { name: string; type: string; finish: string }[];
}

interface Application {
  id: string;
  label: string;
  image: string;
  hotspots: Hotspot[];
}

// Each tab is one application/space. Behaviour (dots, zoom, slide panel) is
// shared; only the image and hotspot data change per tab. Images reuse existing
// section art as placeholders — swap in real per-application photos later and
// fine-tune the hotspot x/y to match.
const APPLICATIONS: Application[] = [
  {
    id: 'residential',
    label: 'Residential',
    image: '/images/sections/room-discovery.png',
    hotspots: [
      { id: 'ceiling', label: 'Ceiling Panel', x: 48, y: 4, products: [
        { name: 'Linear Oak Panel', type: 'Veneer Panel', finish: 'Matte Natural' },
        { name: 'Slatted Ash', type: 'Acoustic Panel', finish: 'Brushed' },
      ] },
      { id: 'wall', label: 'Feature Wall', x: 30, y: 35, products: [
        { name: 'Smoked Oak Panel', type: 'Wall Panel', finish: 'Matte' },
        { name: 'Figured Maple Sheet', type: 'Decorative Veneer', finish: 'Satin' },
      ] },
      { id: 'door', label: 'Entry Door', x: 70, y: 43, products: [
        { name: 'Walnut Flush Door', type: 'Interior Door', finish: 'Semi-Gloss' },
        { name: 'Teak Frame Set', type: 'Door Frame', finish: 'Oiled' },
      ] },
      { id: 'furniture', label: 'Built-in Unit', x: 55, y: 68, products: [
        { name: 'Marine Ply Board', type: 'Plywood', finish: 'Calibrated' },
        { name: 'Cherry Veneer Face', type: 'Furniture Veneer', finish: 'Lacquered' },
      ] },
      { id: 'floor', label: 'Flooring', x: 62, y: 90, products: [
        { name: 'Herringbone Oak', type: 'Engineered Floor', finish: 'UV Oiled' },
        { name: 'Wide Plank Walnut', type: 'Engineered Floor', finish: 'Brushed Matte' },
      ] },
    ],
  },
  {
    id: 'hospitality',
    label: 'Hospitality',
    image: '/images/sections/architect-mode.png',
    hotspots: [
      { id: 'reception-wall', label: 'Reception Wall', x: 32, y: 28, products: [
        { name: 'Ebony Grain Wall', type: 'Wall Veneer', finish: 'High-Gloss' },
        { name: 'Walnut Fluted Panel', type: 'Fluted Panel', finish: 'Satin' },
      ] },
      { id: 'feature-ceiling', label: 'Feature Ceiling', x: 52, y: 8, products: [
        { name: 'Slatted Walnut Ceiling', type: 'Acoustic Panel', finish: 'Brushed' },
      ] },
      { id: 'suite-door', label: 'Suite Door', x: 72, y: 46, products: [
        { name: 'Teak Statement Door', type: 'Interior Door', finish: 'Oiled' },
      ] },
      { id: 'lounge-floor', label: 'Lounge Floor', x: 58, y: 88, products: [
        { name: 'Wide Plank Walnut', type: 'Engineered Floor', finish: 'Brushed Matte' },
      ] },
    ],
  },
  {
    id: 'corporate',
    label: 'Corporate Office',
    image: '/images/sections/plywood-feature.png',
    hotspots: [
      { id: 'acoustic-wall', label: 'Acoustic Wall', x: 28, y: 38, products: [
        { name: 'Ash Acoustic Panel', type: 'Acoustic Veneer', finish: 'Matte' },
        { name: 'Oak Fluted Panel', type: 'Fluted Panel', finish: 'Satin' },
      ] },
      { id: 'ceiling-baffle', label: 'Ceiling Baffle', x: 50, y: 6, products: [
        { name: 'Linear Ash Baffle', type: 'Ceiling System', finish: 'Brushed' },
      ] },
      { id: 'cabin-door', label: 'Cabin Door', x: 74, y: 48, products: [
        { name: 'Ash Flush Door', type: 'Interior Door', finish: 'Semi-Gloss' },
      ] },
      { id: 'workstation', label: 'Workstation Surface', x: 56, y: 72, products: [
        { name: 'Calibrated Plywood', type: 'Plywood', finish: 'Calibrated' },
        { name: 'Cool Ash Laminate', type: 'Laminate', finish: 'Matte' },
      ] },
    ],
  },
  {
    id: 'retail',
    label: 'Retail',
    image: '/images/sections/door-feature.png',
    hotspots: [
      { id: 'display-wall', label: 'Display Wall', x: 30, y: 32, products: [
        { name: 'Macassar Ebony Veneer', type: 'Decorative Veneer', finish: 'High-Gloss' },
        { name: 'Figured Maple Sheet', type: 'Wall Veneer', finish: 'Satin' },
      ] },
      { id: 'feature-soffit', label: 'Feature Soffit', x: 50, y: 7, products: [
        { name: 'Ebony Fluted Panel', type: 'Fluted Panel', finish: 'High-Gloss' },
      ] },
      { id: 'entry', label: 'Entry Door', x: 72, y: 45, products: [
        { name: 'High-Gloss Display Door', type: 'Interior Door', finish: 'High-Gloss' },
      ] },
      { id: 'retail-floor', label: 'Flooring', x: 60, y: 90, products: [
        { name: 'Polished Stone-look Floor', type: 'Engineered Floor', finish: 'Polished' },
      ] },
    ],
  },
  {
    id: 'feature-walls',
    label: 'Feature Walls',
    image: '/images/sections/enquiry-texture.png',
    hotspots: [
      { id: 'fluted', label: 'Fluted Section', x: 15, y: 42, mx: 34, my: 30, products: [
        { name: 'Smoked Oak Fluted Panel', type: 'Fluted Panel', finish: 'Matte' },
      ] },
      { id: 'figured', label: 'Figured Veneer', x: 62, y: 40, mx: 55, my: 52, products: [
        { name: 'Ebony Grain Wall', type: 'Wall Veneer', finish: 'High-Gloss' },
        { name: 'Figured Maple Sheet', type: 'Decorative Veneer', finish: 'Satin' },
      ] },
      { id: 'trim', label: 'Edge Trim', x: 79, y: 30, mx: 70, my: 72, products: [
        { name: 'Colour-matched Edge-banding', type: 'Trim', finish: 'Matte' },
      ] },
      // { id: 'concealed-door', label: 'Concealed Door', x: 90, y: 62, products: [
      //   { name: 'Concealed Veneer Door', type: 'Interior Door', finish: 'Matte' },
      // ] },
    ],
  },
];

export function RoomDiscovery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeApp, setActiveApp] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const application = APPLICATIONS[activeApp];
  const hotspots = application.hotspots;

  // Switch tab: change the application and reset any open hotspot so the
  // panel/zoom return to a clean state for the new room.
  function selectApp(index: number) {
    if (index === activeApp) return;
    setActiveHotspot(null);
    setActiveApp(index);
  }

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

  // Panel reveal animation — slides in from the right (overlaid) on desktop;
  // on mobile it's an in-flow block below the image that expands/collapses its
  // height so the detail opens BELOW the photo rather than over it.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (isMobile) {
      // Reset any desktop transform, then animate height open/closed.
      gsap.set(panel, { x: 0, y: 0 });
      if (activeHotspot) {
        gsap.to(panel, { height: 'auto', duration: 0.45, ease: 'power3.out' });
      } else {
        gsap.to(panel, { height: 0, duration: 0.35, ease: 'power3.in' });
      }
    } else {
      gsap.set(panel, { y: 0, height: '100%', clearProps: 'height' });
      gsap.to(panel, activeHotspot
        ? { x: 0, duration: 0.5, ease: 'power3.out' }
        : { x: '100%', duration: 0.4, ease: 'power3.in' });
    }
  }, [activeHotspot, isMobile]);

  // Minimal zoom toward the active hotspot's position
  useEffect(() => {
    const zoom = zoomRef.current;
    if (!zoom) return;

    const target = hotspots.find((h) => h.id === activeHotspot);
    if (target) {
      // Use the same mobile-override coords the dot is rendered at, so the zoom
      // focuses the tapped feature rather than its (cropped-off) desktop spot.
      const tx = isMobile && target.mx != null ? target.mx : target.x;
      const ty = isMobile && target.my != null ? target.my : target.y;
      // Pan via translation (not transform-origin) so switching dots while
      // zoomed eases smoothly from one focal point to the next instead of
      // jumping. Origin stays centered; we translate the focal point to center.
      const scale = 1.9;
      // Clamp the focal point so edge dots don't pan past the image and expose
      // gaps. Computed against the active zoom scale (independent of the 1.1
      // resting scale on the wrapper).
      const maxShift = (1 - 1 / scale) / 2; // furthest the center can move, as a fraction
      const clampX = (v: number) => Math.max(0.5 - maxShift, Math.min(0.5 + maxShift, v / 100));
      const xPercent = -(clampX(tx) - 0.5) * scale * 100;

      // The detail now opens below the image (mobile) or beside it (desktop),
      // so nothing covers the photo — center the focal point on both.
      const yFocus = Math.max(0.5 - maxShift, Math.min(0.5 + maxShift, ty / 100));
      const yPercent = -(yFocus - 0.5) * scale * 100;

      gsap.to(zoom, {
        scale,
        xPercent,
        yPercent,
        transformOrigin: 'center center',
        duration: 1,
        ease: 'power2.inOut',
      });
    } else {
      // Resting state is the 1.1 base zoom (not 1) so the image doesn't shrink
      // when a hotspot is closed.
      gsap.to(zoom, { scale: 1.1, xPercent: 0, yPercent: 0, duration: 0.7, ease: 'power2.inOut' });
    }
  }, [activeHotspot, hotspots, isMobile]);

  const activeData = hotspots.find((h) => h.id === activeHotspot);

  // Dots are positioned by container %, but object-cover crops the image when
  // the container aspect differs from the image's native 16/9. On mobile the
  // box is 4/5 (taller/narrower) → the sides are center-cropped, so a raw
  // `left: x%` drifts. Remap image-space coords into the visible window.
  // (The shared 1.1 wrapper zoom scales dots + image together, so it needs no
  // handling here.)
  const IMAGE_RATIO = 16 / 9;
  const containerRatio = isMobile ? 1 : 16 / 9; // square on mobile, 16/9 desktop
  function mapHotspot(x: number, y: number) {
    let visX = 1;
    let visY = 1;
    if (containerRatio < IMAGE_RATIO) {
      visX = containerRatio / IMAGE_RATIO;        // sides cropped
    } else if (containerRatio > IMAGE_RATIO) {
      visY = IMAGE_RATIO / containerRatio;        // top/bottom cropped
    }
    const originX = (1 - visX) / 2;               // centered crop
    const originY = (1 - visY) / 2;
    const cx = (x / 100 - originX) / visX;
    const cy = (y / 100 - originY) / visY;
    return { left: `${cx * 100}%`, top: `${cy * 100}%` };
  }

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
        <h2 className="text-h2 font-serif mb-8" style={{ color: 'var(--color-charcoal)' }}>
          Every surface tells a story.
        </h2>

        {/* Application tabs — switch the room image + hotspot set below */}
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-beige)] pb-px" style={{ scrollbarWidth: 'none' }} role="tablist" aria-label="Applications">
          {APPLICATIONS.map((app, i) => {
            const isActive = i === activeApp;
            return (
              <button
                key={app.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => selectApp(i)}
                className="relative shrink-0 cursor-pointer whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: isActive ? 'var(--color-charcoal)' : 'var(--color-stone)' }}
              >
                {app.label}
                <span
                  className="absolute inset-x-3 -bottom-px h-[2px] transition-opacity duration-300"
                  style={{ background: 'var(--color-gold)', opacity: isActive ? 1 : 0 }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative" style={{ maxWidth: '1600px', margin: '2rem auto 0' }}>
        {/* Room Image — square on mobile so it's not tiny; 16/9 on desktop.
            The taller mobile box center-crops the image sides via object-cover,
            so the hotspot dots are remapped (mapHotspot) into the visible
            window to stay pinned to their features. */}
        <div
          className="relative w-full overflow-hidden aspect-square sm:aspect-[16/9]"
        >
          {/* The base 1.1 zoom lives on this wrapper (via GSAP, see the zoom
              effect) — not on the img — so the hotspot dots scale in lockstep
              with the image; otherwise off-centre dots like the entry door
              drift away from their target. */}
          <div ref={zoomRef} className="absolute inset-0" style={{ transform: 'scale(1.1)' }}>
            <Image
              src={application.image}
              alt={`${application.label} interior showcasing CITIPLY surfaces and materials`}
              fill
              className="object-cover"
              sizes="100vw"
            />

            {/* Hotspot Markers — inside the zoom wrapper so they pan with the image.
                Shown on all screen sizes (callouts scale down via CSS media queries). */}
            {hotspots.map((hotspot) => {
                // Use mobile overrides where provided so wide-spread features
                // stay inside the square crop's visible band.
                const hx = isMobile && hotspot.mx != null ? hotspot.mx : hotspot.x;
                const hy = isMobile && hotspot.my != null ? hotspot.my : hotspot.y;
                const pos = mapHotspot(hx, hy);
                // Flip/drop are decided from the *mapped* on-screen position (a
                // percentage of the visible box) — not the raw image-space x/y —
                // so callouts stay on-screen after the crop remap too.
                const mappedX = parseFloat(pos.left);
                const mappedY = parseFloat(pos.top);
                // Flip the callout to the left for dots on the right half so it stays on-screen.
                const flip = mappedX > 55;
                // Drop the callout below the dot for dots near the top so the box isn't clipped.
                const drop = mappedY < 15;
                const isActive = activeHotspot === hotspot.id;
                // Hide the other dots while one is active.
                const dimmed = activeHotspot !== null && !isActive;
                return (
                  <button
                    key={hotspot.id}
                    className={`hotspot-marker${isActive ? ' is-active' : ''}${flip ? ' flip' : ''}${drop ? ' drop' : ''}${dimmed ? ' is-hidden' : ''}`}
                    style={pos}
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

          {/* Backdrop dim when panel open — a light scrim over the image so the
              focused material still reads. On mobile it's confined to the image
              (not fixed over the whole viewport) and tapping it closes. */}
          {activeHotspot && (
            <div
              className="absolute inset-0 z-10 bg-[rgb(var(--scrim)/0.25)] transition-opacity duration-500 cursor-pointer"
              onClick={() => setActiveHotspot(null)}
            />
          )}
        </div>

        {/* Details Panel —
            Desktop: full-height side panel sliding in from the right, overlaid
            on the image.
            Mobile: a normal in-flow block that reveals BELOW the image, so the
            detail never covers the photo. */}
        <div
          ref={panelRef}
          className={isMobile
            ? "overflow-hidden"
            : "absolute top-0 right-0 h-full overflow-y-auto z-20"}
          style={{
            width: isMobile ? '100%' : '400px',
            maxWidth: '100%',
            background: 'var(--color-ivory)',
            borderLeft: isMobile ? 'none' : '1px solid var(--color-beige)',
            borderTop: isMobile ? '1px solid var(--color-beige)' : 'none',
            transform: isMobile ? 'none' : 'translateX(100%)',
            height: isMobile ? 0 : undefined,
          }}
        >
          {activeData && (
            <div className="p-4 sm:p-8">
              {/* Mobile grab-handle affordance */}
              {isMobile && (
                <div
                  aria-hidden="true"
                  className="mx-auto mb-3 h-1 w-10 rounded-full"
                  style={{ background: 'var(--color-beige)' }}
                />
              )}
              <div className="flex items-center justify-between mb-4 sm:mb-8">
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

              <div className="space-y-4 sm:space-y-6">
                {activeData.products.map((product, i) => (
                  <div
                    key={i}
                    className="pb-4 sm:pb-6"
                    style={{ borderBottom: i < activeData.products.length - 1 ? '1px solid var(--color-beige)' : 'none' }}
                  >
                    <h3 className="font-serif text-base sm:text-lg mb-1" style={{ color: 'var(--color-charcoal)' }}>
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
