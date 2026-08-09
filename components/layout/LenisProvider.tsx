'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    // Admin is a functional dashboard, not the marketing scroll experience —
    // Lenis intercepts wheel/touch events on the whole document, which fights
    // with modal/table internal scrolling (scrolling a form inside a modal
    // would scroll the page behind it instead). Skip it there entirely.
    if (isAdmin) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isAdmin]);

  // Next.js resets `window.scrollTo(0, 0)` on route change, but Lenis keeps
  // animating toward its own internally tracked target scroll position from
  // the previous page — so a moment later it snaps the view back down to
  // wherever the last page was scrolled to. Force both the real scroll
  // position and Lenis's internal target back to the top on every navigation.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}
