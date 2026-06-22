'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePageLoaded } from '@/components/layout/PageLoadProvider';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const isPageLoaded = usePageLoaded();

  useEffect(() => {
    if (!isPageLoaded) return;

    const section = sectionRef.current;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    const headline = headlineRef.current;
    const eyebrow = eyebrowRef.current;
    const cta = ctaRef.current;
    const scrollCue = scrollCueRef.current;

    if (!section || !video || !overlay || !headline || !eyebrow || !cta || !scrollCue) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const textEls = [eyebrow, headline, cta, scrollCue];

    /* ── Entrance animation (picks up after PageLoader exit) ── */
    const entranceTl = gsap.timeline({
      delay: 0.15,
      onComplete: () => {
        /* Once entrance finishes, ensure inline styles reflect final values
           so that ScrollTrigger scrub has correct "from" state */
        gsap.set(eyebrow, { opacity: 1, y: 0, filter: 'blur(0px)' });
        gsap.set(headline, { opacity: 1, y: 0, filter: 'blur(0px)' });
        gsap.set(cta, { opacity: 1, y: 0 });
        gsap.set(scrollCue, { opacity: 0.5 });
      },
    });

    if (prefersReducedMotion) {
      entranceTl
        .fromTo(eyebrow, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'none' })
        .fromTo(headline, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'none' }, 0.1)
        .fromTo(cta, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'none' }, 0.2)
        .fromTo(scrollCue, { opacity: 0 }, { opacity: 0.5, duration: 0.6, ease: 'none' }, 0.3);
    } else {
      entranceTl
        .fromTo(
          eyebrow,
          { opacity: 0, y: 20, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out' }
        )
        .fromTo(
          headline,
          { opacity: 0, y: 40, filter: 'blur(12px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out' },
          0.15
        )
        .fromTo(
          cta,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' },
          0.5
        )
        .fromTo(
          scrollCue,
          { opacity: 0 },
          { opacity: 0.5, duration: 1.0, ease: 'power3.out' },
          0.7
        );
    }

    /* ── Scroll-linked animations ── */
    if (!prefersReducedMotion) {
      // Video scale on scroll
      gsap.fromTo(
        video,
        { scale: 1 },
        {
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }
      );

      // Overlay darkens
      gsap.fromTo(
        overlay,
        { background: 'linear-gradient(to bottom, transparent 0%, rgba(30,27,24,0.55) 100%)' },
        {
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.75) 100%)',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }
      );

      // Text fades out on scroll — using fromTo with explicit "from" so
      // scrolling back up always restores to full opacity
      gsap.fromTo(
        textEls,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: '40% top',
            end: '85% top',
            scrub: true,
          },
        }
      );
    }

    return () => {
      entranceTl.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, [isPageLoaded]);

  return (
    <section
      ref={sectionRef}
      id="hero-section"
      className="relative overflow-hidden"
      style={{ height: '100svh', minHeight: '600px' }}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/video/hero-store-experience.mp4"
        poster="/video/hero-poster.png"
        autoPlay
        muted
        loop
        playsInline
        style={{ willChange: 'transform' }}
      />

      {/* Gradient Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{
          // Photo legibility scrim (kept dark in all themes; GSAP tweens it on scroll).
          background: 'linear-gradient(to bottom, transparent 0%, rgba(30,27,24,0.55) 100%)',
        }}
      />

      {/* Content — lower-left third */}
      <div className="absolute inset-0 flex items-end">
        <div className="content-container w-full pb-24 md:pb-32 lg:pb-36">
          <div className="max-w-3xl">
            <span
              ref={eyebrowRef}
              className="text-eyebrow block mb-5"
              style={{ color: 'rgb(var(--on-image) / 0.65)', opacity: 0 }}
            >
              Premium Architectural Materials
            </span>
            <h1
              ref={headlineRef}
              className="text-display"
              style={{ color: 'rgb(var(--on-image))', opacity: 0 }}
            >
              Surfaces that shape the mood of a space.
            </h1>
            <a
              ref={ctaRef}
              href="#brand-philosophy"
              className="cta-underline inline-flex items-center gap-3 mt-8"
              style={{ opacity: 0 }}
            >
              Explore the collections <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Cue — bottom center */}
      <div
        ref={scrollCueRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: 0 }}
      >
        <div className="scroll-cue" />
      </div>
    </section>
  );
}
