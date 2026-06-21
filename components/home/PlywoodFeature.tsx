'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function PlywoodFeature() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const image = imageRef.current;
    if (!section || !text || !image) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const textElements = text.querySelectorAll('.reveal-text');
    const duration = prefersReducedMotion ? 0.6 : 1.0;
    const ease = prefersReducedMotion ? 'none' : 'power3.out';

    gsap.fromTo(
      textElements,
      { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
      {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 70%' },
      }
    );

    gsap.fromTo(
      image,
      { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
      {
        opacity: 1,
        y: 0,
        duration: duration + 0.2,
        ease,
        scrollTrigger: { trigger: section, start: 'top 65%' },
      }
    );

    if (!prefersReducedMotion) {
      const img = image.querySelector('img');
      if (img) {
        gsap.fromTo(
          img,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-padding overflow-hidden"
      style={{ background: 'var(--color-beige)' }}
    >
      <div className="flex flex-col-reverse md:flex-row items-stretch">
        {/* Text first (reversed from DoorsFeature) — sans-serif headline */}
        <div
          ref={textRef}
          className="flex flex-col justify-center w-full md:w-[45%]"
          style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1.5rem, 4vw, 4rem)' }}
        >
          <span className="reveal-text text-eyebrow block mb-5" style={{ color: 'var(--color-stone)', opacity: 0 }}>
            Plywood as Foundation
          </span>
          <h2
            className="reveal-text font-sans"
            style={{
              color: 'var(--color-charcoal)',
              fontSize: 'var(--text-h2)',
              fontWeight: 500,
              lineHeight: 1.1,
              opacity: 0,
            }}
          >
            Engineered for trust. Built for decades.
          </h2>
          <p className="reveal-text mt-5 font-sans" style={{ color: 'var(--color-charcoal)', opacity: 0.8, lineHeight: 1.7, fontSize: 'var(--text-body)' }}>
            Our plywood range combines structural integrity with clean, consistent surfaces —
            the invisible backbone that lets design flourish above.
          </p>
        </div>

        {/* Image — full bleed on right edge */}
        <div
          ref={imageRef}
          className="relative w-full md:w-[55%] shrink-0"
          style={{ minHeight: '45vh', opacity: 0 }}
        >
          <Image
            src="/images/sections/plywood-feature.png"
            alt="Plywood cross-section showing clean layered construction"
            fill
            className="object-cover scale-[1.15]"
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
