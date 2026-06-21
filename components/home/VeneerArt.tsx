'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VENEER_IMAGES = [
  { src: '/images/veneer-art/grain-oak.png', caption: 'European Oak — cathedral grain, honey undertones' },
  { src: '/images/veneer-art/grain-walnut.png', caption: 'American Walnut — deep swirl, chocolate warmth' },
  { src: '/images/veneer-art/grain-teak.png', caption: 'Burma Teak — golden lustre, timeless elegance' },
  { src: '/images/veneer-art/grain-ash.png', caption: 'White Ash — clean lines, Scandinavian calm' },
  { src: '/images/veneer-art/grain-ebony.png', caption: 'Macassar Ebony — dramatic contrast, statement grain' },
];

const IMAGE_WIDTHS = ['55vw', '45vw', '60vw', '42vw', '52vw'];
const IMAGE_HEIGHTS = ['70vh', '55vh', '65vh', '50vh', '72vh'];

export function VeneerArt() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const totalScrollWidth = track.scrollWidth - window.innerWidth;

    const ctx = gsap.context(() => {
      const tween = gsap.to(track, {
        x: -totalScrollWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          end: () => `+=${totalScrollWidth}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const idx = Math.min(
              Math.floor(progress * VENEER_IMAGES.length),
              VENEER_IMAGES.length - 1
            );
            setActiveIndex(idx);
          },
        },
      });

      // Scale centered image, dim exiting ones
      const items = track.querySelectorAll('.veneer-item');
      items.forEach((item) => {
        const img = item.querySelector('.veneer-img');
        if (img) {
          gsap.fromTo(
            img,
            { scale: 0.92, opacity: 0.5 },
            {
              scale: 1,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: item,
                containerAnimation: tween,
                start: 'left 80%',
                end: 'left 20%',
                scrub: true,
              },
            }
          );
        }
      });
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  /* ── Mobile: vertical carousel ── */
  if (isMobile) {
    return (
      <section className="section-padding" style={{ background: 'var(--color-beige)' }}>
        <div className="content-container">
          <span className="text-eyebrow block mb-6" style={{ color: 'var(--color-stone)' }}>
            Veneer as Art
          </span>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {VENEER_IMAGES.map((img, i) => (
              <div
                key={i}
                className="snap-center shrink-0"
                style={{ width: '80vw', maxWidth: '360px' }}
              >
                <div className="relative rounded-sm overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  <Image src={img.src} alt={img.caption} fill className="object-cover" sizes="80vw" />
                </div>
                <p className="mt-3 text-sm" style={{ color: 'var(--color-charcoal)', opacity: 0.7 }}>
                  {img.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ background: 'var(--color-beige)' }}
    >
      {/* Eyebrow */}
      <div className="absolute top-12 left-0 content-container z-10 w-full">
        <span className="text-eyebrow" style={{ color: 'var(--color-stone)' }}>
          Veneer as Art
        </span>
      </div>

      {/* Horizontal Track */}
      <div
        ref={trackRef}
        className="flex items-center gap-8"
        style={{ height: '100vh', paddingLeft: '8vw', paddingRight: '8vw', willChange: 'transform' }}
      >
        {VENEER_IMAGES.map((img, i) => (
          <div
            key={i}
            className="veneer-item shrink-0 relative"
            style={{ width: IMAGE_WIDTHS[i], height: IMAGE_HEIGHTS[i] }}
          >
            <div className="veneer-img relative w-full h-full overflow-hidden rounded-sm">
              <Image
                src={img.src}
                alt={img.caption}
                fill
                className="object-cover"
                sizes="60vw"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Caption (crossfades) */}
      <div
        ref={captionRef}
        className="absolute bottom-16 left-0 content-container z-10 w-full"
      >
        <p
          className="font-sans text-sm transition-opacity duration-500"
          style={{ color: 'var(--color-charcoal)', opacity: 0.7 }}
          key={activeIndex}
        >
          {VENEER_IMAGES[activeIndex].caption}
        </p>
      </div>
    </section>
  );
}
