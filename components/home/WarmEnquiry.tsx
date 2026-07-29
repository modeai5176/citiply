'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle2 } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';
import { usePaletteStore, formatPaletteSelection } from '@/lib/palette-store';

gsap.registerPlugin(ScrollTrigger);

const SPACE_TYPES = ['Residential', 'Commercial', 'Hospitality', 'Retail'];
const MOOD_OPTIONS = ['Warm & Natural', 'Dark & Dramatic', 'Light & Minimal', 'Bold & Textured'];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s()-]{8,20}$/;

export function WarmEnquiry() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { selection: palette, clear: clearPalette } = usePaletteStore();
  const [spaceType, setSpaceType] = useState('');
  const [mood, setMood] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const paletteSummary = formatPaletteSelection(palette);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!phonePattern.test(phone)) {
      setToast({ message: 'Enter a valid phone number.', type: 'error' });
      return;
    }
    if (!emailPattern.test(email)) {
      setToast({ message: 'Enter a valid email address.', type: 'error' });
      return;
    }

    setSubmitting(true);
    const body = new FormData();
    body.append('projectType', spaceType);
    body.append('finishMood', mood);
    body.append('requiredMaterials', paletteSummary);
    body.append('phone', phone);
    body.append('email', email);

    try {
      const response = await fetch('/api/lead', { method: 'POST', body });
      if (!response.ok) {
        setToast({ message: 'Could not send your enquiry. Please try again.', type: 'error' });
        return;
      }
      setSubmitted(true);
      setToast({ message: 'Enquiry received — we’ll be in touch soon.', type: 'success' });
      setSpaceType('');
      setMood('');
      setPhone('');
      setEmail('');
      clearPalette();
    } catch {
      setToast({ message: 'Could not send your enquiry. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      ref={sectionRef}
      id="enquiry"
      className="relative overflow-hidden section-padding scroll-mt-24"
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
          style={{ background: 'linear-gradient(to bottom, rgb(var(--color-ivory-rgb) / 0.1) 0%, rgb(var(--color-ivory-rgb) / 0.85) 100%)', pointerEvents: 'none' }}
        /> */}
      </div>

      {/* Form */}
      <div className="relative z-10" style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1.5rem' }}>
        {submitted ? (
          <div className="enquiry-reveal text-center py-12">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14" style={{ color: 'var(--color-gold)' }} />
            <h2 className="text-h3 font-serif" style={{ color: 'var(--color-charcoal)' }}>Enquiry received.</h2>
            <p className="mt-3 font-sans" style={{ color: 'var(--color-stone)' }}>
              We'll be in touch shortly with a curated selection.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="cta-underline mt-8 inline-flex items-center gap-2"
              style={{ color: 'var(--color-charcoal)' }}
            >
              Send another enquiry
            </button>
          </div>
        ) : (
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

          {paletteSummary ? (
            <div className="enquiry-reveal mb-8 rounded-sm p-4" style={{ opacity: 0, background: 'rgb(var(--color-stone-rgb) / 0.08)', border: '1px solid var(--color-sand)' }}>
              <p className="text-eyebrow mb-1.5" style={{ color: 'var(--color-deep-brown)' }}>Your palette</p>
              <p className="text-sm font-sans" style={{ color: 'var(--color-charcoal)' }}>{paletteSummary}</p>
            </div>
          ) : null}

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
          <div className="enquiry-reveal mb-10 grid gap-6 sm:grid-cols-2" style={{ opacity: 0 }}>
            <div>
              <label
                htmlFor="enquiry-phone"
                className="text-eyebrow block mb-3"
                style={{ color: 'var(--color-deep-brown)' }}
              >
                Phone*
              </label>
              <input
                id="enquiry-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
                className={contactInputClass}
                style={contactInputStyle}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-gold)'; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-sand)'; }}
              />
            </div>
            <div>
              <label
                htmlFor="enquiry-email"
                className="text-eyebrow block mb-3"
                style={{ color: 'var(--color-deep-brown)' }}
              >
                Email*
              </label>
              <input
                id="enquiry-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={contactInputClass}
                style={contactInputStyle}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-gold)'; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-sand)'; }}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="enquiry-reveal text-center" style={{ opacity: 0 }}>
            <button
              type="submit"
              disabled={submitting}
              className="cta-underline inline-flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--color-charcoal)', fontSize: 'var(--text-eyebrow)', letterSpacing: '0.18em' }}
            >
              {submitting ? 'Sending…' : 'Send enquiry'} <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
        )}
      </div>

      {toast ? <Toast message={toast.message} type={toast.type} /> : null}
    </section>
  );
}

const contactInputClass = 'w-full py-3 px-0 text-base font-sans bg-transparent outline-none transition-colors duration-300';
const contactInputStyle = {
  color: 'var(--color-charcoal)',
  borderBottom: '1px solid var(--color-sand)',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  borderRadius: 0,
} as const;
