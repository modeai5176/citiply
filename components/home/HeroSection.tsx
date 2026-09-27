'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import DomeGallery from '@/components/home/DomeGallery';
import { usePageLoaded } from '@/components/layout/PageLoadProvider';
import type { Project } from '@/lib/projects-data';
import { BRANDS, brandTileSrc } from '@/lib/brands';
import HERO_VENEERS from '@/lib/hero-veneers.json';
import { INSTAGRAM } from '@/lib/studio-content';
import { BrandMarquee } from '@/components/home/BrandMarquee';

const INSTAGRAM_HANDLE = INSTAGRAM.handle.replace(/^@/, '');
const INSTAGRAM_URL = INSTAGRAM.url;

const BRAND_IMAGES = BRANDS.map((brand) => ({ src: brandTileSrc(brand), alt: `${brand.name} ${brand.range}` }));

// Category/collection art that sits alongside the veneer photos on the globe.
const COLLECTION_IMAGES: { src: string; alt: string }[] = [
  { src: '/images/collections/warm-naturals.png', alt: 'Warm Naturals collection' },
  { src: '/images/catalogue/veneer.png', alt: 'Veneers' },
  { src: '/images/collections/dark-elegance.png', alt: 'Dark Elegance collection' },
  { src: '/images/catalogue/panel.png', alt: 'Panels' },
  { src: '/images/collections/modern-neutrals.png', alt: 'Modern Neutrals collection' },
  { src: '/images/catalogue/door.png', alt: 'Doors' },
  { src: '/images/collections/statement-grains.png', alt: 'Statement Grains collection' },
  { src: '/images/catalogue/plywood.png', alt: 'Plywood' },
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

  // Veneer photos, collection art and project shots make up the globe; the
  // brand tiles are then spread evenly through it so each appears only about
  // once (the dome has 175 cells and cycles the pool to fill them).
  const images = useMemo(() => {
    const pool: { src: string; alt: string; position?: string }[] = [];
    const seen = new Set<string>();
    const add = (image: { src: string; alt: string; position?: string }) => {
      if (image.src && !seen.has(image.src)) {
        seen.add(image.src);
        pool.push(image);
      }
    };

    // Curated by scripts/pick-hero-veneers.ts (clean, full-bleed product photos).
    HERO_VENEERS.forEach(add);
    COLLECTION_IMAGES.forEach(add);
    for (const project of projects) {
      for (const src of [project.heroImage, ...(project.gallery ?? [])]) add({ src, alt: project.name });
    }

    // Deterministic shuffle to ensure random distribution without SSR hydration errors
    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const step = Math.max(2, Math.floor(pool.length / BRAND_IMAGES.length));
    BRAND_IMAGES.forEach((brand, index) => pool.splice(Math.min(pool.length, index * (step + 1) + Math.floor(step / 2)), 0, brand));
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
          Below lg the globe is dropped — the copy centres and a brand marquee
          sits under the CTA instead, keeping the first screen focused on the CTA. */}
      {/* Mobile/tablet only: the enquiry section's background image, anchored left
          so the fluted wall panel (left third of the photo) fills the screen. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[var(--color-ivory)] lg:hidden">
        <div className="hero-texture absolute inset-0 origin-left">
          <Image src="/images/sections/enquiry-texture.png" alt="" fill sizes="(min-width: 1024px) 1px, 100vw" className="object-cover object-left" />
        </div>
        {/* Darken the panel so the copy stays readable; heaviest behind the text and at the bottom. */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgb(var(--scrim) / 0.72) 0%, rgb(var(--scrim) / 0.6) 45%, rgb(var(--scrim) / 0.9) 100%)' }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col lg:flex-row">
        {/* ── Left 30%: eyebrow, title, tagline, buttons ── */}
        <div
          ref={lockupRef}
          className="flex w-full flex-1 flex-col justify-center px-6 pb-10 pt-10 sm:px-10 lg:w-[30%] lg:flex-none lg:shrink-0 lg:py-0 lg:pl-12 xl:pl-16"
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
              href="#full-range"
              className="hero-cta cta-underline inline-flex items-center gap-3"
              style={{ opacity: 0 }}
            >
              <span className="lg:hidden">Explore products</span>
              <span className="hidden lg:inline">Explore the collections</span>{' '}
              <span aria-hidden="true">↓</span>
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

          <BrandMarquee className="-mx-6 mt-14 sm:-mx-10 lg:hidden" />
        </div>

        {/* ── Right 70%: auto-rotating dome gallery ── */}
        <div
          ref={domeRef}
          className="relative hidden min-h-0 w-full flex-1 lg:block lg:w-[70%]"
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
