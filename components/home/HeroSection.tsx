'use client';

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import DomeGallery from '@/components/home/DomeGallery';
import { usePageLoaded } from '@/components/layout/PageLoadProvider';
import type { Project } from '@/lib/projects-data';

const INSTAGRAM_HANDLE = 'cit.ply';
const INSTAGRAM_URL = 'https://instagram.com/cit.ply';

// Mood-collection art (public/images/collections) and the 8 family cover
// shots (public/images/catalogue) always ship with the repo, so they seed the
// dome alongside whatever real project photography exists — the gallery
// never looks sparse on a fresh install with few/no projects.
const COLLECTION_IMAGES: { src: string; alt: string }[] = [
  { src: '/images/collections/warm-naturals.png', alt: 'Warm Naturals collection' },
  { src: '/images/collections/dark-elegance.png', alt: 'Dark Elegance collection' },
  { src: '/images/collections/modern-neutrals.png', alt: 'Modern Neutrals collection' },
  { src: '/images/collections/statement-grains.png', alt: 'Statement Grains collection' },
  { src: '/images/catalogue/veneer.png', alt: 'Veneers' },
  { src: '/images/catalogue/panel.png', alt: 'Panels' },
  { src: '/images/catalogue/door.png', alt: 'Doors' },
  { src: '/images/catalogue/plywood.png', alt: 'Plywood' },
  { src: '/images/catalogue/laminates.png', alt: 'Laminates' },
  { src: '/images/catalogue/flooring.png', alt: 'Flooring' },
  { src: '/images/catalogue/exterior.png', alt: 'Exterior' },
  { src: '/images/catalogue/millwork.png', alt: 'Millwork' },
];

export function HeroSection({ projects = [] }: { projects?: Project[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const handleRef = useRef<HTMLAnchorElement>(null);
  const domeRef = useRef<HTMLDivElement>(null);
  const isPageLoaded = usePageLoaded();

  // Pool every project image (hero + gallery) plus the mood-collection art,
  // de-duplicated, for the dome tiles.
  const images = useMemo(() => {
    const pool: { src: string; alt: string }[] = [];
    const seen = new Set<string>();
    for (const image of COLLECTION_IMAGES) {
      if (!seen.has(image.src)) {
        seen.add(image.src);
        pool.push(image);
      }
    }
    for (const project of projects) {
      const all = [project.heroImage, ...(project.gallery ?? [])];
      for (const src of all) {
        if (src && !seen.has(src)) {
          seen.add(src);
          pool.push({ src, alt: project.name });
        }
      }
    }
    return pool;
  }, [projects]);

  useEffect(() => {
    if (!isPageLoaded) return;

    const section = sectionRef.current;
    const eyebrow = eyebrowRef.current;
    const wordmark = wordmarkRef.current;
    const tagline = taglineRef.current;
    const rule = ruleRef.current;
    const cta = ctaRef.current;
    const handle = handleRef.current;
    const dome = domeRef.current;

    if (!section || !eyebrow || !wordmark || !tagline || !rule || !cta || !handle || !dome) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      /* ── Whole-section entry: fade + gentle zoom-in on open ── */
      tl.fromTo(
        section,
        { opacity: 0, scale: prefersReducedMotion ? 1 : 1.04 },
        {
          opacity: 1,
          scale: 1,
          duration: prefersReducedMotion ? 0.5 : 1.4,
          ease: 'expo.out',
          clearProps: 'scale',
        },
        0
      );

      tl.fromTo(
        eyebrow,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' },
        0.2
      );

      tl.fromTo(
        wordmark,
        { opacity: 0, y: 34, filter: 'blur(14px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out' },
        0.3
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

      tl.fromTo(
        dome,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' },
        0.25
      );
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
        // Start hidden; the GSAP timeline fades + zooms the section in on open.
        opacity: 0,
      }}
    >
      {/* 30 / 70 split: copy on the left, spinning dome gallery on the right.
          Stacks to a single column below lg. */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col lg:flex-row">
        {/* ── Left 30%: eyebrow, title, tagline, buttons ── */}
        <div
          ref={lockupRef}
          className="flex w-full shrink-0 flex-col justify-center px-6 pt-24 pb-6 sm:px-10 lg:w-[30%] lg:py-0 lg:pl-12 xl:pl-16"
        >
          <span
            ref={eyebrowRef}
            className="text-eyebrow block mb-5"
            style={{ color: 'rgb(var(--on-image) / 0.6)', opacity: 0 }}
          >
            Premium Architectural Materials
          </span>

          <h1
            ref={wordmarkRef}
            className="text-display uppercase"
            style={{
              color: 'rgb(var(--on-image))',
              fontWeight: 400,
              letterSpacing: '0.02em',
              lineHeight: 0.95,
              textShadow: '0 14px 50px rgb(var(--scrim) / 0.6)',
              opacity: 0,
              willChange: 'transform, filter',
            }}
          >
            Citiply
          </h1>

          <span
            ref={ruleRef}
            aria-hidden="true"
            className="mt-7 block origin-left"
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
            One World, Every Material.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
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
                className="block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: 'var(--color-gold)' }}
              />
              @{INSTAGRAM_HANDLE}
            </a>
          </div>
        </div>

        {/* ── Right 70%: auto-rotating dome gallery ── */}
        <div
          ref={domeRef}
          className="relative min-h-0 w-full flex-1 lg:w-[70%]"
          style={{ opacity: 0, willChange: 'transform, opacity' }}
        >
          <DomeGallery
            images={images}
            grayscale={false}
            overlayBlurColor="rgb(var(--scrim))"
            imageBorderRadius="14px"
            openedImageBorderRadius="14px"
            fit={0.6}
            autoSpin
            autoSpinSpeed={5}
          />
        </div>
      </div>
    </section>
  );
}
