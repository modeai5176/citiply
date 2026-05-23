"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

type CategoryResult = { id: string; name: string; slug: string; image_url?: string | null; description?: string | null };
type CollectionResult = { id: string; name: string; slug: string; banner_url?: string | null; tagline?: string | null; categories?: { name?: string | null } | null };
type ProductResult = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  finish?: string | null;
  color_tone?: string | null;
  product_images?: Array<{ thumbnail_url?: string | null; kind?: string | null }>;
  collections?: { name?: string | null; slug?: string | null } | null;
  categories?: { name?: string | null; slug?: string | null } | null;
};
type SearchResults = { categories: CategoryResult[]; collections: CollectionResult[]; products: ProductResult[] };

export function GlobalSearch({ autoFocus = false, defaultQuery = "" }: { autoFocus?: boolean; defaultQuery?: string }) {
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`, { cache: "no-store" });
        const data = (await response.json()) as { results?: SearchResults };
        setResults(data.results ?? { categories: [], collections: [], products: [] });
        setOpen(true);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const flatItems = useMemo(() => [
    ...(results?.products ?? []).map((item) => ({ id: item.id, href: `/products/${item.sku}` })),
    ...(results?.collections ?? []).map((item) => ({ id: item.id, href: `/collections/${item.slug}` })),
    ...(results?.categories ?? []).map((item) => ({ id: item.id, href: `/categories/${item.slug}` }))
  ], [results]);
  const total = (results?.products.length ?? 0) + (results?.collections.length ?? 0) + (results?.categories.length ?? 0);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && event.key !== "Escape") return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      router.push(flatItems[activeIndex].href);
      setOpen(false);
    }
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function clearSearch() {
    setQuery("");
    setResults(null);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.length >= 2 && results && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search product name, SKU, finish, collection..."
          className="h-14 w-full rounded-full border border-border bg-white pl-12 pr-12 text-base text-text-primary shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {query ? (
          <button className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted transition hover:text-text-primary" onClick={clearSearch} aria-label="Clear search">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && results ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[520px] overflow-y-auto rounded-xl border border-border bg-white shadow-2xl">
          {loading ? (
            <div className="grid gap-3 p-4">
              {[1, 2, 3].map((item) => <div className="h-14 animate-pulse rounded-lg bg-surface" key={item} />)}
            </div>
          ) : total === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-text-secondary">No results for <span className="font-medium text-text-primary">"{query}"</span></p>
              <Link className="mt-3 inline-flex text-sm font-medium text-accent" href="/categories">Browse categories</Link>
            </div>
          ) : (
            <>
              <ResultSection title="Products">
                {results.products.slice(0, 8).map((product) => {
                  const thumb = product.product_images?.find((image) => image.kind === "main")?.thumbnail_url ?? product.product_images?.[0]?.thumbnail_url;
                  const flatIndex = flatItems.findIndex((item) => item.id === product.id);
                  return (
                    <ResultLink href={`/products/${product.sku}`} active={activeIndex === flatIndex} onClick={() => setOpen(false)} key={product.id}>
                      <Thumb src={thumb} alt={product.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-text-primary">{product.name}</span>
                          <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-text-muted">{product.sku}</span>
                        </div>
                        <p className="truncate text-xs text-text-muted">{[product.categories?.name, product.collections?.name, product.finish].filter(Boolean).join(" -> ")}</p>
                      </div>
                    </ResultLink>
                  );
                })}
              </ResultSection>
              <ResultSection title="Collections">
                {results.collections.map((collection) => {
                  const flatIndex = flatItems.findIndex((item) => item.id === collection.id);
                  return (
                    <ResultLink href={`/collections/${collection.slug}`} active={activeIndex === flatIndex} onClick={() => setOpen(false)} key={collection.id}>
                      <Thumb src={collection.banner_url} alt={collection.name} />
                      <div><p className="text-sm font-medium text-text-primary">{collection.name}</p><p className="text-xs text-text-muted">{collection.categories?.name ?? "Collection"}</p></div>
                    </ResultLink>
                  );
                })}
              </ResultSection>
              <ResultSection title="Categories">
                {results.categories.map((category) => {
                  const flatIndex = flatItems.findIndex((item) => item.id === category.id);
                  return (
                    <ResultLink href={`/categories/${category.slug}`} active={activeIndex === flatIndex} onClick={() => setOpen(false)} key={category.id}>
                      <Thumb src={category.image_url} alt={category.name} />
                      <div><p className="text-sm font-medium text-text-primary">{category.name}</p><p className="text-xs text-text-muted">Browse category</p></div>
                    </ResultLink>
                  );
                })}
              </ResultSection>
              <div className="border-t border-border px-4 py-3">
                <Link className="text-sm font-medium text-accent hover:underline" href={`/search?q=${encodeURIComponent(query)}`} onClick={() => setOpen(false)}>
                  See all results for "{query}"
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return <div className="border-b border-border last:border-b-0"><p className="px-4 pt-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{title}</p>{children}</div>;
}

function ResultLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <Link href={href} onClick={onClick} className={`flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface ${active ? "bg-surface" : ""}`}>{children}</Link>;
}

function Thumb({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
      {src ? <Image src={src} alt={alt} fill sizes="44px" className="object-cover" /> : null}
    </div>
  );
}
