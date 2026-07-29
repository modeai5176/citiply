'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePaletteStore, type PaletteStep } from '@/lib/palette-store';

gsap.registerPlugin(ScrollTrigger);

type Swatch = { value: string; image: string };

type Step = {
  key: PaletteStep;
  label: string;
  swatches: Swatch[];
};

// Swatch imagery reuses existing site assets (veneer grain crops, category
// thumbnails, mood-collection art and the loader's named veneer swatches) —
// a lightweight v1 with no rendering engine, per the module spec.
const STEPS: Step[] = [
  {
    key: 'veneer',
    label: 'Veneer tone',
    swatches: [
      { value: 'Natural Oak', image: '/images/veneer-art/grain-oak.png' },
      { value: 'Rich Walnut', image: '/images/veneer-art/grain-walnut.png' },
      { value: 'Warm Teak', image: '/images/veneer-art/grain-teak.png' },
      { value: 'Deep Ebony', image: '/images/veneer-art/grain-ebony.png' },
    ],
  },
  {
    key: 'panel',
    label: 'Panel / door finish',
    swatches: [
      { value: 'Matte Natural', image: '/images/categories/natural-veneers.png' },
      { value: 'Rough Textured', image: '/images/categories/textured-veneers.png' },
      { value: 'Fluted Linear', image: '/images/categories/fluted-veneers.png' },
      { value: 'Smoked Finish', image: '/images/categories/specialty-series.png' },
    ],
  },
  {
    key: 'flooring',
    label: 'Flooring',
    swatches: [
      { value: 'Honey Oak Plank', image: '/images/collections/warm-naturals.png' },
      { value: 'Cool Ash Plank', image: '/images/collections/modern-neutrals.png' },
      { value: 'Smoked Walnut Plank', image: '/images/collections/dark-elegance.png' },
      { value: 'Wide Plank Teak', image: '/images/collections/statement-grains.png' },
    ],
  },
  {
    key: 'accent',
    label: 'Accent',
    swatches: [
      { value: 'Ash', image: '/loader/veneer-01-ash.webp' },
      { value: 'Taupe', image: '/loader/veneer-03-taupe.webp' },
      { value: 'Cinnamon', image: '/loader/veneer-05-cinnamon.webp' },
      { value: 'Espresso', image: '/loader/veneer-06-espresso.webp' },
    ],
  },
];

export function BuildPalette() {
  const sectionRef = useRef<HTMLElement>(null);
  const { selection, setStep } = usePaletteStore();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = section.querySelectorAll('.reveal-text');

    gsap.fromTo(
      items,
      { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.5 : 0.9,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 78%' },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  const hasSelection = Object.values(selection).some(Boolean);

  function scrollToEnquiry() {
    document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section
      ref={sectionRef}
      className="section-padding"
      style={{ background: 'var(--surface)' }}
    >
      <div className="content-container">
        <span className="reveal-text text-eyebrow block mb-3" style={{ color: 'var(--color-stone)', opacity: 0 }}>
          Build Your Palette
        </span>
        <h2 className="reveal-text text-h2 font-serif mb-4" style={{ color: 'var(--color-charcoal)', opacity: 0 }}>
          Design your space, one surface at a time.
        </h2>
        <p
          className="reveal-text max-w-2xl font-sans mb-10"
          style={{ color: 'var(--color-charcoal)', opacity: 0, fontSize: 'var(--text-body)', lineHeight: 1.7 }}
        >
          Pick a veneer tone, a panel or door finish, a flooring plank and an accent — see them sit together,
          then send the palette straight to our team.
        </p>

        <div className="reveal-text flex flex-col gap-10 lg:flex-row lg:gap-8" style={{ opacity: 0 }}>
          {/* Picker */}
          <div className="flex-1 space-y-8">
            {STEPS.map((step) => (
              <div key={step.key}>
                <p className="text-eyebrow mb-3" style={{ color: 'var(--color-stone)' }}>{step.label}</p>
                <div className="flex flex-wrap gap-3">
                  {step.swatches.map((swatch) => {
                    const isSelected = selection[step.key] === swatch.value;
                    return (
                      <button
                        key={swatch.value}
                        type="button"
                        onClick={() => setStep(step.key, swatch.value)}
                        className="group flex flex-col items-center gap-2"
                        aria-pressed={isSelected}
                      >
                        <span
                          className="relative block h-16 w-16 overflow-hidden rounded-full transition sm:h-20 sm:w-20"
                          style={{
                            outline: isSelected ? `2px solid var(--color-gold)` : '2px solid transparent',
                            outlineOffset: '3px',
                          }}
                        >
                          <Image src={swatch.image} alt={swatch.value} fill className="object-cover" sizes="80px" />
                        </span>
                        <span
                          className="text-xs font-sans transition-colors"
                          style={{ color: isSelected ? 'var(--color-gold)' : 'var(--color-charcoal)', opacity: isSelected ? 1 : 0.7 }}
                        >
                          {swatch.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Live preview board — static composite, no rendering engine */}
          <div className="w-full shrink-0 lg:w-[440px]">
            <div className="lg:sticky lg:top-28">
              <p className="text-eyebrow mb-3" style={{ color: 'var(--color-stone)' }}>Your palette</p>
              <div
                className="grid grid-cols-2 gap-3 rounded-sm p-4"
                style={{ background: 'var(--color-beige)', border: '1px solid rgb(var(--color-stone-rgb) / 0.2)' }}
              >
                {STEPS.map((step) => {
                  const chosen = step.swatches.find((s) => s.value === selection[step.key]);
                  return (
                    <div key={step.key} className="relative aspect-square overflow-hidden rounded-sm" style={{ background: 'var(--color-ivory)' }}>
                      {chosen ? (
                        <>
                          <Image src={chosen.image} alt={chosen.value} fill className="object-cover" sizes="210px" />
                          <div
                            className="absolute inset-x-0 bottom-0 px-3 py-2"
                            style={{ background: 'linear-gradient(to top, rgb(var(--scrim) / 0.75), transparent)' }}
                          >
                            <p className="text-[11px] font-sans" style={{ color: 'rgb(var(--on-image) / 0.7)' }}>{step.label}</p>
                            <p className="text-sm font-sans" style={{ color: 'rgb(var(--on-image))' }}>{chosen.value}</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-center text-xs font-sans px-2" style={{ color: 'var(--color-stone)' }}>{step.label}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={scrollToEnquiry}
                disabled={!hasSelection}
                className="cta-underline mt-6 inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ color: 'var(--color-gold)' }}
              >
                Send enquiry <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
