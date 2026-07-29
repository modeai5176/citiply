'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, BookOpen, Package, Send } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const QUICK_LINKS = [
  { label: 'Spec Sheets', href: '/downloads', icon: FileText },
  { label: 'Full Catalogue', href: '/catalogues', icon: BookOpen },
  { label: 'Request Samples', href: '/contact', icon: Package },
  { label: 'Project Enquiry', href: '/quote', icon: Send },
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
      const imgs = section.querySelectorAll('.arch-parallax img');
      imgs.forEach((img) => {
        gsap.fromTo(img, { yPercent: -8 }, {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
        });
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
                color: 'rgb(var(--color-ivory-rgb) / 0.65)',
                fontSize: 'var(--text-body)',
                lineHeight: 1.7,
                opacity: 0,
              }}
            >
              Access spec sheets, explore collections by material grade, or jump
              straight to the product catalogue. Built for professionals who value
              speed and precision.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="arch-reveal group flex items-center gap-3 rounded-sm px-4 py-4 transition-colors duration-300"
                    style={{
                      border: '1px solid rgb(var(--color-ivory-rgb) / 0.16)',
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgb(var(--color-ivory-rgb) / 0.16)'; }}
                  >
                    <Icon className="h-5 w-5 shrink-0 transition-colors" style={{ color: 'var(--color-gold)' }} />
                    <span
                      className="text-sm font-sans font-medium transition-colors"
                      style={{ color: 'var(--color-ivory)' }}
                    >
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Two-image editorial composition — workspace + spec-sheet detail,
              given equal visual weight to the consumer-facing modules. */}
          <div className="arch-reveal relative w-full md:w-1/2" style={{ opacity: 0 }}>
            <div className="arch-parallax relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <Image
                src="/images/sections/architect-mode.png"
                alt="Architect reviewing material samples and spec sheets"
                fill
                className="object-cover scale-[1.15]"
                sizes="(min-width: 768px) 45vw, 90vw"
              />
            </div>
            <div
              className="arch-parallax absolute -bottom-8 -left-8 hidden overflow-hidden rounded-sm shadow-premium sm:block"
              style={{ width: '46%', aspectRatio: '4/3', border: '4px solid var(--color-charcoal)' }}
            >
              <Image
                src="/images/sections/enquiry-texture.png"
                alt="Detail of a CITIPLY spec sheet and material sample"
                fill
                className="object-cover scale-[1.15]"
                sizes="(min-width: 768px) 20vw, 40vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
