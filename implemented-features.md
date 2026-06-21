# Citiply - Implemented Features Documentation

This document outlines all the features and capabilities currently implemented in the Citiply Premium Digital Catalogue Platform.

## 1. Public Frontend (User-Facing)

The public site is a high-performance, SEO-friendly catalogue designed for trade professionals (architects, interior designers, builders). It serves as a product discovery and lead capture platform.

### Core Pages & Navigation
- **Home Page (`/`)**: Features a full-viewport hero slider showcasing featured collections, a category grid, and a centralized Universal Search bar.
- **Categories Hub (`/categories`)**: Displays all top-level product categories (e.g., Natural Veneers, Wall Panels).
- **Collections View (`/collections/[slug]`)**: Dedicated pages for product ranges with banner images, collection logos, and "Download Brochure" CTAs.
- **Product Listings (`/categories/[slug]`)**: A 4-column filterable grid layout with horizontal filter chips. Implements pagination and thumbnail optimization.
- **Product Detail Pages (`/products/[slug]`)**: Comprehensive product view including:
  - Monospace SKU badges and collection breadcrumbs.
  - Interactive image galleries (main, closeup, application, texture views) with thumbnail strips.
  - Dynamic spec grids (flexible key-value pairs).
  - Specific PDF brochure downloads per product.
- **Downloads Center (`/downloads`)**: A centralized page for downloading all categorized brochures and catalogue PDFs.
- **About & Contact (`/about`, `/contact`)**: Brand storytelling, showroom details, contact forms, and WhatsApp click-to-chat integration.
- **Mega-Menu Navigation**: Rich sticky header dropdowns showing collection previews, inline CTAs, and collection logos without requiring page loads.

## 2. Advanced Search & Lead Generation

### Universal Search (Real-time)
- **Global Search Component**: Available on the homepage and sticky header.
- **Debounced Instant Results**: As the user types (≥2 chars), a dropdown panel surfaces ranked results across categories, collections, and products.
- **Deep Searching**: Searches through names, SKUs, finish types, base materials, short descriptions, and even dynamic spec values.
- **Dedicated Search Page (`/search?q=...`)**: Full search results page with grouped categories, collections, and products for complex queries.
- Keyboard navigation (↑/↓/Enter) and loading skeletons included.

### Smart Multi-Product Enquiry System (Enquiry Cart)
- **"Add to Enquiry"**: Users can add multiple products from different collections to an Enquiry Cart while browsing.
- **Slide-in Enquiry Drawer**: A persistent UI element allowing users to review selected items, adjust quantities, and add specific notes per product.
- **Consolidated Submission**: Submits a single lead form containing all selected products, streamlining the UX for architects comparing multiple options.
- **Persistent State**: Powered by Zustand and `localStorage` to retain cart items across page reloads.
- **Quick Inquiry**: Legacy floating button/nav link for general (non-product specific) enquiries.

## 3. Admin Panel

A secure, fully functional admin dashboard protected by Supabase Authentication middleware, tailored for catalogue management.

- **Admin Dashboard (`/admin/dashboard`)**: Overview stats (Category/Collection/Product counts) and a quick view of the latest pending quote requests.
- **Category Management**: Modal-based CRUD interface to add/edit/delete categories, including image assignment.
- **Collection Management**: Manage collections, assign them to categories, and upload specific banner images and logos.
- **Product Management (`/admin/products`)**:
  - Full form editing for SKUs, names, materials, colors, and descriptions.
  - **Dynamic Specs Builder**: Add custom key-value pairs for varying product specifications.
  - **Multi-Image Uploader**: Upload and classify images (Main, Closeup, Application, Texture) for each product.
- **Quote & Enquiry Management (`/admin/quotes`)**: View incoming single-product quotes and multi-product enquiry sessions (linked with customer contact details).

## 4. Backend & Infrastructure

### Database Schema (Supabase PostgreSQL)
- Highly relational schema encompassing: `categories`, `collections`, `products`, `product_images`, `product_specs`, `quote_requests`, `enquiry_sessions`, and `enquiry_items`.
- **Row Level Security (RLS)**: Public tables are restricted to active records for reads; write operations and full access are locked to authenticated admins only.

### Media Pipeline (AWS S3 & Sharp)
- **S3 Integration**: Direct uploading to Amazon S3 buckets via `@aws-sdk/client-s3`.
- **Image Optimization**: Automated backend pipeline using `sharp` to process uploaded images into:
  - High-res WebP (`1200px` width, 85 quality) for main views.
  - Thumbnails (`400px` width) for listing grids.
  - Base64 blur placeholders (`20px`) for Next.js `next/image` graceful loading.

### Technology Stack
- **Framework**: Next.js 14 (App Router) with TypeScript.
- **Styling**: Tailwind CSS with hardcoded design system tokens (matching Natural Veneers aesthetic).
- **State Management**: Zustand (for the Enquiry Cart).
- **Forms & Validation**: React Hook Form + Zod.
- **Animation**: Framer Motion for smooth route transitions and micro-interactions.
