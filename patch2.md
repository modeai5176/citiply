# Phase 1 — Feature Patch: Advanced Search + Smart Enquiry System
### Two self-contained features. Both must be fully wired and working end to end.

> **Current state:** Public UI is working, all data is real from Supabase, Quick Inquiry form saves
> to DB and reflects in admin Quotes page. These are the two specific upgrades requested.
> **Do not change anything else.** Keep all existing pages, styles, and components intact.

---

## FEATURE 1 — Universal Search

### What it should do

A single search box on the landing page (and optionally in the sticky header) that searches
**everything** — category names, collection names, product names, product codes, short descriptions,
color tones, finish types, base materials, application tags, spec values — and returns grouped,
ranked, instantly-displayed results.

The user types one query. Results appear as they type (debounced 250ms). No page reload.
Results are grouped by type. Clicking a result navigates to the right page.

---

### 1.1 — Search API route

```
GET /api/search?q=walnut&limit=20
```

This is a **single Supabase full-text + ilike query** that searches across all relevant tables
in parallel and returns grouped results.

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = createClient();
  const term = `%${q}%`;

  // Run all searches in parallel
  const [categories, collections, products] = await Promise.all([

    // Search categories: name, description
    supabase
      .from('categories')
      .select('id, name, slug, image_url, description')
      .eq('is_active', true)
      .or(`name.ilike.${term},description.ilike.${term}`)
      .limit(3),

    // Search collections: name, tagline, description
    supabase
      .from('collections')
      .select('id, name, slug, banner_url, tagline, categories(name, slug)')
      .eq('is_active', true)
      .or(`name.ilike.${term},tagline.ilike.${term},description.ilike.${term}`)
      .limit(5),

    // Search products: sku, name, finish, base_material, color_tone, short_description
    // Also match application array items
    supabase
      .from('products')
      .select(`
        id, sku, name, slug, finish, base_material, color_tone, short_description,
        product_images(thumbnail_url, kind),
        collections(name, slug),
        categories(name, slug)
      `)
      .eq('is_active', true)
      .or(
        `sku.ilike.${term},name.ilike.${term},finish.ilike.${term},` +
        `base_material.ilike.${term},color_tone.ilike.${term},` +
        `short_description.ilike.${term}`
      )
      .limit(12),
  ]);

  // Also search product_specs for spec values (e.g. "0.6mm", "8ft x 4ft")
  const { data: specMatches } = await supabase
    .from('product_specs')
    .select('product_id, spec_name, spec_value')
    .or(`spec_name.ilike.${term},spec_value.ilike.${term}`)
    .limit(8);

  // Get full product data for spec matches that aren't already in product results
  const existingProductIds = new Set((products.data || []).map(p => p.id));
  const specProductIds = [...new Set(
    (specMatches || [])
      .map(s => s.product_id)
      .filter(id => !existingProductIds.has(id))
  )].slice(0, 4);

  let specProducts: any[] = [];
  if (specProductIds.length > 0) {
    const { data } = await supabase
      .from('products')
      .select(`
        id, sku, name, slug, finish, base_material, color_tone,
        product_images(thumbnail_url, kind),
        collections(name, slug),
        categories(name, slug)
      `)
      .eq('is_active', true)
      .in('id', specProductIds);
    specProducts = data || [];
  }

  const allProducts = [...(products.data || []), ...specProducts];

  // Rank products: exact SKU match first, then exact name, then partial
  const ranked = allProducts.sort((a, b) => {
    const aSkuExact = a.sku.toLowerCase() === q.toLowerCase() ? 0 : 1;
    const bSkuExact = b.sku.toLowerCase() === q.toLowerCase() ? 0 : 1;
    const aNameStarts = a.name.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
    const bNameStarts = b.name.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
    return (aSkuExact + aNameStarts) - (bSkuExact + bNameStarts);
  });

  return NextResponse.json({
    query: q,
    results: {
      categories: categories.data || [],
      collections: collections.data || [],
      products: ranked,
    },
    total: (categories.data?.length || 0) + (collections.data?.length || 0) + ranked.length,
  });
}
```

---

### 1.2 — Search UI component

Create `components/search/GlobalSearch.tsx`.

**Behaviour:**
- Input with 250ms debounce
- Shows dropdown panel below input while focused and query ≥ 2 chars
- Grouped sections: Products (most results), Collections, Categories
- Each result row: thumbnail (if available), name, breadcrumb (category → collection), SKU badge for products
- "See all X results for 'query'" link at bottom → `/search?q=query`
- Keyboard navigation: ↑ ↓ to move, Enter to navigate, Escape to close
- Click outside to close
- Loading skeleton while fetching (not a spinner)
- Empty state: "No results for 'query'" with a suggestion to browse categories

```typescript
// components/search/GlobalSearch.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchResult {
  categories: CategoryResult[];
  collections: CollectionResult[];
  products: ProductResult[];
}

export function GlobalSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced fetch
  useEffect(() => {
    if (query.length < 2) { setResults(null); setOpen(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
        const data = await res.json();
        setResults(data.results);
        setOpen(true);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build flat list for keyboard nav
  const flatItems = [
    ...(results?.products || []).map(p => ({ type: 'product' as const, data: p, href: `/products/${p.slug}` })),
    ...(results?.collections || []).map(c => ({ type: 'collection' as const, data: c, href: `/collections/${c.slug}` })),
    ...(results?.categories || []).map(c => ({ type: 'category' as const, data: c, href: `/categories/${c.slug}` })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatItems.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      router.push(flatItems[activeIndex].href);
      setOpen(false); setQuery('');
    }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const totalResults = (results?.products?.length || 0) + (results?.collections?.length || 0) + (results?.categories?.length || 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (query.length >= 2 && results) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search by product name, SKU, wood species, finish, collection..."
          className="w-full pl-12 pr-12 py-4 rounded-2xl border border-border bg-white text-text-primary placeholder:text-text-muted text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent shadow-sm transition-shadow"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-4 text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && <Loader2 className="absolute right-4 w-4 h-4 text-accent animate-spin" />}
      </div>

      {/* Dropdown */}
      {open && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-2xl overflow-hidden z-50 max-h-[520px] overflow-y-auto">

          {totalResults === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-muted text-sm">No results for <span className="font-medium text-text-primary">"{query}"</span></p>
              <p className="text-text-muted text-xs mt-1">Try searching by SKU code, wood species, or collection name</p>
            </div>
          ) : (
            <>
              {/* Products section */}
              {results.products.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">Products</span>
                  </div>
                  {results.products.slice(0, 8).map((product, i) => {
                    const thumb = product.product_images?.find((img: any) => img.kind === 'main')?.thumbnail_url
                      || product.product_images?.[0]?.thumbnail_url;
                    const flatIdx = flatItems.findIndex(f => f.type === 'product' && f.data.id === product.id);
                    const isActive = flatIdx === activeIndex;
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={() => { setOpen(false); setQuery(''); }}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface transition-colors ${isActive ? 'bg-surface' : ''}`}
                      >
                        {thumb ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                            <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary truncate">{product.name}</span>
                            <span className="font-mono text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded flex-shrink-0">{product.sku}</span>
                          </div>
                          <div className="text-xs text-text-muted truncate">
                            {product.categories?.name && <span>{product.categories.name}</span>}
                            {product.collections?.name && <span> → {product.collections.name}</span>}
                            {product.finish && <span> · {product.finish}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Collections section */}
              {results.collections.length > 0 && (
                <div className="border-t border-border">
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">Collections</span>
                  </div>
                  {results.collections.map((col, i) => {
                    const flatIdx = flatItems.findIndex(f => f.type === 'collection' && f.data.id === col.id);
                    const isActive = flatIdx === activeIndex;
                    return (
                      <Link
                        key={col.id}
                        href={`/collections/${col.slug}`}
                        onClick={() => { setOpen(false); setQuery(''); }}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface transition-colors ${isActive ? 'bg-surface' : ''}`}
                      >
                        {col.banner_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={col.banner_url} alt={col.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-text-primary">{col.name}</p>
                          <p className="text-xs text-text-muted">{col.categories?.name} · Collection</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Categories section */}
              {results.categories.length > 0 && (
                <div className="border-t border-border">
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">Categories</span>
                  </div>
                  {results.categories.map(cat => {
                    const flatIdx = flatItems.findIndex(f => f.type === 'category' && f.data.id === cat.id);
                    const isActive = flatIdx === activeIndex;
                    return (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        onClick={() => { setOpen(false); setQuery(''); }}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface transition-colors ${isActive ? 'bg-surface' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                          {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{cat.name}</p>
                          <p className="text-xs text-text-muted">Browse all products in this category</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              {totalResults >= 8 && (
                <div className="border-t border-border px-4 py-3">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={() => { setOpen(false); setQuery(''); }}
                    className="text-sm text-accent hover:underline font-medium"
                  >
                    See all results for "{query}" →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 1.3 — Full search results page

Route: `/search?q=query`

```typescript
// app/(public)/search/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/catalogue/ProductCard';
import { CollectionCard } from '@/components/catalogue/CollectionCard';
import { GlobalSearch } from '@/components/search/GlobalSearch';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() || '';
  const supabase = createClient();

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <h1 className="text-3xl font-semibold mb-6">Search</h1>
        <GlobalSearch autoFocus />
      </div>
    );
  }

  const term = `%${q}%`;

  const [{ data: products }, { data: collections }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id, sku, name, slug, finish, base_material, color_tone,
        product_images(thumbnail_url, image_url, blur_data_url, kind),
        collections(name, slug), categories(name, slug)
      `)
      .eq('is_active', true)
      .or(`sku.ilike.${term},name.ilike.${term},finish.ilike.${term},base_material.ilike.${term},color_tone.ilike.${term},short_description.ilike.${term}`)
      .limit(48),

    supabase
      .from('collections')
      .select('id, name, slug, banner_url, tagline, categories(name, slug)')
      .eq('is_active', true)
      .or(`name.ilike.${term},tagline.ilike.${term},description.ilike.${term}`)
      .limit(8),

    supabase
      .from('categories')
      .select('id, name, slug, image_url, description')
      .eq('is_active', true)
      .or(`name.ilike.${term},description.ilike.${term}`)
      .limit(4),
  ]);

  const totalProducts = products?.length || 0;
  const totalCollections = collections?.length || 0;
  const totalCategories = categories?.length || 0;
  const total = totalProducts + totalCollections + totalCategories;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Search bar at top — pre-filled */}
      <div className="mb-8">
        <GlobalSearch />
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          {total > 0
            ? <>{total} result{total !== 1 ? 's' : ''} for <span className="text-accent">"{q}"</span></>
            : <>No results for <span className="text-accent">"{q}"</span></>
          }
        </h1>
      </div>

      {total === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted mb-4">Try a different search term</p>
          <p className="text-sm text-text-muted">You can search by product name, SKU code, wood species, finish, collection, or category</p>
        </div>
      )}

      {/* Categories */}
      {totalCategories > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 text-text-secondary uppercase tracking-wide text-sm">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.map(cat => <CategoryCard key={cat.id} category={cat} />)}
          </div>
        </section>
      )}

      {/* Collections */}
      {totalCollections > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 text-text-secondary uppercase tracking-wide text-sm">Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections?.map(col => <CollectionCard key={col.id} collection={col} />)}
          </div>
        </section>
      )}

      {/* Products */}
      {totalProducts > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-secondary uppercase tracking-wide text-sm">
            Products ({totalProducts})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products?.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

### 1.4 — Place search on homepage

In the homepage hero section, replace or augment the existing search input with `<GlobalSearch />`.
The search box should be visually centered and prominent — the single most visible element
below the hero headline.

```typescript
// In app/(public)/page.tsx hero section
import { GlobalSearch } from '@/components/search/GlobalSearch';

// Inside the hero JSX, below the headline:
<div className="w-full max-w-2xl mx-auto mt-8">
  <GlobalSearch />
</div>
```

Also add `<GlobalSearch />` to the sticky header, collapsed behind a search icon on mobile
(icon button → expands to full-width search bar overlay).

---

---

## FEATURE 2 — Smart Multi-Product Enquiry System

### The problem with the current system

Right now: user opens Quick Inquiry → fills form → submits one enquiry. If they want to enquire
about 5 different veneers from 3 collections, they have to submit 5 separate forms. That's
terrible UX. A real architect or designer is comparing multiple options and wants to send
one consolidated request.

### The solution: Enquiry Cart (like a shopping cart, but for enquiries)

Think of it exactly like a cart — but instead of "Add to Cart" it's "Add to Enquiry".
The user browses freely, adds products to their enquiry list, then submits one single form
with all selected products. The sales team receives one consolidated email.

This is the best coverage mechanism because:
- One form submission = potentially 10–15 products across multiple collections
- The sales team has the full picture in one email, not 15 separate emails
- Customer doesn't have to re-fill their contact details 15 times
- Admin panel shows one enquiry record with all products attached

---

### 2.1 — Database changes

```sql
-- New table: enquiry_sessions (one submission = one session)
CREATE TABLE IF NOT EXISTS enquiry_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    text NOT NULL,
  phone        text NOT NULL,
  whatsapp     text,
  firm         text,
  city         text NOT NULL,
  message      text,
  status       text DEFAULT 'pending',  -- pending | contacted | closed
  created_at   timestamptz DEFAULT now()
);

-- New table: enquiry_items (products within a session)
CREATE TABLE IF NOT EXISTS enquiry_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid REFERENCES enquiry_sessions(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES products(id) ON DELETE SET NULL,
  product_code      text,   -- denormalised so it survives product deletion
  product_name      text,
  collection_name   text,
  category_name     text,
  quantity          text,
  note              text,   -- per-product note from the customer
  created_at        timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE enquiry_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_sessions" ON enquiry_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_items"    ON enquiry_items    FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_sessions"    ON enquiry_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_read_items"       ON enquiry_items    FOR ALL USING (auth.role() = 'authenticated');
```

> **Also keep the old `quote_requests` table.** Single quick enquiries from the Quick Inquiry
> button (not product-specific) continue to save there. The new `enquiry_sessions` +
> `enquiry_items` tables handle the multi-product flow.

---

### 2.2 — Enquiry Cart state (Zustand store)

```typescript
// lib/enquiry-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EnquiryItem {
  productId: string;
  sku: string;
  name: string;
  collectionName: string;
  categoryName: string;
  thumbnailUrl?: string;
  quantity: string;
  note: string;
}

interface EnquiryStore {
  items: EnquiryItem[];
  isDrawerOpen: boolean;
  addItem: (item: Omit<EnquiryItem, 'quantity' | 'note'>) => void;
  removeItem: (productId: string) => void;
  updateItem: (productId: string, updates: Partial<Pick<EnquiryItem, 'quantity' | 'note'>>) => void;
  clearItems: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  hasItem: (productId: string) => boolean;
}

export const useEnquiryStore = create<EnquiryStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (item) => {
        if (get().hasItem(item.productId)) return;
        set(state => ({ items: [...state.items, { ...item, quantity: '', note: '' }] }));
      },

      removeItem: (productId) =>
        set(state => ({ items: state.items.filter(i => i.productId !== productId) })),

      updateItem: (productId, updates) =>
        set(state => ({
          items: state.items.map(i => i.productId === productId ? { ...i, ...updates } : i),
        })),

      clearItems: () => set({ items: [] }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      hasItem: (productId) => get().items.some(i => i.productId === productId),
    }),
    {
      name: 'enquiry-cart',              // persists to localStorage
      partialize: (state) => ({ items: state.items }), // only persist items, not drawer state
    }
  )
);
```

Install: `npm install zustand`

---

### 2.3 — "Add to Enquiry" button

This button replaces or sits alongside the existing "Quick Inquiry" button on product cards
and product detail pages.

```typescript
// components/catalogue/AddToEnquiryButton.tsx
'use client';
import { useEnquiryStore } from '@/lib/enquiry-store';
import { Plus, Check } from 'lucide-react';

interface Props {
  product: {
    id: string;
    sku: string;
    name: string;
    collections?: { name: string };
    categories?: { name: string };
    product_images?: { thumbnail_url: string; kind: string }[];
  };
  variant?: 'card' | 'detail';  // slightly different styling per context
}

export function AddToEnquiryButton({ product, variant = 'card' }: Props) {
  const { addItem, removeItem, hasItem, openDrawer, items } = useEnquiryStore();
  const added = hasItem(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (added) {
      openDrawer();   // if already added, open drawer instead
      return;
    }
    const thumb = product.product_images?.find(i => i.kind === 'main')?.thumbnail_url
      || product.product_images?.[0]?.thumbnail_url;
    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      collectionName: product.collections?.name || '',
      categoryName: product.categories?.name || '',
      thumbnailUrl: thumb,
    });
    openDrawer();
  };

  if (variant === 'card') {
    return (
      <button
        onClick={handleClick}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
          ${added
            ? 'bg-accent text-white'
            : 'bg-white/90 text-text-primary border border-border hover:bg-accent hover:text-white hover:border-accent'
          }
        `}
      >
        {added ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        {added ? 'In Enquiry' : 'Add to Enquiry'}
      </button>
    );
  }

  // Detail variant — larger button
  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
        ${added
          ? 'bg-accent/10 text-accent border border-accent'
          : 'border border-border hover:border-accent hover:text-accent'
        }
      `}
    >
      {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      {added ? 'Added to Enquiry List — View List' : 'Add to Enquiry List'}
    </button>
  );
}
```

---

### 2.4 — Enquiry Cart Drawer (slide-in from right)

This is the core UI. A persistent slide-in drawer from the right side. Shows all items the user
has added, lets them edit quantity/note per item, remove items, and submit the final form.

```typescript
// components/enquiry/EnquiryDrawer.tsx
'use client';
import { useState } from 'react';
import { useEnquiryStore } from '@/lib/enquiry-store';
import { X, Trash2, ShoppingBag, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().min(7, 'Valid phone number required'),
  whatsapp: z.string().optional(),
  firm: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  message: z.string().optional(),
});
type ContactForm = z.infer<typeof contactSchema>;

export function EnquiryDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateItem, clearItems } = useEnquiryStore();
  const [step, setStep] = useState<'list' | 'form' | 'success'>('list');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (contact: ContactForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, items }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStep('success');
      clearItems();
      reset();
    } catch (e) {
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    closeDrawer();
    if (step === 'success') setStep('list');
  };

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl
        flex flex-col transform transition-transform duration-300 ease-out
        ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-text-primary">
              Enquiry List
              {items.length > 0 && (
                <span className="ml-2 bg-accent text-white text-xs rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              )}
            </h2>
          </div>
          <button onClick={handleClose} className="text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Step 1: Item list */}
          {step === 'list' && (
            <div className="flex flex-col h-full">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <ShoppingBag className="w-12 h-12 text-border mb-4" />
                  <p className="text-text-muted text-sm">Your enquiry list is empty</p>
                  <p className="text-text-muted text-xs mt-1">Browse products and click "Add to Enquiry"</p>
                  <button onClick={handleClose} className="mt-4 text-accent text-sm hover:underline">
                    Continue browsing →
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.map((item) => (
                      <div key={item.productId} className="bg-surface rounded-xl p-3">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          {item.thumbnailUrl ? (
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-border flex-shrink-0" />
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                                <p className="text-xs text-text-muted">{item.collectionName}</p>
                                <span className="font-mono text-xs text-text-muted">{item.sku}</span>
                              </div>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="text-text-muted hover:text-red-500 flex-shrink-0 mt-0.5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Quantity and note */}
                            <div className="mt-2 space-y-1.5">
                              <input
                                type="text"
                                placeholder="Quantity (optional)"
                                value={item.quantity}
                                onChange={e => updateItem(item.productId, { quantity: e.target.value })}
                                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                              <input
                                type="text"
                                placeholder="Note, e.g. for hotel lobby project"
                                value={item.note}
                                onChange={e => updateItem(item.productId, { note: e.target.value })}
                                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Proceed button */}
                  <div className="p-4 border-t border-border space-y-2">
                    <button
                      onClick={() => setStep('form')}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Request Quote for {items.length} Product{items.length !== 1 ? 's' : ''}
                    </button>
                    <button
                      onClick={() => clearItems()}
                      className="w-full text-xs text-text-muted hover:text-red-500 transition-colors py-1"
                    >
                      Clear all
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Contact form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
              {/* Mini item summary */}
              <div className="px-4 py-3 bg-surface border-b border-border">
                <p className="text-xs text-text-muted font-medium mb-2">
                  Requesting quote for {items.length} product{items.length !== 1 ? 's' : ''}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.slice(0, 5).map(item => (
                    <span key={item.productId} className="font-mono text-xs bg-white border border-border px-2 py-0.5 rounded">
                      {item.sku}
                    </span>
                  ))}
                  {items.length > 5 && (
                    <span className="text-xs text-text-muted px-2 py-0.5">+{items.length - 5} more</span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input {...register('full_name')} className="form-input" placeholder="Your name" />
                    {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">Phone *</label>
                    <input {...register('phone')} className="form-input" placeholder="+91 98765..." />
                    {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">WhatsApp</label>
                    <input {...register('whatsapp')} className="form-input" placeholder="If different" />
                  </div>
                  <div>
                    <label className="form-label">Firm / Company</label>
                    <input {...register('firm')} className="form-input" placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <label className="form-label">City *</label>
                  <input {...register('city')} className="form-input" placeholder="Your city" />
                  {errors.city && <p className="form-error">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="form-label">Project / Message</label>
                  <textarea
                    {...register('message')}
                    className="form-input"
                    rows={3}
                    placeholder="Tell us about your project..."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border space-y-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-3"
                >
                  {submitting ? 'Sending...' : 'Submit Enquiry'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('list')}
                  className="w-full text-sm text-text-muted hover:text-text-primary transition-colors py-1"
                >
                  ← Back to list
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Enquiry Sent!</h3>
              <p className="text-text-muted text-sm mb-6">
                Our team will review your enquiry and get back to you within 24 hours.
              </p>
              <button
                onClick={handleClose}
                className="btn-primary px-8"
              >
                Continue Browsing
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

---

### 2.5 — Floating Enquiry Cart button

Persistent floating button on all public pages (not admin) showing item count.

```typescript
// components/enquiry/EnquiryCartFab.tsx
'use client';
import { useEnquiryStore } from '@/lib/enquiry-store';
import { ShoppingBag } from 'lucide-react';

export function EnquiryCartFab() {
  const { items, openDrawer } = useEnquiryStore();

  if (items.length === 0) return null;  // hide when empty

  return (
    <button
      onClick={openDrawer}
      className="
        fixed bottom-6 right-6 z-30
        flex items-center gap-2
        bg-accent text-white
        pl-4 pr-5 py-3 rounded-full
        shadow-lg hover:shadow-xl
        transform hover:-translate-y-0.5
        transition-all duration-200
        font-medium text-sm
      "
    >
      <ShoppingBag className="w-4 h-4" />
      <span>Enquiry List</span>
      <span className="bg-white text-accent text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-1">
        {items.length}
      </span>
    </button>
  );
}
```

Add to `app/(public)/layout.tsx`:
```typescript
import { EnquiryDrawer } from '@/components/enquiry/EnquiryDrawer';
import { EnquiryCartFab } from '@/components/enquiry/EnquiryCartFab';

// In the layout JSX:
<EnquiryDrawer />
<EnquiryCartFab />
```

---

### 2.6 — API route: submit multi-product enquiry

```typescript
// app/api/enquiry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const schema = z.object({
  contact: z.object({
    full_name: z.string().min(1),
    phone: z.string().min(7),
    whatsapp: z.string().optional(),
    firm: z.string().optional(),
    city: z.string().min(1),
    message: z.string().optional(),
  }),
  items: z.array(z.object({
    productId: z.string(),
    sku: z.string(),
    name: z.string(),
    collectionName: z.string(),
    categoryName: z.string(),
    quantity: z.string().optional(),
    note: z.string().optional(),
  })).min(1, 'At least one product required'),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const { contact, items } = result.data;
  const supabase = createClient();

  // 1. Save enquiry session
  const { data: session, error: sessionError } = await supabase
    .from('enquiry_sessions')
    .insert({
      full_name: contact.full_name,
      phone: contact.phone,
      whatsapp: contact.whatsapp || null,
      firm: contact.firm || null,
      city: contact.city,
      message: contact.message || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to save enquiry' }, { status: 500 });
  }

  // 2. Save enquiry items
  const itemRows = items.map(item => ({
    session_id: session.id,
    product_id: item.productId,
    product_code: item.sku,
    product_name: item.name,
    collection_name: item.collectionName,
    category_name: item.categoryName,
    quantity: item.quantity || null,
    note: item.note || null,
  }));

  await supabase.from('enquiry_items').insert(itemRows);

  // 3. Send email to team
  const itemsHtml = items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#ffffff'}">
      <td style="padding:8px 12px;font-family:monospace;font-size:13px">${item.sku}</td>
      <td style="padding:8px 12px;font-size:13px">${item.name}</td>
      <td style="padding:8px 12px;font-size:13px;color:#666">${item.collectionName}</td>
      <td style="padding:8px 12px;font-size:13px">${item.quantity || '—'}</td>
      <td style="padding:8px 12px;font-size:13px;color:#666">${item.note || '—'}</td>
    </tr>
  `).join('');

  await resend.emails.send({
    from: 'enquiries@yourdomain.com',
    to: [process.env.QUOTE_RECIPIENT_EMAIL!],
    subject: `New Enquiry — ${items.length} product${items.length !== 1 ? 's' : ''} — ${contact.full_name} — ${contact.city}`,
    html: `
      <div style="font-family:sans-serif;max-width:700px;margin:0 auto">
        <h2 style="color:#1a1a1a">New Enquiry Received</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:6px 0;width:140px;color:#666;font-size:13px">Name</td><td style="padding:6px 0;font-weight:600">${contact.full_name}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Phone</td><td style="padding:6px 0;font-weight:600">${contact.phone}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">WhatsApp</td><td style="padding:6px 0">${contact.whatsapp || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Firm</td><td style="padding:6px 0">${contact.firm || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">City</td><td style="padding:6px 0">${contact.city}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Message</td><td style="padding:6px 0;font-style:italic">${contact.message || '—'}</td></tr>
        </table>

        <h3 style="color:#1a1a1a">Products Enquired (${items.length})</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee">
          <thead>
            <tr style="background:#1a1a1a;color:white">
              <th style="padding:10px 12px;text-align:left;font-size:12px">SKU</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px">Product</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px">Collection</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px">Quantity</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px">Note</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <p style="margin-top:24px;color:#999;font-size:12px">
          Received: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br>
          View in admin: ${process.env.NEXT_PUBLIC_APP_URL}/admin/enquiries
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true, sessionId: session.id });
}
```

---

### 2.7 — Admin Enquiries page

Create a new admin page at `/admin/enquiries`. This is separate from the existing `/admin/quotes` page
(which handles single Quick Inquiry form submissions).

```typescript
// app/admin/enquiries/page.tsx

// Fetch all sessions with their items and item count
const { data: sessions } = await supabase
  .from('enquiry_sessions')
  .select(`
    *,
    enquiry_items (
      id, product_code, product_name, collection_name, quantity, note
    )
  `)
  .order('created_at', { ascending: false });
```

**Table columns:** Date/Time · Name · Phone · City · Firm · Products (count badge) · Status

**Click row → expand panel below showing:**
- Contact details (phone + WhatsApp as clickable links)
- Full message
- Products table: SKU | Product Name | Collection | Quantity | Note
- Status dropdown: `pending` → `contacted` → `closed`
- WhatsApp link: `https://wa.me/[phone]?text=Hi [name], regarding your enquiry...`

**Status update:**
```typescript
await supabase
  .from('enquiry_sessions')
  .update({ status: newStatus })
  .eq('id', sessionId);
```

Add "Enquiries" link to admin sidebar navigation.

---

### 2.8 — Place "Add to Enquiry" on product card and detail page

**On product card** (already has Quick Inquiry hover button):
Add `<AddToEnquiryButton product={product} variant="card" />` alongside the existing button.
The two buttons sit side by side on hover.

**On product detail page** (right column, below existing quote CTA):
```typescript
<div className="space-y-3">
  {/* Existing single quote button */}
  <button onClick={() => setQuoteModalOpen(true)} className="w-full btn-primary py-3">
    Request Quote
  </button>

  {/* New multi-product enquiry */}
  <AddToEnquiryButton product={product} variant="detail" />
</div>
```

---

### 2.9 — Quick Inquiry form (keep, but improve)

Keep the existing Quick Inquiry modal and `quote_requests` table exactly as-is for general
(non-product-specific) enquiries from the utility bar button.

The only change: add a small footnote below the form:
```
"Want to enquire about multiple products? Browse the catalogue and use the
'Add to Enquiry' button on each product."
```

---

## Implementation checklist

### Search
- [ ] `GET /api/search` route working — returns categories, collections, products
- [ ] Products in results include `thumbnail_url` via `product_images` join
- [ ] `GlobalSearch` component renders dropdown with grouped results
- [ ] Keyboard navigation works (↑ ↓ Enter Escape)
- [ ] Debounce 250ms — no request fires until 2+ chars
- [ ] `/search?q=query` full results page works
- [ ] `GlobalSearch` placed in homepage hero section
- [ ] `GlobalSearch` accessible from sticky header (icon → expand on mobile)
- [ ] Clicking result navigates correctly and closes dropdown

### Enquiry system
- [ ] `enquiry_sessions` and `enquiry_items` tables exist in Supabase with RLS
- [ ] `useEnquiryStore` (Zustand) created with persist middleware
- [ ] `AddToEnquiryButton` shows correct state (add vs added vs open drawer)
- [ ] Button placed on product cards (hover state) AND product detail page
- [ ] `EnquiryDrawer` slides in from right, shows item list
- [ ] Per-item quantity and note fields work and update store
- [ ] Step progression: list → form → success works
- [ ] Step 2 form validates and shows field errors
- [ ] `POST /api/enquiry` saves session + items to Supabase
- [ ] Email sent via Resend with product table HTML
- [ ] `EnquiryCartFab` visible when cart has items, hidden when empty
- [ ] Cart persists across page navigation (Zustand persist)
- [ ] Cart clears after successful submission
- [ ] Admin `/admin/enquiries` page lists all sessions
- [ ] Clicking session row expands full detail
- [ ] Status update (pending → contacted → closed) saves to DB
- [ ] "Enquiries" added to admin sidebar nav
- [ ] Existing Quick Inquiry form and `/admin/quotes` page remain unchanged

---

## Do not change

- Existing public UI styling, layout, or components
- Existing `/admin/quotes` page (single Quick Inquiry submissions)
- Existing `quote_requests` table
- Existing product, collection, category pages
- S3 upload logic
- Any seeded data