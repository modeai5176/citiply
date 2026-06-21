'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CATALOGUES = [
  {
    title: 'Veneer Lookbook 2026',
    subtitle: 'The complete grain collection',
    src: '/images/catalogue/veneer-lookbook-cover.png',
  },
  {
    title: 'Door Collection',
    subtitle: 'Interior & exterior range',
    src: '/images/catalogue/door-collection-cover.png',
  },
];

export function CatalogueLookbook() {
  const sectionRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stack = stackRef.current;
    if (!section || !stack) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const covers = stack.querySelectorAll('.catalogue-cover');

    if (prefersReducedMotion) {
      gsap.fromTo(covers, { opacity: 0 }, {
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      });
    } else {
      // Start stacked, fan out on scroll
      covers.forEach((cover, i) => {
        const rotation = i === 0 ? -3 : 4;
        const xOffset = i === 0 ? -30 : 30;

        gsap.fromTo(
          cover,
          {
            rotation: 0,
            x: 0,
            opacity: 0,
            scale: 0.92,
          },
          {
            rotation,
            x: xOffset,
            opacity: 1,
            scale: 1,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              end: 'center center',
              scrub: 1,
            },
          }
        );
      });
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
      <div className="content-container text-center">
        <span className="text-eyebrow block mb-3" style={{ color: 'var(--color-stone)' }}>
          Catalogue
        </span>
        <h2 className="text-h2 font-serif mb-16" style={{ color: 'var(--color-charcoal)' }}>
          Browse like a lookbook.
        </h2>

        {/* Fanned Stack */}
        <div
          ref={stackRef}
          className="relative mx-auto flex items-center justify-center"
          style={{ height: '480px', maxWidth: '700px' }}
        >
          {CATALOGUES.map((catalogue, i) => (
            <div
              key={i}
              className="catalogue-cover absolute cursor-pointer"
              style={{
                width: 'clamp(200px, 40vw, 320px)',
                aspectRatio: '3/4',
                opacity: 0,
                boxShadow: '0 16px 48px rgba(30,27,24,0.25)',
                zIndex: CATALOGUES.length - i,
              }}
            >
              <div className="relative w-full h-full overflow-hidden group">
                <Image
                  src={catalogue.src}
                  alt={catalogue.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="40vw"
                />
                <div
                  className="absolute inset-0 flex flex-col items-center justify-end p-6"
                  style={{
                    background: 'linear-gradient(to top, rgba(30,27,24,0.6) 0%, transparent 50%)',
                  }}
                >
                  <h3 className="font-serif text-lg" style={{ color: 'var(--color-ivory)' }}>
                    {catalogue.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'rgba(247,243,236,0.65)' }}>
                    {catalogue.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
