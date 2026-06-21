'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const QUICK_LINKS = [
  { label: 'Spec Sheets', href: '/downloads' },
  { label: 'Full Catalogue', href: '/catalogues' },
  { label: 'Request Samples', href: '/contact' },
  { label: 'Project Enquiry', href: '/quote' },
];

export function ArchitectMode() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = section.querySelectorAll('.arch-reveal');

    gsap.fromTo(
      items,
      { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.5 : 0.8,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      }
    );

    if (!prefersReducedMotion) {
      const img = section.querySelector('img');
      if (img) {
        gsap.fromTo(img, { yPercent: -8 }, {
          yPercent: 8,
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

  return (
    <section
      ref={sectionRef}
      className="section-padding"
      style={{ background: 'var(--color-charcoal)' }}
    >
      <div className="content-container">
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-center">
          {/* Text + Quick Links */}
          <div className="w-full md:w-1/2">
            <span
              className="arch-reveal text-eyebrow block mb-4"
              style={{ color: 'var(--color-gold)', opacity: 0 }}
            >
              For Architects & Designers
            </span>
            <h2
              className="arch-reveal text-h3 font-serif mb-6"
              style={{ color: 'var(--color-ivory)', opacity: 0 }}
            >
              Professional tools, zero friction.
            </h2>
            <p
              className="arch-reveal font-sans mb-8"
              style={{
                color: 'rgba(247,243,236,0.65)',
                fontSize: 'var(--text-body)',
                lineHeight: 1.7,
                opacity: 0,
              }}
            >
              Access spec sheets, explore collections by material grade, or jump
              straight to the product catalogue. Built for professionals who value
              speed and precision.
            </p>

            <div className="flex flex-wrap gap-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="arch-reveal inline-block py-2.5 px-5 text-sm font-sans font-medium transition-colors duration-300"
                  style={{
                    color: 'var(--color-ivory)',
                    border: '1px solid rgba(247,243,236,0.2)',
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-gold)';
                    e.currentTarget.style.color = 'var(--color-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(247,243,236,0.2)';
                    e.currentTarget.style.color = 'var(--color-ivory)';
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Image */}
          <div
            className="arch-reveal relative w-full md:w-1/2 overflow-hidden"
            style={{ aspectRatio: '4/3', opacity: 0 }}
          >
            <Image
              src="/images/sections/architect-mode.png"
              alt="Architect reviewing material samples and spec sheets"
              fill
              className="object-cover scale-[1.15]"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
