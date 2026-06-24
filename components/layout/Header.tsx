"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FamilyNavItem } from "@/components/layout/MegaMenu";
import { UtilityBar } from "@/components/layout/UtilityBar";
import { useQuoteModal } from "@/components/catalogue/QuoteModal";
import type { ProductFamily } from "@/lib/types";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

export function Header({ families }: { families: ProductFamily[] }) {
  const { openQuote } = useQuoteModal();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [openFamilyId, setOpenFamilyId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  /* ── Transparent → solid transition + hide-on-scroll-down / show-on-scroll-up ── */
  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 60);

      // Hide when scrolling down past the header height; show when scrolling up.
      // Always reveal near the very top so the hero header stays visible.
      const goingDown = currentY > lastScrollY.current;
      if (currentY < 80) {
        setIsHidden(false);
      } else if (Math.abs(currentY - lastScrollY.current) > 6) {
        setIsHidden(goingDown);
      }
      lastScrollY.current = currentY;
    }
    handleScroll(); // check initial state
    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function closeMobilePanels() {
    setMobileNavOpen(false);
    setMobileSearchOpen(false);
  }

  /* When over hero (not scrolled): transparent bg, ivory text, no borders, hide utility bar.
     When scrolled: solid background, normal text, borders visible. */
  const isTransparent = !isScrolled && !mobileNavOpen && !mobileSearchOpen;

  // Keep the header visible whenever a mobile panel is open, even mid-scroll.
  const hidden = isHidden && !mobileNavOpen && !mobileSearchOpen;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
      style={{
        background: isTransparent ? 'transparent' : 'rgb(var(--color-ivory-rgb) / 0.97)',
        backdropFilter: isTransparent ? 'none' : 'blur(12px)',
        WebkitBackdropFilter: isTransparent ? 'none' : 'blur(12px)',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      {/* Utility bar — hidden when transparent */}
      <div
        className="transition-all duration-500 overflow-hidden"
        style={{
          maxHeight: isTransparent ? '0px' : '40px',
          opacity: isTransparent ? 0 : 1,
        }}
      >
        <UtilityBar />
      </div>

      <div
        className="transition-colors duration-500"
        style={{
          borderBottom: isTransparent ? '1px solid rgb(var(--on-image) / 0.12)' : '1px solid var(--color-beige)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-3 sm:h-20 sm:px-4 lg:px-5">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-xl font-semibold tracking-[0.14em] sm:text-2xl sm:tracking-[0.18em] transition-colors duration-500"
            style={{ color: isTransparent ? 'var(--color-ivory)' : 'var(--color-charcoal)' }}
          >
            CITIPLY
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1.5 xl:gap-2 lg:flex">
            {/* Primary navigation by product family — each opens its category filters */}
            {families.map((family) => (
              <FamilyNavItem family={family} isTransparent={isTransparent} key={family.id} />
            ))}
            {[
              { label: "Projects", href: "/projects" },
              { label: "Downloads", href: "/downloads" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((item) => (
              <Link
                key={item.href}
                className="whitespace-nowrap px-2 py-7 text-sm font-medium transition-colors duration-500"
                href={item.href}
                style={{
                  color: isTransparent ? 'rgb(var(--on-image) / 0.85)' : 'var(--color-charcoal)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isTransparent
                    ? 'rgb(var(--on-image) / 0.85)'
                    : 'var(--color-charcoal)';
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search (desktop) */}
          <div className="hidden w-44 2xl:w-52 xl:block transition-all duration-500">
            <GlobalSearch isTransparent={isTransparent} />
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeSwitcher isTransparent={isTransparent} />
            <Button
              className="hidden sm:inline-flex transition-all duration-500"
              style={isTransparent ? {
                backgroundColor: 'rgb(var(--color-gold-rgb) / 0.25)', // glassy gold
                border: '1px solid rgb(var(--color-gold-rgb) / 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: 'rgb(var(--on-image) / 0.95)',
              } : undefined}
              onClick={() => openQuote()}
            >
              Request Quote
            </Button>
            <button
              className="cursor-pointer rounded-full p-2 transition-all duration-300 lg:hidden"
              style={{
                border: `1px solid ${isTransparent ? 'rgb(var(--on-image) / 0.25)' : 'var(--color-beige)'}`,
                color: isTransparent ? 'var(--color-ivory)' : 'var(--color-charcoal)',
              }}
              aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              aria-expanded={mobileSearchOpen}
              aria-controls="mobile-header-search"
              onClick={() => {
                setMobileSearchOpen((open) => !open);
                setMobileNavOpen(false);
              }}
            >
              {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <button
              className="cursor-pointer rounded-full p-2 transition-all duration-300 lg:hidden"
              style={{
                border: `1px solid ${isTransparent ? 'rgb(var(--on-image) / 0.25)' : 'var(--color-beige)'}`,
                color: isTransparent ? 'var(--color-ivory)' : 'var(--color-charcoal)',
              }}
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-header-nav"
              onClick={() => {
                setMobileNavOpen((open) => !open);
                setMobileSearchOpen(false);
              }}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileSearchOpen ? (
          <div id="mobile-header-search" className="border-t border-border bg-background px-4 py-4 sm:px-6 lg:hidden">
            <GlobalSearch autoFocus />
          </div>
        ) : null}
        {mobileNavOpen ? (
          <nav id="mobile-header-nav" className="max-h-[calc(100vh-104px)] overflow-y-auto border-t border-border bg-ivory px-4 py-4 shadow-lg sm:max-h-[calc(100vh-120px)] sm:px-6 lg:hidden" aria-label="Mobile navigation">
            <div className="grid gap-1">
              {/* Product Families — each expands to its category filters */}
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Products</p>
              {families.map((family) => {
                const isOpen = openFamilyId === family.id;
                return (
                  <div key={family.id} className="rounded-lg">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface hover:text-accent"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFamilyId((current) => (current === family.id ? null : family.id))}
                    >
                      {family.name}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen ? (
                      <div className="grid gap-1 pb-2 pl-3">
                        <Link
                          className="rounded-md px-3 py-2 text-sm font-medium text-accent hover:bg-surface"
                          href={`/catalogues/${family.slug}`}
                          onClick={closeMobilePanels}
                        >
                          View all {family.name}
                        </Link>
                        {family.categories.map((category) => (
                          <Link
                            className="rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface hover:text-accent"
                            href={`/categories/${category.slug}`}
                            key={category.id}
                            onClick={closeMobilePanels}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <Link className="mt-1 rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface hover:text-accent" href="/projects" onClick={closeMobilePanels}>
                Projects
              </Link>
              <Link className="rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface hover:text-accent" href="/downloads" onClick={closeMobilePanels}>
                Downloads
              </Link>
              <Link className="rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface hover:text-accent" href="/about" onClick={closeMobilePanels}>
                About
              </Link>
              <Link className="rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface hover:text-accent" href="/contact" onClick={closeMobilePanels}>
                Contact
              </Link>
              <Button className="mt-2 w-full justify-center sm:hidden" onClick={() => {
                closeMobilePanels();
                openQuote();
              }}>
                Request Quote
              </Button>
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
