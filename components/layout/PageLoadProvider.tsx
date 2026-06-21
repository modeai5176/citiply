'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PageLoader } from '@/components/PageLoader';

const PageLoadContext = createContext(true);

export function usePageLoaded() {
  return useContext(PageLoadContext);
}

export function PageLoadProvider({ children }: { children: React.ReactNode }) {
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
}
