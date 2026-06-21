'use client';

import { usePathname } from 'next/navigation';

/**
 * Provides top spacing to offset the fixed header.
 * On the homepage, the hero section extends behind the header,
 * so no spacer is needed. On all other pages, the spacer prevents
 * content from being hidden behind the fixed header.
 */
export function HeaderSpacer() {
  const pathname = usePathname();

  // Homepage hero extends behind the fixed header — no spacer needed
  if (pathname === '/') return null;

  // Utility bar (~36px) + main nav (~80px) ≈ 116px
  return <div style={{ height: '116px' }} />;
}
