'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Image from 'next/image';
import { usePageLoaded } from '@/components/layout/PageLoadProvider';

/* Curated Instagram posts (@cit.ply). They're finished creatives with their
   own text/logos, so the hero lets them drift as a marquee wall and keeps the
   brand lockup floating above a soft vignette — never text on top of a post. */
const INSTAGRAM_POSTS = [
  '/hero/img_1.jpg',
  '/hero/img_2.jpg',
  '/hero/img_3.jpg',
  '/hero/img_4.jpg',
  '/hero/img_5.jpg',
  '/hero/img_6.jpg',
];

const INSTAGRAM_HANDLE = 'cit.ply';
const INSTAGRAM_URL = 'https://instagram.com/cit.ply';

/* Two rows drifting in opposite directions. Duplicate the set so the loop is
   seamless (translate by exactly -50% of the doubled track). */
const ROW_A = [...INSTAGRAM_POSTS, ...INSTAGRAM_POSTS];
const ROW_B = [...[...INSTAGRAM_POSTS].reverse(), ...[...INSTAGRAM_POSTS].reverse()];

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const rowARef = useRef<HTMLDivElement>(null);
  const rowBRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const handleRef = useRef<HTMLAnchorElement>(null);
  const isPageLoaded = usePageLoaded();

  useEffect(() => {
    if (!isPageLoaded) return;

    const section = sectionRef.current;
    const wall = wallRef.current;
    const rowA = rowARef.current;
    const rowB = rowBRef.current;
    const wordmark = wordmarkRef.current;
    const tagline = taglineRef.current;
    const rule = ruleRef.current;
    const cta = ctaRef.current;
    const handle = handleRef.current;

    if (!section || !wall || !rowA || !rowB || !wordmark || !tagline || !rule || !cta || !handle) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;

    const ctx = gsap.context(() => {
      /* ── Infinite marquee drift (opposite directions) ── */
      if (!prefersReducedMotion) {
        gsap.to(rowA, {
          xPercent: -50,
          duration: 60,
          ease: 'none',
          repeat: -1,
        });
        gsap.fromTo(
          rowB,
          { xPercent: -50 },
          { xPercent: 0, duration: 70, ease: 'none', repeat: -1 }
        );
      }

      /* ── Entrance: wall settles in, lockup rises ── */
      const tl = gsap.timeline({ delay: 0.1 });

      tl.fromTo(
        wall,
        { opacity: 0, scale: 1.12 },
        { opacity: 1, scale: 1.06, duration: 1.6, ease: 'expo.out' }
      );

      tl.fromTo(
        wordmark,
        { opacity: 0, y: 34, filter: 'blur(14px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out' },
        0.35
      );

      tl.fromTo(
        rule,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, ease: 'power3.inOut' },
        0.7
      );

      tl.fromTo(
        tagline,
        { opacity: 0, y: 18, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'expo.out' },
        0.85
      );

      tl.fromTo(
        [cta, handle],
        { opacity: 0, y: 14 },
        {
          opacity: (i: number) => (i === 0 ? 1 : 0.75),
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
        },
        1.0
      );

      /* ── Subtle cursor drift on the whole wall (pointer devices) ── */
      if (!prefersReducedMotion && !isTouch) {
        const wallX = gsap.quickTo(wall, 'x', { duration: 1.0, ease: 'power3.out' });
        const wallY = gsap.quickTo(wall, 'y', { duration: 1.0, ease: 'power3.out' });
        const onMove = (e: MouseEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          wallX(nx * 26);
          wallY(ny * 18);
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
      }
    }, section);

    return () => ctx.revert();
  }, [isPageLoaded]);

  return (
    <section
      ref={sectionRef}
      id="hero-section"
      className="relative overflow-hidden"
      style={{
        height: '100svh',
        minHeight: '600px',
        backgroundColor: 'rgb(var(--scrim))',
        // Keep the hero hidden until the PageLoader has finished exiting.
        opacity: isPageLoaded ? 1 : 0,
        visibility: isPageLoaded ? 'visible' : 'hidden',
      }}
    >
      {/* ── Marquee wall: two counter-drifting rows ── */}
      <div
        ref={wallRef}
        className="absolute inset-0 flex flex-col justify-center gap-4 sm:gap-6"
        style={{
          // Slight overscan so cursor drift never exposes an edge.
          transform: 'scale(1.06)',
          willChange: 'transform',
          opacity: 0,
        }}
      >
        <MarqueeRow rowRef={rowARef} items={ROW_A} keyPrefix="a" />
        <MarqueeRow rowRef={rowBRef} items={ROW_B} keyPrefix="b" />
      </div>

      {/* ── Soft vignette so the centered lockup reads over any post ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 62% at center, rgb(var(--scrim) / 0.82) 0%, rgb(var(--scrim) / 0.55) 42%, rgb(var(--scrim) / 0.28) 72%, rgb(var(--scrim) / 0.45) 100%)',
        }}
      />

      {/* ── Centered brand lockup ── */}
      <div
        ref={lockupRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <div
          ref={wordmarkRef}
          className="select-none"
          style={{ opacity: 0, willChange: 'transform, filter' }}
        >
          <span
            className="text-eyebrow block mb-5"
            style={{ color: 'rgb(var(--on-image) / 0.6)' }}
          >
            Premium Architectural Materials
          </span>
          <h1
            className="text-display uppercase"
            style={{
              color: 'rgb(var(--on-image))',
              fontWeight: 400,
              letterSpacing: '0.02em',
              lineHeight: 0.95,
              textShadow: '0 14px 50px rgb(var(--scrim) / 0.6)',
            }}
          >
            Citiply
          </h1>
        </div>

        <span
          ref={ruleRef}
          aria-hidden="true"
          className="block mt-7 origin-center"
          style={{
            width: 'clamp(90px, 16vw, 180px)',
            height: '1px',
            background: 'var(--color-gold)',
            transform: 'scaleX(0)',
          }}
        />

        <p
          ref={taglineRef}
          className="mt-7 max-w-md"
          style={{
            opacity: 0,
            color: 'rgb(var(--on-image) / 0.82)',
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontSize: 'clamp(1.05rem, 2.2vw, 1.5rem)',
            lineHeight: 1.35,
            willChange: 'transform, filter',
          }}
        >
          Surfaces that shape the mood of a space.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <a
            ref={ctaRef}
            href="#brand-philosophy"
            className="cta-underline inline-flex items-center gap-3"
            style={{ opacity: 0 }}
          >
            Explore the collections <span aria-hidden="true">↓</span>
          </a>

          <a
            ref={handleRef}
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition-opacity hover:!opacity-100"
            style={{
              opacity: 0,
              color: 'rgb(var(--on-image) / 0.75)',
              fontFamily: 'var(--font-general-sans), system-ui, sans-serif',
              fontSize: 'var(--text-eyebrow)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            <span
              aria-hidden="true"
              className="block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-gold)' }}
            />
            @{INSTAGRAM_HANDLE}
          </a>
        </div>
      </div>
    </section>
  );
}

/* One marquee row: a horizontal track of post cards. The track holds two
   copies of the set so the -50% loop is seamless. */
function MarqueeRow({
  rowRef,
  items,
  keyPrefix,
}: {
  rowRef: React.RefObject<HTMLDivElement>;
  items: string[];
  keyPrefix: string;
}) {
  return (
    <div className="relative w-full overflow-visible">
      <div
        ref={rowRef}
        className="flex gap-4 sm:gap-6 w-max"
        style={{ willChange: 'transform' }}
      >
        {items.map((src, index) => (
          <div
            key={`${keyPrefix}-${index}`}
            className="relative shrink-0 overflow-hidden rounded-sm"
            style={{
              width: 'clamp(200px, 22vw, 340px)',
              aspectRatio: '4 / 5',
              boxShadow: '0 20px 50px rgb(var(--scrim) / 0.45)',
            }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={index < 3}
              sizes="(max-width: 768px) 40vw, 22vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
