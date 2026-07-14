'use client';

import { createContext, useContext, useMemo } from 'react';
// Preloader disabled — see below. Kept the import commented so it's easy to restore.
// import { useCallback, useState } from 'react';
// import { PageLoader } from '@/components/PageLoader';

const PageLoadContext = createContext(true);

export function usePageLoaded() {
  return useContext(PageLoadContext);
}

export function PageLoadProvider({ children }: { children: React.ReactNode }) {
  // ── Preloader disabled ──
  // Start already "loaded" so the site renders immediately and the hero runs
  // its own entry animation on open. To restore the preloader, revert to the
  // stateful version below.
  const value = useMemo(() => true, []);

  return (
    <PageLoadContext.Provider value={value}>
      {/* <PageLoader onDone={handleLoadDone} /> */}
      {children}
    </PageLoadContext.Provider>
  );

  /* ── Original preloader-gated version (commented out) ──
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const value = useMemo(() => isPageLoaded, [isPageLoaded]);
  const handleLoadDone = useCallback(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <PageLoadContext.Provider value={value}>
      <PageLoader onDone={handleLoadDone} />
      {children}
    </PageLoadContext.Provider>
  );
  */
}
