'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Image from 'next/image';

export const VENEER_PANEL_IMAGES = [
  '/loader/veneer-01-ash.png',
  '/loader/veneer-02-honey-oak.png',
  '/loader/veneer-03-taupe.png',
  '/loader/veneer-04-walnut.png',
  '/loader/veneer-05-cinnamon.png',
  '/loader/veneer-06-espresso.png',
];

function compactElements<T extends Element>(elements: Array<T | null>) {
  return elements.filter((element): element is T => element !== null);
}

export function PageLoader({ onDone }: { onDone?: () => void }) {
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const countRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const onDoneRef = useRef(onDone);
  const [isVisible, setIsVisible] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const logo = logoRef.current;
    const heading = headingRef.current;
    const label = labelRef.current;
    const countElement = countRef.current;
    const line = lineRef.current;
    const dot = dotRef.current;

    if (!logo || !heading || !label || !countElement || !line || !dot) return;

    document.body.style.overflow = 'hidden';

    compactElements(imageRefs.current).forEach((img) => {
      gsap.fromTo(
        img,
        { scale: 1.04 },
        { scale: 1.0, duration: 3.9, ease: 'power1.inOut' }
      );
    });

    gsap.fromTo(
      logo,
      { opacity: 0, y: 28, scale: 0.96, filter: 'blur(12px)' },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.1,
        ease: 'power4.out',
        delay: 0.15,
      },
    );

    gsap.fromTo(
      heading,
      { opacity: 0, y: 36, letterSpacing: '0.18em', filter: 'blur(10px)' },
      {
        opacity: 1,
        y: 0,
        letterSpacing: '0.08em',
        filter: 'blur(0px)',
        duration: 1.25,
        ease: 'expo.out',
        delay: 0.28,
      },
    );

    gsap.to(logo, {
      y: -6,
      duration: 2.2,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
      delay: 1.2,
    });

    const duration = 2600;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setCount(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    gsap.to(line, {
      scaleX: 1,
      duration: 2.6,
      ease: 'power2.inOut',
    });

    gsap.to(dot, {
      opacity: 0.15,
      repeat: -1,
      yoyo: true,
      duration: 0.6,
      ease: 'power1.inOut',
    });

    const timeline = gsap.timeline({
      delay: 3.1,
      onComplete: () => {
        document.body.style.overflow = '';
        setIsVisible(false);
        onDoneRef.current?.();
      },
    });

    timeline.to([heading, label, countElement], {
      opacity: 0,
      y: -24,
      scale: 0.98,
      filter: 'blur(8px)',
      duration: 0.55,
      ease: 'power3.in',
      stagger: 0.05,
    });

    compactElements(panelRefs.current).forEach((panel, index) => {
      timeline.to(
        panel,
        { y: '-100%', duration: 0.8, ease: 'power4.inOut' },
        0.2 + index * 0.056,
      );
    });

    return () => {
      cancelAnimationFrame(raf);
      timeline.kill();
      document.body.style.overflow = '';
      gsap.killTweensOf([logo, heading, label, dot, line]);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div className="absolute inset-0 flex">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            ref={(el) => {
              panelRefs.current[index] = el;
            }}
            className="flex-1 relative overflow-hidden"
          >
            <div
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              className="absolute inset-0"
            >
              <Image
                src={VENEER_PANEL_IMAGES[index]}
                alt=""
                fill
                priority
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        ref={logoRef}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6 text-center pointer-events-none sm:gap-6"
        style={{
          opacity: 0,
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 65%)'
        }}
      >
        <h1
          ref={headingRef}
          className="select-none uppercase"
          style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            maxWidth: 'calc(100vw - 3rem)',
            fontSize: 'clamp(2.4rem, 12vw, 10.5rem)',
            fontWeight: 700,
            lineHeight: 0.95,
            color: 'rgba(255,250,244,0.94)',
            textShadow: '0 12px 40px rgba(0,0,0,0.6)',
            textWrap: 'balance',
          }}
        >
          CITIPLY
        </h1>

        <div ref={labelRef} className="flex items-center gap-2">
          <span
            ref={dotRef}
            className="block w-2 h-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,250,244,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-general-sans), system-ui, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(0.72rem, 1.6vw, 0.9rem)',
              color: 'rgba(255,250,244,0.7)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            Premium Architectural Veneers
          </span>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }}
      >
        <div
          ref={lineRef}
          className="h-full origin-left"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', transform: 'scaleX(0)' }}
        />
      </div>

      <div
        ref={countRef}
        className="absolute bottom-9 right-4 z-10 pointer-events-none select-none tabular-nums sm:bottom-6 sm:right-6"
        style={{
          fontFamily: 'var(--font-general-sans), system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(3.4rem, 18vw, 8rem)',
          letterSpacing: '0',
          lineHeight: 1,
          color: 'rgba(255,250,244,0.9)',
          textShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {count}%
      </div>

      <div
        className="absolute bottom-8 left-4 z-10 pointer-events-none sm:bottom-7 sm:left-6"
        style={{
          fontFamily: 'var(--font-general-sans), system-ui, sans-serif',
          fontSize: '0.5rem',
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: 'rgba(255,250,244,0.5)',
          fontWeight: 500,
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}
      >
        2026
      </div>
    </div>
  );
}
