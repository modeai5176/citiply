'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function BrandPhilosophy() {
  const sectionRef = useRef<HTMLElement>(null);
  const ruleRef = useRef<HTMLHRElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const rule = ruleRef.current;
    const text = textRef.current;
    if (!section || !rule || !text) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const words = text.querySelectorAll('.reveal-word');

    if (prefersReducedMotion) {
      gsap.fromTo(rule, { opacity: 0 }, {
        opacity: 1,
        duration: 0.6,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.fromTo(words, { opacity: 0.2 }, {
        opacity: 1,
        duration: 0.6,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      });
    } else {
      gsap.fromTo(rule, { scaleX: 0 }, {
        scaleX: 1,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.to(words, {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: text,
          start: 'top 85%',
          end: 'bottom 50%',
          scrub: true,
        },
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
      id="brand-philosophy"
      className="section-padding"
      style={{ background: 'var(--color-ivory)' }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
        <hr
          ref={ruleRef}
          className="gold-rule mb-12 md:mb-16"
          style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
        />
        <div ref={textRef} className="font-serif" style={{ color: 'var(--color-charcoal)' }}>
          <p className="text-h2" style={{ marginBottom: '1.5rem' }}>
            {"We believe materials carry memory.".split(' ').map((word, i) => (
              <span key={i} className="reveal-word inline-block mr-[0.25em]" style={{ opacity: 0.2 }}>{word}</span>
            ))}
          </p>
          <p className="text-h2" style={{ marginBottom: '1.5rem' }}>
            {"A walnut panel recalls the forest. A door frame sets the threshold between public and private.".split(' ').map((word, i) => (
              <span key={`w-${i}`} className="reveal-word inline-block mr-[0.25em]" style={{ opacity: 0.2 }}>{word}</span>
            ))}
          </p>
          <p className="text-h2">
            {"Every surface is an opportunity to shape how a space feels — not just how it looks.".split(' ').map((word, i) => (
              <span key={`l-${i}`} className="reveal-word inline-block mr-[0.25em]" style={{ opacity: 0.2 }}>{word}</span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
