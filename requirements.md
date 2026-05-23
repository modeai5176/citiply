# Phase 1 — Premium Digital Catalogue Platform
### Requirements Document, Reference Analysis & Implementation Prompt

> **Project type:** Digital product discovery & quote request platform
> **Target users:** Architects, interior designers, builders, contractors
> **Stack:** Next.js 14 · TypeScript · Supabase · Cloudflare R2 · Vercel
> **Single conversion goal:** User views product → Request Quote → team handles personally
> **Reference site:** [naturalveneers.com](https://www.naturalveneers.com) — match 70–80% of its UX and aesthetic patterns

---

## Table of contents

1. [What this project is](#1-what-this-project-is)
2. [Reference site analysis — naturalveneers.com](#2-reference-site-analysis)
3. [Target users](#3-target-users)
4. [Product hierarchy](#4-product-hierarchy)
5. [Public pages in scope](#5-public-pages-in-scope)
6. [Admin panel modules](#6-admin-panel-modules)
7. [Product detail page fields](#7-product-detail-page-fields)
8. [Quote request form](#8-quote-request-form)
9. [Design system](#9-design-system)
10. [Technology stack](#10-technology-stack)
11. [Image handling strategy](#11-image-handling-strategy)
12. [Database schema](#12-database-schema)
13. [Performance requirements](#13-performance-requirements)
14. [UX non-negotiables](#14-ux-non-negotiables)
15. [What NOT to build in Phase 1](#15-what-not-to-build-in-phase-1)
16. [Implementation prompt](#16-implementation-prompt)

---

## 1. What this project is

This is **not** an ecommerce site. It is a premium digital catalogue platform designed for trade professionals who already know what they want and need a fast, clean, technical product reference.

The only business action on the entire platform:

```
User browses catalogue  →  Clicks "Request Quote"  →  Sales team follows up personally
```

No cart. No checkout. No payment. No inventory. No customer accounts. Phase 1 is purely product discovery and lead capture.

---

## 2. Reference site analysis

**Reference:** [https://www.naturalveneers.com](https://www.naturalveneers.com)

Study this site carefully before writing any UI code. Our platform should feel 70–80% similar in structure, navigation patterns, and visual language. The following observations must be applied directly.

### 2.1 Navigation — copy this pattern exactly

Natural Veneers uses a **mega-menu navigation** where each top-level category expands into a rich dropdown with:
- Sub-category groupings with bold section headings
- Collection names listed in columns
- **Inline "View Product Range" and "Download Brochure" links** per collection inside the dropdown
- Collection logo/thumbnail images inside the dropdown hover panel

**Apply this to our platform:** The sticky header nav should have category dropdowns that show collection names with inline CTAs. Do not use a flat list — use the grouped mega-menu layout.

The top utility bar (above the main nav) has: Quick Inquiry | Downloads | Login — replicate this secondary bar pattern for: WhatsApp | Downloads | Quick Inquiry.

### 2.2 Hero section — copy this pattern

The homepage hero is a **full-viewport-height image slider** (not a banner strip). Key patterns:
- The hero image IS the background — full bleed, edge to edge
- Collection branding (logo lockup) is overlaid on the left side of the hero
- A short tagline sits under the logo (e.g. "Four New Designs. One Sculpted Statement.")
- The "Explore More" CTA expands in-place to reveal 4 quick-action buttons:
  - Explore Features
  - View Product Range
  - Download Brochure
  - Download Texture
- These 4 buttons sit inside the hero as icon + label pills — replicate this exact CTA cluster pattern
- Multiple hero slides, auto-rotating, each featuring a different collection

### 2.3 Product listing page — copy this layout

On the collection product listing page (e.g. `/veneer-range/furrow-reganto`), the layout is:
- Full-width collection banner at top with collection name and tagline
- Product grid: **4 columns on desktop, 2 on tablet, 1 on mobile**
- Each product card shows: shade image, shade code (monospace), shade name
- Cards are very minimal — image is dominant, text is small beneath
- Clicking a card opens a **quick-view modal** (or navigates to product detail)
- Filter/search bar sits above the grid, clean and minimal
- No sidebar — filters are horizontal chips/dropdowns above the grid

### 2.4 Product card design — replicate this

From the reference site, each product card in the listing grid follows this structure:
```
┌─────────────────────┐
│                     │
│   [Full image]      │  ← dominant, aspect-ratio locked, hover zoom
│                     │
├─────────────────────┤
│  C10 327            │  ← product code in monospace, small
│  Furrow Reganto     │  ← name, slightly larger
│  [Quick Inquiry]    │  ← ghost button, appears on hover
└─────────────────────┘
```
The card background is white/light. On hover: subtle shadow lift and a "Quick Inquiry" button appears over or below the image.

### 2.5 Dropdown navigation with collection previews

Inside category dropdown menus, Natural Veneers shows a **collection preview panel** with:
- Collection logo image on the left
- Collection name as a heading
- Short description text (1–2 lines)
- Two CTA links: "View Product Range" and "Download Brochure"

This pattern makes the nav itself feel like a mini-catalogue. Implement the same for collections in our dropdown menus.

### 2.6 Downloads page

Natural Veneers has a dedicated `/downloads` page with downloadable PDFs grouped by product range. Each entry has: collection name, a PDF icon, and a direct download button. Replicate this exact layout — grid of download cards, grouped by category.

### 2.7 Quick Inquiry (floating + in-nav)

The site has a persistent "Quick Inquiry" link in the utility nav that opens a modal form. This is separate from product-specific quote requests. Implement:
- A floating "Quick Inquiry" button or a utility nav link
- Clicking it opens a general quote/inquiry modal (not product-specific)
- Product-specific quote forms remain on product pages (pre-fill SKU)

### 2.8 Visual language to replicate

| Element | What naturalveneers.com does | What we should do |
|---|---|---|
| Background | Off-white / light stone (`#F5F3EF` range) | Match — use `#FAFAF8` or `#F5F3EF` |
| Product images | Full-bleed, no padding, fill the card | Same — image is the hero of every card |
| Typography | Clean sans-serif, light weight on hero, medium on body | Inter or similar, same weight hierarchy |
| Accent color | Dark charcoal + warm wood tones | Charcoal `#1A1A1A` + gold `#C9A96E` |
| Buttons | Ghost/outline style for secondary, solid dark for primary | Match exactly |
| Product codes | Monospace, small, muted — shown prominently on cards | Copy this pattern |
| Spacing | Generous whitespace — content never feels crowded | Match — use 64–96px section spacing |
| Footer | Dark background (near black), logo, links, social | Match the dark footer pattern |
| Collection logos | Each collection has a text logo/lockup used in hero + nav | We should support a `collection_logo_url` field |

### 2.9 What naturalveneers.com does that we should NOT do

- Customer login/register (Phase 1: not needed)
- Mobile app store links in the header
- Blog section (out of scope Phase 1)
- FAQ page (out of scope Phase 1)
- "Download Texture" (texture file downloads — Phase 3 only)

---

## 3. Target users

| User type | What they need |
|---|---|
| Architects | Quick SKU lookup, spec downloads, clean visuals for client presentations |
| Interior designers | Browse by tone and finish, see application images, download brochures |
| Builders & contractors | Filter by material and size, get quotes fast, share with clients |
| Project consultants | Compare collections, access technical specs, export PDFs |

These users are professionals. They do not need hand-holding. Speed, accuracy, and a premium feel are the priority.

---

## 4. Product hierarchy

The catalogue is structured as a four-level hierarchy. This is a **catalogue library**, not an ecommerce store.

| Level | Example | Description |
|---|---|---|
| Category | Wall Panels | Top-level product type. 7–8 categories total. |
| Collection | Furrow Reganto | A branded family of products within a category. |
| Series | Furrow Lite | A sub-range within a collection. |
| SKU / Product | C10 327 | Individual product with full specs and images. |

Each collection should also support a `collection_logo_url` — a branded text/logo lockup used in hero slides and dropdown nav panels (matching the Natural Veneers pattern).

---

## 5. Public pages in scope

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Full-viewport hero slider, category grid, featured collections |
| Categories | `/categories` | All categories with full-bleed image cards |
| Collections | `/categories/[slug]` | Collections within a category — banner + brochure CTA |
| Product listing | `/collections/[slug]` | Filterable 4-col product grid, horizontal filter chips |
| Product detail | `/products/[sku]` | Full specs, image gallery, PDF download, quote CTA |
| Request quote | `/quote` | Standalone quote form + modal variant |
| Downloads | `/downloads` | Brochures and catalogue PDFs grouped by category |
| About | `/about` | Brand story, stats, showroom |
| Contact | `/contact` | Address, phone, WhatsApp click-to-chat, map |

---

## 6. Admin panel modules

All `/admin/*` routes are protected by Supabase Auth middleware. The panel must be simple enough to use without training.

| Module | Route | Key features |
|---|---|---|
| Login | `/admin/login` | Email + password, redirect on success |
| Dashboard | `/admin/dashboard` | Stats cards + last 10 quote requests table |
| Categories | `/admin/categories` | Add, edit, delete, drag-to-reorder |
| Collections | `/admin/collections` | Add with banner image, collection logo, PDF upload |
| Products | `/admin/products` | Search, filter, bulk publish/unpublish, CSV import |
| Product edit | `/admin/products/[id]` | Full form: all fields, image uploader, dynamic specs, SEO |
| Media library | `/admin/media` | Image grid with search and delete |
| Quotes | `/admin/quotes` | All quote requests, click to expand full detail |

---

## 7. Product detail page fields

| Field | Example | Display |
|---|---|---|
| Product code | C10 327 | Monospace badge, prominent at top — same as naturalveneers.com |
| Product name | Furrow Reganto C10 327 | H1 |
| Collection | Furrow Reganto | Clickable tag linking back to collection page |
| Finish | Matte, textured | Pill tag |
| Base material | Plywood, HDHMR, MDF | Spec grid row |
| Size | 10ft × 4ft | Spec grid row |
| Thickness | 11mm | Spec grid row |
| Color tone | Walnut, beige, dark | Filterable tag |
| Application | Wall panel, ceiling, wardrobe | Multi-chip tags |
| Images | Main, closeup, texture, application | Gallery with thumbnail strip below |
| Brochure PDF | furrow-reganto.pdf | "Download Brochure" button, opens new tab |
| Dynamic specs | Veneer layer, weight, grade | Flexible key-value table (from `product_specs` DB) |

---

## 8. Quote request form

The quote form is the **only conversion point** on the platform. It must be fast, reliable, and visually trustworthy.

| Field | Required | Notes |
|---|---|---|
| Full name | Yes | Text input with validation |
| Phone number | Yes | With country code selector, format validation |
| WhatsApp number | No | Optional — team may follow up via WhatsApp |
| Firm / company | No | Free text |
| City | Yes | Free text |
| Product code | Auto-filled | Pre-populated when opened from product page |
| Quantity | No | Number or free text ("25 panels") |
| Message | No | Textarea for project context |

On submit: POST `/api/quote` → send HTML email via Resend → save to `quote_requests` table → show success animation.

Email subject format: `New Quote Request — [Product Code] — [Collection Name]`

---

## 9. Design system

Derived from studying naturalveneers.com. These values must be hardcoded into the Tailwind config.

```js
// tailwind.config.js — extend colors
colors: {
  background:  '#FAFAF8',   // off-white page background
  surface:     '#F5F3EF',   // card/panel surface — stone warm
  border:      '#E5E2DC',   // default border
  text: {
    primary:   '#1A1A1A',   // near-black headings
    secondary: '#555550',   // body copy
    muted:     '#9A9892',   // captions, metadata
  },
  accent:      '#C9A96E',   // gold — buttons, highlights
  dark:        '#111111',   // footer, dark sections
}

// Typography (add to tailwind config)
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],  // for product codes
}
```

**Component rules (copy from naturalveneers.com patterns):**

- **Product cards:** white background, 1px `border-border`, `rounded-xl`, no shadow at rest, `shadow-md` on hover, image fills the top 75% of card
- **Buttons:** Primary = `bg-accent text-white rounded-full px-6 py-2.5`; Ghost = `border border-current rounded-full px-6 py-2.5`; match the pill-shaped buttons from the reference site
- **Section spacing:** `py-16` (64px) minimum between sections, `py-24` (96px) for hero sections
- **Collection banner:** full-width image, min-height 50vh, dark overlay, collection logo + tagline centered
- **Footer:** `bg-dark text-white`, multi-column links, logo at top-left — match the dark footer from naturalveneers.com
- **Product code badge:** `font-mono text-xs tracking-widest uppercase bg-surface px-2 py-1 rounded`
- **Mega-menu dropdown:** white background, `shadow-xl`, grouped columns, collection logos, inline brochure download links

---

## 10. Technology stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 App Router + TypeScript | SEO, ISR, fast product pages |
| Styling | Tailwind CSS | Fast iteration, consistent spacing grid |
| Database | Supabase PostgreSQL | Structured catalogue data, built-in auth, RLS |
| Auth | Supabase Auth | Protects admin routes via middleware |
| File storage | Cloudflare R2 | 5,000+ images and PDFs, CDN-ready, cheap |
| Image processing | Sharp | WebP conversion, thumbnails, blur placeholders |
| Email | Resend | Reliable transactional email for quote delivery |
| Hosting | Vercel | Zero-config Next.js deploy, ISR support |
| Forms | React Hook Form + Zod | Typed validation, accessible, performant |
| Animation | Framer Motion | Subtle route transitions and hover effects |

---

## 11. Image handling strategy

### Naming convention

```
[sku]_main.webp        → primary product image (1200px wide)
[sku]_thumb.webp       → listing page thumbnail (400px wide)
[sku]_closeup.webp     → texture or surface detail
[sku]_application.webp → in-use interior application photo
```

Example: `c10_327_main.webp`, `c10_327_thumb.webp`

### Sharp processing pipeline (on every upload)

1. Convert to WebP main — 1200px wide, quality 85 → `/products/[sku]/main.webp`
2. Generate thumbnail — 400px wide, quality 80 → `/products/[sku]/thumb.webp`
3. Generate blur placeholder — 20px wide, base64 encoded → stored in `product_images.blur_data_url`

### R2 folder structure

```
/categories/[slug]/hero.webp
/collections/[slug]/banner.webp
/collections/[slug]/logo.webp       ← collection logo lockup (from NV reference)
/collections/[slug]/brochure.pdf
/products/[sku]/main.webp
/products/[sku]/thumb.webp
/products/[sku]/closeup.webp
/products/[sku]/application.webp
```

---

## 12. Database schema

Six core tables. Product specs are **flexible key-value** to handle inconsistent fields across different catalogue PDFs.

```sql
-- Categories
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  image_url   text,
  sort_order  int default 0,
  is_active   boolean default true
);

-- Collections
create table collections (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references categories(id) on delete cascade,
  name             text not null,
  slug             text unique not null,
  description      text,
  banner_image_url text,
  logo_url         text,        -- collection logo lockup for hero/nav
  brochure_url     text,
  is_featured      boolean default false,
  is_active        boolean default true
);

-- Products
create table products (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references categories(id),
  collection_id    uuid references collections(id),
  sku              text unique not null,
  name             text not null,
  slug             text unique not null,
  short_description text,
  finish           text,
  base_material    text,
  size             text,
  thickness        text,
  color_tone       text,
  application      text[],     -- array of application tags
  is_active        boolean default true,
  seo_title        text,
  seo_description  text
);

-- Product images
create table product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id) on delete cascade,
  image_url     text not null,
  thumbnail_url text,
  blur_data_url text,     -- base64 blur placeholder
  alt_text      text,
  image_type    text,     -- 'main' | 'closeup' | 'application' | 'texture'
  sort_order    int default 0
);

-- Flexible product specs
create table product_specs (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  spec_name  text not null,
  spec_value text not null,
  sort_order int default 0
);

-- Quote requests
create table quote_requests (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references products(id),
  name         text not null,
  phone        text not null,
  whatsapp     text,
  firm_name    text,
  city         text not null,
  quantity     text,
  message      text,
  product_code text,   -- denormalised for easy email
  created_at   timestamptz default now()
);

-- Downloads
create table downloads (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid references collections(id),
  title         text not null,
  file_url      text not null,
  file_type     text default 'pdf',
  is_active     boolean default true
);
```

**RLS policies:** Public can `SELECT` active records. Only authenticated admin users can `INSERT`, `UPDATE`, `DELETE`.

---

## 13. Performance requirements

- Product listing pages: ISR with `revalidate: 3600`
- Product detail pages: SSG for top 200 SKUs at build time, ISR for the rest
- Admin pages: fully dynamic, no caching
- All images: `next/image` with `blurDataURL` placeholder, `lazy` loading, correct `sizes` prop
- Product listings: paginate at **12 products per page** — never load all products in one query
- Use thumbnails on listing pages, full WebP only on detail pages
- Cloudflare CDN in front of R2 for all media delivery

---

## 14. UX non-negotiables

Derived from studying naturalveneers.com. Apply these to every public page.

- **Mobile-first** responsive — test at 375px, 768px, 1280px, 1440px
- **Mega-menu navigation** with collection previews (inline brochure links) — copy naturalveneers.com pattern
- **Full-viewport hero slider** on homepage with inline CTA cluster (Explore / View Range / Download Brochure)
- **Sticky header** with utility bar above main nav
- **4-column product grid** on desktop (matching naturalveneers.com listing pages)
- **Horizontal filter chips** above product grid — no sidebar
- Product codes displayed in **monospace** throughout — cards, detail pages, quote emails
- **Collection logo support** — each collection can have a branded logo lockup for hero + nav
- Loading **skeletons** on all data-fetching pages — no spinners
- **Breadcrumbs** on all inner pages
- **Quick Inquiry floating button** or utility nav link opening a general inquiry modal
- Empty states with helpful message on all list views
- Toast notifications for form submit success and errors
- Error boundaries on all pages
- All images have descriptive alt text (SKU + name + finish)
- Smooth page transitions via Framer Motion
- **Dark footer** matching naturalveneers.com — near-black background, white text, logo, columns

---

## 15. What NOT to build in Phase 1

| Feature | Status |
|---|---|
| Online payment / checkout | ❌ Not in Phase 1 |
| Add to cart | ❌ Not in Phase 1 |
| Customer login / accounts | ❌ Not in Phase 1 |
| CRM / enquiry tracking | ❌ Not in Phase 1 |
| Inventory or stock management | ❌ Not in Phase 1 |
| Mobile app | ❌ Not in Phase 1 |
| AI PDF extraction | ❌ Phase 3 only |
| Texture file downloads | ❌ Phase 3 only |
| Blog | ❌ Out of scope |
| FAQ | ❌ Out of scope |
| WhatsApp API | ⚠️ Click-to-chat link only |


---

*Document version 1.0 — Phase 1 scope only. For Phase 2 (bulk CSV tools) and Phase 3 (AI PDF extraction), see separate documents.*