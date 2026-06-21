'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function DoorsFeature() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const imageWrap = imageWrapRef.current;
    const text = textRef.current;
    if (!section || !imageWrap || !text) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.fromTo(imageWrap, { opacity: 0 }, {
        opacity: 1,
        duration: 0.6,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      });
      gsap.fromTo(text, { opacity: 0 }, {
        opacity: 1,
        duration: 0.6,
        scrollTrigger: { trigger: section, start: 'top 70%' },
      });
    } else {
      // Image clip-path reveal
      gsap.fromTo(
        imageWrap,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: section, start: 'top 70%' },
        }
      );

      // Text fade up with delay
      const textElements = text.querySelectorAll('.reveal-text');
      gsap.fromTo(
        textElements,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          stagger: 0.1,
          delay: 0.2,
          scrollTrigger: { trigger: section, start: 'top 65%' },
        }
      );

      // Image Parallax
      const img = imageWrap.querySelector('img');
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
      style={{ background: 'var(--color-ivory)' }}
    >
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Image — 60% width, full-bleed on left edge */}
        <div
          ref={imageWrapRef}
          className="relative w-full md:w-[60%] shrink-0"
          style={{ minHeight: '50vh', clipPath: 'inset(0 100% 0 0)' }}
        >
          <Image
            src="/images/sections/door-feature.png"
            alt="Premium architectural door — warm toned wood with clean modern lines"
            fill
            className="object-cover scale-[1.15]"
            sizes="(min-width: 768px) 60vw, 100vw"
          />
        </div>

        {/* Text — 40% width */}
        <div
          ref={textRef}
          className="flex flex-col justify-center w-full md:w-[40%]"
          style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1.5rem, 4vw, 4rem)' }}
        >
          <span className="reveal-text text-eyebrow block mb-5" style={{ color: 'var(--color-stone)', opacity: 0 }}>
            Doors as First Impression
          </span>
          <h2 className="reveal-text text-h2 font-serif" style={{ color: 'var(--color-charcoal)', opacity: 0 }}>
            The threshold defines everything that follows.
          </h2>
          <p className="reveal-text mt-5 font-sans" style={{ color: 'var(--color-charcoal)', opacity: 0.8, lineHeight: 1.7, fontSize: 'var(--text-body)' }}>
            Our door collections blend precision engineering with natural beauty — creating entrances
            that set the tone for the entire interior experience.
          </p>
        </div>
      </div>
    </section>
  );
}
