'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SPACE_TYPES = ['Residential', 'Commercial', 'Hospitality', 'Retail'];
const MOOD_OPTIONS = ['Warm & Natural', 'Dark & Dramatic', 'Light & Minimal', 'Bold & Textured'];

export function WarmEnquiry() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [spaceType, setSpaceType] = useState('');
  const [mood, setMood] = useState('');
  const [contact, setContact] = useState('');

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    const form = formRef.current;
    if (!section || !bg || !form) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Entrance
    const items = form.querySelectorAll('.enquiry-reveal');
    gsap.fromTo(
      items,
      { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.6 : 1.0,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      }
    );

    // Ken Burns on background
    if (!prefersReducedMotion) {
      gsap.to(bg, {
        scale: 1.08,
        x: '2%',
        duration: 60,
        ease: 'none',
        repeat: -1,
        yoyo: true,
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
      gsap.killTweensOf(bg);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Future: wire to API
    alert(`Thank you for your enquiry. We'll be in touch soon.`);
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden section-padding"
    >
      {/* Background texture with ken-burns */}
      <div className="absolute inset-0 overflow-hidden bg-[var(--color-ivory)]">
        <div ref={bgRef} className="absolute inset-0" style={{ willChange: 'transform', opacity: 0.25, mixBlendMode: 'multiply' }}>
          <Image
            src="/images/sections/enquiry-texture.png"
            alt=""
            fill
            className="object-cover"
            style={{ filter: 'brightness(1)' }}
            sizes="100vw"
          />
        </div>
        {/* Soft gradient wash on top so the form remains highly readable */}
        {/* <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(247,243,236,0.1) 0%, rgba(247,243,236,0.85) 100%)', pointerEvents: 'none' }}
        /> */}
      </div>

      {/* Form */}
      <div className="relative z-10" style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1.5rem' }}>
        <form ref={formRef} onSubmit={handleSubmit}>
          <h2
            className="enquiry-reveal text-h2 font-serif text-center mb-3"
            style={{ color: 'var(--color-charcoal)', opacity: 0 }}
          >
            Tell us about your space.
          </h2>
          <p
            className="enquiry-reveal text-center font-sans mb-12"
            style={{ color: 'var(--color-stone)', opacity: 0 }}
          >
            We'll curate a selection to match your vision.
          </p>

          {/* Space Type */}
          <div className="enquiry-reveal mb-8" style={{ opacity: 0 }}>
            <label className="text-eyebrow block mb-3" style={{ color: 'var(--color-deep-brown)' }}>
              Space Type
            </label>
            <div className="flex flex-wrap gap-2">
              {SPACE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSpaceType(type)}
                  className="py-2.5 px-5 text-sm font-sans transition-all duration-300"
                  style={{
                    background: spaceType === type ? 'var(--color-charcoal)' : 'transparent',
                    color: spaceType === type ? 'var(--color-ivory)' : 'var(--color-charcoal)',
                    border: `1px solid ${spaceType === type ? 'var(--color-charcoal)' : 'var(--color-sand)'}`,
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="enquiry-reveal mb-8" style={{ opacity: 0 }}>
            <label className="text-eyebrow block mb-3" style={{ color: 'var(--color-deep-brown)' }}>
              Mood / Direction
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMood(option)}
                  className="py-2.5 px-5 text-sm font-sans transition-all duration-300"
                  style={{
                    background: mood === option ? 'var(--color-charcoal)' : 'transparent',
                    color: mood === option ? 'var(--color-ivory)' : 'var(--color-charcoal)',
                    border: `1px solid ${mood === option ? 'var(--color-charcoal)' : 'var(--color-sand)'}`,
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="enquiry-reveal mb-10" style={{ opacity: 0 }}>
            <label
              htmlFor="enquiry-contact"
              className="text-eyebrow block mb-3"
              style={{ color: 'var(--color-deep-brown)' }}
            >
              Email or Phone
            </label>
            <input
              id="enquiry-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="your@email.com or +91..."
              className="w-full py-3 px-0 text-base font-sans bg-transparent outline-none transition-colors duration-300"
              style={{
                color: 'var(--color-charcoal)',
                borderBottom: '1px solid var(--color-sand)',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: 0,
              }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-sand)'; }}
            />
          </div>

          {/* Submit */}
          <div className="enquiry-reveal text-center" style={{ opacity: 0 }}>
            <button
              type="submit"
              className="cta-underline inline-flex items-center gap-3"
              style={{ color: 'var(--color-charcoal)', fontSize: 'var(--text-eyebrow)', letterSpacing: '0.18em' }}
            >
              Send enquiry <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
