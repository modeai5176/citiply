"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { UtilityBar } from "@/components/layout/UtilityBar";
import { useQuoteModal } from "@/components/catalogue/QuoteModal";
import type { Catalogue, Category, Collection } from "@/lib/types";
import { GlobalSearch } from "@/components/search/GlobalSearch";

export function Header({ catalogues, categories, collections }: { catalogues: Catalogue[]; categories: Category[]; collections: Collection[] }) {
  const { openQuote } = useQuoteModal();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  /* ── Transparent → solid transition based on scroll past hero ── */
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 60);
    }
    handleScroll(); // check initial state
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

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
      style={{
        background: isTransparent ? 'transparent' : 'rgba(247,243,236,0.97)',
        backdropFilter: isTransparent ? 'none' : 'blur(12px)',
        WebkitBackdropFilter: isTransparent ? 'none' : 'blur(12px)',
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
          borderBottom: isTransparent ? '1px solid rgba(247,243,236,0.12)' : '1px solid var(--color-beige)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-xl font-semibold tracking-[0.14em] sm:text-2xl sm:tracking-[0.18em] transition-colors duration-500"
            style={{ color: isTransparent ? 'var(--color-ivory)' : 'var(--color-charcoal)' }}
          >
            CITIPLY
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {[
              { label: "Catalogues", href: "/catalogues" },
              { label: "Categories", href: "/categories" },
              { label: "Downloads", href: "/downloads" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((item) => (
              <Link
                key={item.href}
                className="px-3 py-7 text-sm font-medium transition-colors duration-500"
                href={item.href}
                style={{
                  color: isTransparent ? 'rgba(247,243,236,0.85)' : 'var(--color-charcoal)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isTransparent
                    ? 'rgba(247,243,236,0.85)'
                    : 'var(--color-charcoal)';
                }}
              >
                {item.label}
              </Link>
            ))}
            {/* MegaMenu trigger — Collections link style handled internally */}
            <MegaMenu categories={categories} collections={collections} isTransparent={isTransparent} />
          </nav>

          {/* Search (desktop) */}
          <div className="hidden w-72 xl:block transition-all duration-500">
            <GlobalSearch isTransparent={isTransparent} />
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              className="hidden sm:inline-flex transition-all duration-500"
              style={isTransparent ? {
                backgroundColor: 'rgba(183, 150, 87, 0.25)', // glassy gold
                border: '1px solid rgba(183, 150, 87, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: 'rgba(247,243,236,0.95)',
              } : undefined}
              onClick={() => openQuote()}
            >
              Request Quote
            </Button>
            <button
              className="cursor-pointer rounded-full p-2 transition-all duration-300 lg:hidden"
              style={{
                border: `1px solid ${isTransparent ? 'rgba(247,243,236,0.25)' : 'var(--color-beige)'}`,
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
                border: `1px solid ${isTransparent ? 'rgba(247,243,236,0.25)' : 'var(--color-beige)'}`,
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
          <nav id="mobile-header-nav" className="max-h-[calc(100vh-104px)] overflow-y-auto border-t border-border bg-white px-4 py-4 shadow-lg sm:max-h-[calc(100vh-120px)] sm:px-6 lg:hidden" aria-label="Mobile navigation">
            <div className="grid gap-1">
              <Link className="rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface hover:text-accent" href="/catalogues" onClick={closeMobilePanels}>
                Catalogues
              </Link>
              {catalogues.length > 0 ? (
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Catalogues</p>
                  <div className="grid gap-1">
                    {catalogues.map((catalogue) => (
                      <Link
                        className="rounded-md px-2 py-2 text-sm text-text-secondary hover:bg-surface hover:text-accent"
                        href={`/catalogues/${catalogue.slug}`}
                        key={catalogue.id}
                        onClick={closeMobilePanels}
                      >
                        {catalogue.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <Link className="rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface hover:text-accent" href="/categories" onClick={closeMobilePanels}>
                Categories
              </Link>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Collections</p>
                <div className="grid gap-1">
                  {collections.slice(0, 6).map((collection) => (
                    <Link
                      className="rounded-md px-2 py-2 text-sm text-text-secondary hover:bg-surface hover:text-accent"
                      href={`/collections/${collection.slug}`}
                      key={collection.id}
                      onClick={closeMobilePanels}
                    >
                      {collection.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Product Families</p>
                <div className="grid gap-1">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      className="rounded-md px-2 py-2 text-sm text-text-secondary hover:bg-surface hover:text-accent"
                      href={`/categories/${category.slug}`}
                      key={category.id}
                      onClick={closeMobilePanels}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
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
