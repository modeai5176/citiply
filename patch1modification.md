# Phase 1 — Complete System Patch Prompt
### Fix everything, wire real data, seed the catalogue, upgrade admin UI

> **Context:** Phase 1 frontend (public site) is working and looks good — keep it.
> The admin dashboard exists but is broken: mock data only, forms don't open, no
> Supabase reads/writes, no image uploads wired. This prompt fixes all of that,
> seeds the real catalogue data, and delivers a fully working system end to end.

---

## What you are fixing / building

| Area | Status | Action |
|---|---|---|
| Public frontend (user-facing) | ✅ Working, looks good | **Keep as-is, do not touch** |
| Admin dashboard stats | ❌ Mock data | Wire to real Supabase counts |
| Admin quote requests table | ❌ Mock data | Fetch from `quote_requests` table |
| Admin Categories CRUD | ❌ Forms don't open | Fix modal, wire Supabase insert/update/delete |
| Admin Collections CRUD | ❌ Forms don't open | Fix modal, wire Supabase insert/update/delete |
| Admin Products CRUD | ❌ Forms don't open | Fix modal, wire Supabase insert/update/delete |
| Image upload (all forms) | ❌ Not wired | Replace Cloudflare R2 → Amazon S3, wire upload |
| Real data seed | ❌ Empty DB | Insert all collections + products from CSV + catalogue |
| Placeholder images | ❌ None | Use Unsplash URLs (5–6 repeated per category) |
| Database schema | ⚠️ Partial | Ensure all fields from schema diagram exist |

---

## Part 1 — Database schema (confirm + patch)

The Supabase schema diagram shows these tables. Verify all columns exist exactly as listed.
Run the SQL below to patch any missing columns — do not recreate tables, use `ALTER TABLE IF NOT EXISTS`.

```sql
-- Confirm collections has tagline and logo_url
ALTER TABLE collections ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Confirm products has all needed fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brochure_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description text;
-- applications is text[] array in schema — verify it exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS applications text[];

-- Confirm product_images uses 'kind' column (not 'image_type')
-- Schema diagram shows: id, product_id, image_url, thumbnail_url, blur_data_url, kind, sort_order
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS blur_data_url text;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS sort_order int4 DEFAULT 0;

-- Confirm quote_requests has status column
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS firm text;
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS quantity text;

-- Confirm categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order int4 DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- RLS: ensure public can read active records
-- Run these in Supabase SQL editor
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public_read_categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "public_read_collections" ON collections FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "public_read_products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "public_read_product_images" ON product_images FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_product_specs" ON product_specs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_insert_quotes" ON quote_requests FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "admin_all_categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "admin_all_collections" ON collections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "admin_all_products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "admin_all_images" ON product_images FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "admin_all_specs" ON product_specs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "admin_read_quotes" ON quote_requests FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Part 2 — Replace Cloudflare R2 with Amazon S3

Remove all Cloudflare R2 code. Replace with AWS S3 using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

### Install

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Environment variables to add to `.env.local`

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
NEXT_PUBLIC_S3_BASE_URL=https://your-bucket-name.s3.ap-south-1.amazonaws.com
```

### Replace `lib/r2.ts` with `lib/s3.ts`

```typescript
// lib/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL!;

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));
  return `${S3_BASE_URL}/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  }));
}

export interface ProcessedImage {
  imageUrl: string;
  thumbnailUrl: string;
  blurDataUrl: string;
}

export async function processAndUploadImage(
  fileBuffer: Buffer,
  folder: string,        // e.g. "products/fc4-black-gum"
  filename: string       // e.g. "main" (no extension)
): Promise<ProcessedImage> {
  // Main WebP — 1200px wide
  const mainBuffer = await sharp(fileBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  const imageUrl = await uploadToS3(mainBuffer, `${folder}/${filename}.webp`, 'image/webp');

  // Thumbnail — 400px wide
  const thumbBuffer = await sharp(fileBuffer)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbnailUrl = await uploadToS3(thumbBuffer, `${folder}/${filename}_thumb.webp`, 'image/webp');

  // Blur placeholder — 20px wide, base64
  const blurBuffer = await sharp(fileBuffer)
    .resize({ width: 20 })
    .webp({ quality: 60 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

  return { imageUrl, thumbnailUrl, blurDataUrl };
}
```

### Update `/api/upload/route.ts` to use S3

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processAndUploadImage, uploadToS3 } from '@/lib/s3';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const folder = formData.get('folder') as string || 'uploads';
  const filename = formData.get('filename') as string || 'file';
  const type = formData.get('type') as string || 'image'; // 'image' | 'pdf'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  if (type === 'pdf') {
    const key = `${folder}/${filename}.pdf`;
    const url = await uploadToS3(buffer, key, 'application/pdf');
    return NextResponse.json({ url });
  }

  // Image: run Sharp pipeline
  const result = await processAndUploadImage(buffer, folder, filename);
  return NextResponse.json(result);
}
```

---

## Part 3 — Admin dashboard — wire real Supabase data

### Fix `/admin/dashboard` — real counts + real quotes

```typescript
// app/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { count: categoryCount },
    { count: collectionCount },
    { count: productCount },
    { count: pendingCount },
    { data: recentQuotes },
  ] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('collections').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('quote_requests')
      .select('id, created_at, full_name, product_code, city, phone, status')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // Render stats cards + quotes table
  // Stats: categoryCount, collectionCount, productCount, pendingCount
  // Table: recentQuotes with columns: Date, Name, Product Code, City, Phone
}
```

---

## Part 4 — Admin CRUD — fix all forms

The core problem: forms are not opening when "Add" buttons are clicked.

### Pattern to fix across ALL admin pages

Each admin list page (categories, collections, products) must follow this pattern:

```typescript
'use client';
import { useState } from 'react';
import { CategoryForm } from '@/components/admin/CategoryForm'; // or CollectionForm, ProductForm

export default function CategoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [items, setItems] = useState<Category[]>([]); // fetched on mount

  // Fetch on mount
  useEffect(() => { fetchCategories().then(setItems); }, []);

  const handleAdd = () => { setEditItem(null); setIsFormOpen(true); };
  const handleEdit = (item: Category) => { setEditItem(item); setIsFormOpen(true); };
  const handleClose = () => { setIsFormOpen(false); setEditItem(null); };
  const handleSaved = () => { fetchCategories().then(setItems); handleClose(); };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button onClick={handleAdd} className="btn-primary">+ Add Category</button>
      </div>

      <DataTable
        data={items}
        onEdit={handleEdit}
        onDelete={async (id) => { await deleteCategory(id); fetchCategories().then(setItems); }}
      />

      {/* MODAL — this is what was missing */}
      {isFormOpen && (
        <Modal onClose={handleClose}>
          <CategoryForm
            initial={editItem}
            onSaved={handleSaved}
            onCancel={handleClose}
          />
        </Modal>
      )}
    </>
  );
}
```

Apply this exact same pattern for Collections and Products pages.

### Modal component (if not already correct)

```typescript
// components/ui/Modal.tsx
'use client';
import { useEffect } from 'react';

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
```

---

## Part 5 — Admin form components (wire to Supabase)

### CategoryForm

```typescript
// components/admin/CategoryForm.tsx
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { ImageUploadField } from './ImageUploadField';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers and hyphens only'),
  description: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export function CategoryForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Category | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || '',
      slug: initial?.slug || '',
      description: initial?.description || '',
      sort_order: initial?.sort_order || 0,
      is_active: initial?.is_active ?? true,
    },
  });

  // Auto-generate slug from name
  const name = watch('name');
  const autoSlug = () => {
    setValue('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...data, image_url: imageUrl };
      if (initial) {
        const { error } = await supabase.from('categories').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-semibold">{initial ? 'Edit' : 'Add'} Category</h2>

      <div>
        <label className="form-label">Name *</label>
        <input {...register('name')} className="form-input" onBlur={!initial ? autoSlug : undefined} />
        {errors.name && <p className="form-error">{errors.name.message}</p>}
      </div>

      <div>
        <label className="form-label">Slug *</label>
        <input {...register('slug')} className="form-input font-mono text-sm" />
        {errors.slug && <p className="form-error">{errors.slug.message}</p>}
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea {...register('description')} className="form-input" rows={3} />
      </div>

      <div>
        <label className="form-label">Category Image</label>
        <ImageUploadField
          value={imageUrl}
          onChange={setImageUrl}
          folder="categories"
          filename={watch('slug') || 'category'}
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" {...register('is_active')} id="is_active" />
        <label htmlFor="is_active" className="text-sm">Active (visible on site)</label>
      </div>

      {error && <p className="form-error bg-red-50 p-3 rounded">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? 'Saving...' : (initial ? 'Save Changes' : 'Create Category')}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
      </div>
    </form>
  );
}
```

### CollectionForm (wire similarly — key extra fields)

Fields to include:
- `name`, `slug` (auto-generated), `category_id` (dropdown fetched from Supabase)
- `description`, `tagline`
- `banner_image_url` (ImageUploadField, folder: `collections/[slug]`, filename: `banner`)
- `logo_url` (ImageUploadField, folder: `collections/[slug]`, filename: `logo`)
- `brochure_url` (PDF upload — use `/api/upload` with type=pdf)
- `is_featured` (checkbox), `is_active` (checkbox)

Supabase insert/update to `collections` table. On category dropdown, fetch:
```typescript
const { data: categories } = await supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order');
```

### ProductForm (the most complex — wire all fields)

Fields:
- `sku` (text, required, unique — validate uniqueness on blur via Supabase `.eq('sku', value)`)
- `name`, `slug` (auto from name)
- `category_id` (dropdown), `collection_id` (dropdown — filter by selected category)
- `finish`, `base_material`, `size`, `thickness`, `color_tone`
- `applications` (multi-tag input — array of strings, comma-separated or chip input)
- `short_description` (textarea)
- `brochure_url` (PDF upload)
- `is_active`, `seo_title`, `seo_description`
- **Dynamic specs section:** list of [spec_name, spec_value] pairs with Add/Remove Row buttons
  - Save to `product_specs` table after saving product
- **Images section:** multi-image uploader
  - Each image has: file input + `kind` dropdown (main / closeup / application / texture)
  - On upload: call `/api/upload` → get back `imageUrl`, `thumbnailUrl`, `blurDataUrl`
  - Save to `product_images` table after saving product

Save flow:
1. Upsert to `products` table → get product `id`
2. If new specs added: insert to `product_specs` where `product_id = id`
3. If images uploaded: insert to `product_images` where `product_id = id`
4. If editing: delete old specs and re-insert; handle image additions/deletions separately

### ImageUploadField component

```typescript
// components/admin/ImageUploadField.tsx
'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  filename: string;
  label?: string;
}

export function ImageUploadField({ value, onChange, folder, filename }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', folder);
      form.append('filename', filename);
      form.append('type', 'image');

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const { imageUrl } = await res.json();
      onChange(imageUrl);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
          <Image src={value} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >×</button>
        </div>
      )}
      <div
        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {uploading ? (
          <p className="text-sm text-muted">Uploading...</p>
        ) : (
          <p className="text-sm text-muted">Click or drag image here</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

---

## Part 6 — Seed data

Create a seed script at `scripts/seed.ts`. Run with `npx tsx scripts/seed.ts`.

### Unsplash image pool (use these 6 URLs — repeat across products)

```typescript
// scripts/seed.ts — image pool per category
const IMAGES = {
  veneer: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',   // wood texture
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1200', // wood grain close
    'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=1200', // walnut panel
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1200', // light wood
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200',   // dark veneer
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200', // wood interior
  ],
  panels: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200', // fluted wall
    'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200', // panel wall
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200', // interior wall
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200', // modern interior
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200', // dark interior
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200', // luxury interior
  ],
};

// Rotate through pool by index
function getImage(pool: string[], index: number): string {
  return pool[index % pool.length];
}
```

### Collections to seed (from CSV + catalogue analysis)

```typescript
// All collections extracted from CSV + Fandeck PDF (Fandeck_Naturals_Turakhia_FC4.pdf)
// Brand: Turakhia Natural Veneers — Fandeck Collection 4
// Category mapping based on product types observed in catalogue

const CATEGORIES_SEED = [
  { name: 'Natural Veneers',    slug: 'natural-veneers',    description: 'Premium natural wood veneers from around the world', sort_order: 1 },
  { name: 'Exotic Veneers',     slug: 'exotic-veneers',     description: 'Rare and specialty exotic wood veneers', sort_order: 2 },
  { name: 'Wall Panels',        slug: 'wall-panels',        description: 'Decorative fluted and groove wall panels', sort_order: 3 },
  { name: 'Specialty Series',   slug: 'specialty-series',   description: 'Unique surface treatment series', sort_order: 4 },
  { name: 'Coloured Veneers',   slug: 'coloured-veneers',   description: 'Pre-finished coloured and dyed veneers', sort_order: 5 },
  { name: 'Textured Veneers',   slug: 'textured-veneers',   description: 'Rough cut, torched, and weathered surfaces', sort_order: 6 },
  { name: 'Premium Collections',slug: 'premium-collections',description: 'Curated premium veneer collections', sort_order: 7 },
];

// Collections grouped by category (from CSV rows)
const COLLECTIONS_SEED = [
  // Natural Veneers category
  {
    name: 'Natural Veneers', slug: 'natural-veneers-range',
    category_slug: 'natural-veneers',
    tagline: 'Real wood. Timeless grain.',
    description: 'A wide selection of natural wood veneers spanning light to dark tones — Maple, Cherry, Oak, Rosewood and more.',
  },
  {
    name: 'Evergreen Series', slug: 'evergreen-series',
    category_slug: 'natural-veneers',
    tagline: 'The classics. Always.',
    description: 'Timeless species — Teak, Walnut, Rosewood, Ebony — available year-round in consistent quality.',
  },
  // Exotic Veneers category
  {
    name: 'Founders Collection 4', slug: 'founders-collection-4',
    category_slug: 'exotic-veneers',
    tagline: 'A landmark in veneering. Since 1992.',
    description: 'FC4 marks 25 years of Turakhia Natural Veneers. 30 rare species — Black Gum, Indian Rosewood, Macassar Ebony, Wenge and more. A real wood collection for discerning designers.',
  },
  {
    name: 'FIERO', slug: 'fiero',
    category_slug: 'exotic-veneers',
    tagline: 'Smoke. Fire. Depth.',
    description: 'Rare exotic species with extraordinary grain and character. Koa, Cocobolo, Sassafras, Raintree and more.',
  },
  {
    name: 'NSD & Hand Picked Veneers', slug: 'nsd-hand-picked',
    category_slug: 'exotic-veneers',
    tagline: 'Handpicked. Irreplaceable.',
    description: 'Individually selected rare veneers. Each leaf is unique — sourced and curated by expert craftsmen.',
  },
  // Textured Veneers category
  {
    name: 'Weathered', slug: 'weathered',
    category_slug: 'textured-veneers',
    tagline: 'Time-worn. Authentically aged.',
    description: 'Veneers with the character of aged, weathered wood. Organic textures that add depth and history to spaces.',
  },
  {
    name: 'RoughCut', slug: 'roughcut',
    category_slug: 'textured-veneers',
    tagline: 'Raw grain. Honest surface.',
    description: 'Unique substitute for sawn lumber paneling. Eco-friendly, cost-efficient, 0.8mm thickness. No sanding required.',
  },
  {
    name: 'Torched', slug: 'torched',
    category_slug: 'textured-veneers',
    tagline: 'Fire-kissed grain.',
    description: 'Charcoal, flamed and torched finishes for dramatic textural impact. Each surface tells a story of fire and wood.',
  },
  {
    name: 'Volcano', slug: 'volcano',
    category_slug: 'textured-veneers',
    tagline: 'Diagonal drama.',
    description: 'Extension of Rough Cut — grain undulations run diagonal, creating an optical illusion of profiled solid wood paneling.',
  },
  // Specialty Series category
  {
    name: 'Burl', slug: 'burl',
    category_slug: 'specialty-series',
    tagline: 'Nature\'s rare formations.',
    description: 'Vavona Burl, Walnut Burl, Elm Burl, Maple Burl and more. Each burl veneer is a one-of-a-kind work of nature.',
  },
  {
    name: 'Metallico', slug: 'metallico',
    category_slug: 'specialty-series',
    tagline: 'Dark metal aesthetic.',
    description: 'Deep, rich surfaces with metallic undertones — Black Oak, Blackstone, Flame Koa and more for statement interiors.',
  },
  // Coloured Veneers category
  {
    name: 'FADED', slug: 'faded',
    category_slug: 'coloured-veneers',
    tagline: 'Soft colour. Natural base.',
    description: 'Dyed veneers with a faded, antique-inspired palette — Antic Oak, Blue Moon, Dyed Sycamore and more.',
  },
  {
    name: 'THUNDER', slug: 'thunder',
    category_slug: 'coloured-veneers',
    tagline: 'Gold. Drama. Precision.',
    description: 'Gold inlay and acrylico series — Coffeetree, Coffeebin, Sassafras. Luxury surfaces for the most demanding projects.',
  },
];

// Products per collection — map directly from CSV
const PRODUCTS_BY_COLLECTION: Record<string, string[]> = {
  'founders-collection-4': ['Black Gum','Indian Rosewood','Macassar Ebony','Wenge','Barbasco','Yewtree','Santos Rosewood','Rosso','Ontano Rosso','Stonewood','Zericoted','Sucupira','Ipe','Spilted','American Walnut','Indian Walnut','European Walnut','Lacewood','Zebrano','Bocote','Sassnero','Riverwood','Spalted Teak','Burmese Teak','Golden Wenge','Anigre Figured','Eucalyptus Figured','Anigre','White Oak'],
  'evergreen-series': ['Teak','Walnut','Rosewood','Ebony'],
  'natural-veneers-range': ['American Maple','Chestnut','Sycamore','Ash','Hackberry','Poplar','Birds Eye Maple','Larch','Rivertree','Beech','Lebanese Cedar','Plaintree','Red Oak','Roseheart','Kevasingo','Sapeli','European Cherry','African Mahogany','African Cherry','Red Cedar','Padauk','Sapeli Pomele','Eucalyptus Pommele'],
  'fiero': ['Exotic Ebony Oak','Patternwood Figured','Sassafras','Thinwin','Patternwood Pommele','Koa','Teatree','Saddle Tree','Raintree','Rainwood','Yewwood','Black Alder','Jamire','Cocobolo','Kossipo','Kossipo Pomele','Arc','Sasswood','Pearwood','Barwood','Sapgum','Coffeebin','Zitrone','Thermo Robusta','Bolivian'],
  'weathered': ['Laura Petro','Exotic Bugged Oak','Bugged Oak','Mexican Laurel','Ironwood','Robusta','Blackwood','Brown Laurel','Izombe','Golden Patternwood','Bog Elm','Bog Ash','Tan Oak','Winewood','Cottonwood','Crispa','Nyssa','Kelloggi','Bur Oak','Coralbean','Cordia Burl','Cocoplum','Black Locust','Ironbark','Tomentosa','Pin Oak','Voilet Armani','Calabash Burl','Coccinea','Cowania','Plicata','Ginko','Japonica','Bolivier','Grey Armani','Sand Bolivier'],
  'roughcut': ['Rough Ebony Oak','Rough Teatree','Rough Bur Oak','Rough Cocoplum','Rough Yewwood','Rough Coreal','Exotic Rough Bugged Oak','Rough American Walnut','Rough Bugged Oak','Rough Burmese Teak','Rough Kossipo','Rough Sapeli','Rough White Oak','Rough Ash','Rough Olive Beech'],
  'volcano': ['Volcano Yewwood','Volcano Bugged Oak','Volcano Kossipo'],
  'burl': ['Firoze Oak','Firoze Mappa Burl','Vavona Burl','Walnut Burl','Elm Burl','Maple Burl','Olive Ash Burl','White Oak Burl','Poplar Burl'],
  'metallico': ['Black Oak','Blackstone','Blacknut','Blacktree','Flame Koa','Cocotree','Choconut','Flame Larch','Limed Oak','Choco Eucalyptus Figured','Choco Birds Eye Maple','Choco Ash Burl','Choco Poplar Burl'],
  'torched': ['Torched Charcoal Oak','Torched Hagburry','Torched Eucalyptus Figured','Torched Ironwood','Torched Tanned Oak','Torched Yewtree','Torched Flame Larch','Torched Flamed Oak','Torched Tamo Ash','Torched Poplar Burl','Torched Flamed Oak Burl','Torched Exotic Rough White Oak','Torched Elm','Torched Maple','Torched Sycamore','Torched Ash','Torched Birch','Torched Beech','Torched Red Oak','Torched Sapeli'],
  'faded': ['Faded Antic Oak','Faded Blue Moon','Faded Dyed Sycamore','Faded Dyed Ash','Faded Dyed Beech','Faded Dyed Mahogany'],
  'thunder': ['Gold Inlay Coffeetree','Gold Inlay Coffeebin','Gold Inlay Sassafras','Acrylico Blackstone','Acrylico Sassafras'],
};
```

### Full seed script logic

```typescript
// scripts/seed.ts — complete logic

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // use service role for seeding (bypasses RLS)
);

// Spec templates per category
function getSpecsForCollection(collectionSlug: string) {
  const veneerSpecs = [
    { spec_name: 'Thickness', spec_value: '0.6mm' },
    { spec_name: 'Standard Size', spec_value: '8ft x 4ft' },
    { spec_name: 'Species Type', spec_value: 'Natural Wood' },
    { spec_name: 'Surface', spec_value: 'Unfinished' },
    { spec_name: 'Application', spec_value: 'Furniture, Wall Paneling, Doors, Cabinets' },
  ];
  const roughcutSpecs = [
    { spec_name: 'Thickness', spec_value: '0.8mm' },
    { spec_name: 'Standard Size', spec_value: '8ft x 4ft' },
    { spec_name: 'Surface', spec_value: 'Rough Cut — No Sanding' },
    { spec_name: 'Application', spec_value: 'Rustic Interiors, Feature Walls' },
  ];
  if (['roughcut','volcano'].includes(collectionSlug)) return roughcutSpecs;
  return veneerSpecs;
}

// SKU generator: collection prefix + index
function generateSku(collectionSlug: string, productName: string, index: number): string {
  const prefix = collectionSlug.replace(/-/g, '').substring(0, 4).toUpperCase();
  const suffix = String(index + 1).padStart(3, '0');
  return `${prefix}-${suffix}`;
}

async function seed() {
  console.log('🌱 Seeding categories...');

  // 1. Insert categories
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES_SEED) {
    const imageIdx = CATEGORIES_SEED.indexOf(cat);
    const { data, error } = await supabase
      .from('categories')
      .upsert({ ...cat, image_url: getImage(IMAGES.veneer, imageIdx) }, { onConflict: 'slug' })
      .select('id, slug')
      .single();
    if (error) { console.error('Category error:', error); continue; }
    categoryMap[cat.slug] = data.id;
    console.log(`  ✓ Category: ${cat.name}`);
  }

  // 2. Insert collections
  console.log('\n🌱 Seeding collections...');
  const collectionMap: Record<string, string> = {};
  for (const col of COLLECTIONS_SEED) {
    const categoryId = categoryMap[col.category_slug];
    if (!categoryId) { console.warn(`  ⚠ No category for ${col.name}`); continue; }
    const imageIdx = COLLECTIONS_SEED.indexOf(col);
    const { data, error } = await supabase
      .from('collections')
      .upsert({
        name: col.name,
        slug: col.slug,
        category_id: categoryId,
        tagline: col.tagline,
        description: col.description,
        banner_url: getImage(IMAGES.veneer, imageIdx),
        logo_url: null,
        brochure_url: null,
        is_featured: imageIdx < 4,  // first 4 are featured
        is_active: true,
      }, { onConflict: 'slug' })
      .select('id, slug')
      .single();
    if (error) { console.error('Collection error:', error); continue; }
    collectionMap[col.slug] = data.id;
    console.log(`  ✓ Collection: ${col.name}`);
  }

  // 3. Insert products for each collection
  console.log('\n🌱 Seeding products...');
  for (const [collectionSlug, productNames] of Object.entries(PRODUCTS_BY_COLLECTION)) {
    const collectionId = collectionMap[collectionSlug];
    if (!collectionId) { console.warn(`  ⚠ No collection ID for slug: ${collectionSlug}`); continue; }

    // Get category_id from collection
    const { data: colData } = await supabase
      .from('collections')
      .select('category_id')
      .eq('id', collectionId)
      .single();

    for (let i = 0; i < productNames.length; i++) {
      const name = productNames[i];
      const sku = generateSku(collectionSlug, name, i);
      const slug = `${collectionSlug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const imageUrl = getImage(IMAGES.veneer, i);
      const specs = getSpecsForCollection(collectionSlug);

      // Insert product
      const { data: product, error: prodError } = await supabase
        .from('products')
        .upsert({
          sku,
          name,
          slug,
          category_id: colData?.category_id,
          collection_id: collectionId,
          finish: 'Unfinished',
          base_material: 'Natural Wood',
          size: '8ft x 4ft',
          thickness: '0.6mm',
          color_tone: 'Natural',
          applications: ['Furniture', 'Wall Paneling', 'Doors', 'Cabinets'],
          short_description: `Premium ${name} veneer from the ${COLLECTIONS_SEED.find(c => c.slug === collectionSlug)?.name} range.`,
          is_active: true,
          seo_title: `${name} Veneer | ${COLLECTIONS_SEED.find(c => c.slug === collectionSlug)?.name}`,
          seo_description: `Buy ${name} veneer sheets. Premium quality natural wood veneer.`,
        }, { onConflict: 'sku' })
        .select('id')
        .single();

      if (prodError) { console.error(`Product error (${name}):`, prodError); continue; }

      // Insert product image
      await supabase.from('product_images').upsert({
        product_id: product.id,
        image_url: imageUrl,
        thumbnail_url: imageUrl.replace('w=1200', 'w=400'),
        blur_data_url: null,
        kind: 'main',
        sort_order: 0,
      }, { onConflict: 'product_id,kind' }).catch(() => {});

      // Insert specs
      for (const spec of specs) {
        await supabase.from('product_specs').upsert({
          product_id: product.id,
          spec_name: spec.spec_name,
          spec_value: spec.spec_value,
        }, { onConflict: 'product_id,spec_name' }).catch(() => {});
      }
    }
    console.log(`  ✓ ${productNames.length} products in ${collectionSlug}`);
  }

  console.log('\n✅ Seed complete!');
}

seed().catch(console.error);
```

Add to `package.json`:
```json
"scripts": {
  "seed": "dotenv -e .env.local -- npx tsx scripts/seed.ts"
}
```

Install: `npm install dotenv tsx --save-dev`

Run: `npm run seed`

---

## Part 7 — Admin Products page improvements

The admin products page must have:

### 1. Search and filter bar
```typescript
// Real-time search in admin products list
const [search, setSearch] = useState('');
const [collectionFilter, setCollectionFilter] = useState('');

const filtered = products.filter(p =>
  (p.sku.toLowerCase().includes(search.toLowerCase()) ||
   p.name.toLowerCase().includes(search.toLowerCase())) &&
  (!collectionFilter || p.collection_id === collectionFilter)
);
```

### 2. Bulk publish/unpublish
```typescript
const [selected, setSelected] = useState<string[]>([]);

const bulkPublish = async (active: boolean) => {
  await supabase.from('products').update({ is_active: active }).in('id', selected);
  setSelected([]);
  refetch();
};
```

### 3. Status badge in table
Each row shows: SKU (monospace), Name, Collection, Active (green/grey pill), Edit button, Delete button.

---

## Part 8 — Admin Quotes page

```typescript
// Full quotes management
export default function QuotesPage() {
  // Fetch all quotes with product info
  const { data } = await supabase
    .from('quote_requests')
    .select(`
      *,
      products (name, sku, collections(name))
    `)
    .order('created_at', { ascending: false });

  // Table columns: Date, Name, Phone, Product Code, Product Name, Collection, City, Status
  // Click row to expand: firm, whatsapp, quantity, message
  // Status dropdown: pending → contacted → closed
  // Mark as contacted button
}
```

---

## Part 9 — API routes (ensure all are working)

### `/api/products` — with working filters

```typescript
// app/api/products/route.ts
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);

  const category = searchParams.get('category');
  const collection = searchParams.get('collection');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const from = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select(`
      id, sku, name, slug, finish, base_material, color_tone, thickness, is_active,
      product_images (image_url, thumbnail_url, blur_data_url, kind),
      collections (id, name, slug),
      categories (id, name, slug)
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('name')
    .range(from, from + limit - 1);

  if (category) query = query.eq('categories.slug', category);
  if (collection) query = query.eq('collection_id', collection);
  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    products: data,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
```

### `/api/quote` — working email + DB save

```typescript
// app/api/quote/route.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  // Validate with Zod
  const result = quoteSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues }, { status: 400 });

  const data = result.data;

  // Save to DB
  const { error: dbError } = await supabase.from('quote_requests').insert({
    full_name: data.name,
    phone: data.phone,
    whatsapp: data.whatsapp,
    firm: data.firm,
    city: data.city,
    product_code: data.productCode,
    quantity: data.quantity,
    message: data.message,
    status: 'pending',
  });
  if (dbError) return NextResponse.json({ error: 'Failed to save quote' }, { status: 500 });

  // Send email
  await resend.emails.send({
    from: 'quotes@yourdomain.com',
    to: [process.env.QUOTE_RECIPIENT_EMAIL!],
    subject: `New Quote Request — ${data.productCode || 'General'} — ${data.city}`,
    html: `
      <h2>New Quote Request</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td><b>Product Code</b></td><td>${data.productCode || '—'}</td></tr>
        <tr><td><b>Name</b></td><td>${data.name}</td></tr>
        <tr><td><b>Phone</b></td><td>${data.phone}</td></tr>
        <tr><td><b>WhatsApp</b></td><td>${data.whatsapp || '—'}</td></tr>
        <tr><td><b>Firm</b></td><td>${data.firm || '—'}</td></tr>
        <tr><td><b>City</b></td><td>${data.city}</td></tr>
        <tr><td><b>Quantity</b></td><td>${data.quantity || '—'}</td></tr>
        <tr><td><b>Message</b></td><td>${data.message || '—'}</td></tr>
      </table>
    `,
  });

  return NextResponse.json({ success: true });
}
```

---

## Part 10 — Checklist before marking Phase 1 complete

Work through this list top to bottom. Do not mark complete until each item is verified in the browser.

### Database
- [ ] All 7 categories in Supabase with `is_active = true`
- [ ] All 14 collections with `category_id` correctly set and images
- [ ] All ~190 products seeded with SKU, name, collection, specs, and at least one product_image row
- [ ] `quote_requests` table has `status`, `whatsapp`, `firm`, `quantity` columns

### Image storage (S3)
- [ ] `lib/s3.ts` replaces `lib/r2.ts` everywhere — no R2 imports remain
- [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, `NEXT_PUBLIC_S3_BASE_URL` in `.env.local`
- [ ] `/api/upload` route uses S3, returns `{ imageUrl, thumbnailUrl, blurDataUrl }`
- [ ] S3 bucket has `public-read` ACL or correct bucket policy for public image serving

### Admin dashboard
- [ ] Stats cards show real Supabase counts (not hardcoded numbers)
- [ ] Quote requests table shows real rows from DB
- [ ] Clicking any row in quotes table expands the full detail

### Admin Categories
- [ ] "+ Add Category" button opens a modal form (not a fixed right panel)
- [ ] Form has: Name, Slug (auto-generated, editable), Description, Image Upload, Sort Order, Active toggle
- [ ] Saving inserts to Supabase and refreshes the list
- [ ] Edit button populates form with existing data
- [ ] Delete button confirms and removes from DB
- [ ] Image upload uses `/api/upload` → S3

### Admin Collections
- [ ] "+ Add Collection" opens modal
- [ ] Category dropdown populated from Supabase
- [ ] Form has: Name, Slug, Category, Description, Tagline, Banner Image, Logo Image, Brochure PDF, Featured toggle, Active toggle
- [ ] Saving works end-to-end

### Admin Products
- [ ] Products list loads from Supabase
- [ ] Search by SKU or name works
- [ ] Filter by collection works
- [ ] "+ Add Product" opens modal/drawer with full form
- [ ] Full form: SKU, Name, Slug, Category, Collection (filtered by category), Finish, Base Material, Size, Thickness, Color Tone, Applications (chips), Short Description, SEO fields
- [ ] Dynamic specs section: add/remove key-value rows, saves to `product_specs`
- [ ] Image uploader in product form: drag-drop, kind selector, saves to `product_images`
- [ ] Bulk publish/unpublish checkboxes work
- [ ] Edit loads existing data including specs and images

### Public site (verify not broken by any admin changes)
- [ ] Homepage loads — hero, categories, featured collections visible
- [ ] Categories page shows all 7 categories with images
- [ ] Collection page shows products in grid
- [ ] Product detail page loads with specs, images, quote CTA
- [ ] Quote form submits → email received → success message shown
- [ ] Downloads page shows brochures (if any uploaded)

### Auth / Security
- [ ] `/admin/*` routes redirect to `/admin/login` when not authenticated
- [ ] Admin login form works with Supabase Auth credentials
- [ ] `/api/upload` returns 401 when called without session
- [ ] Service role key is ONLY in `scripts/seed.ts` and `SUPABASE_SERVICE_ROLE_KEY` env var — never in client code

---

## Environment variables summary

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # seed script only, never expose to client

# Amazon S3 (replaces Cloudflare R2)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=
NEXT_PUBLIC_S3_BASE_URL=       # e.g. https://your-bucket.s3.ap-south-1.amazonaws.com

# Email
RESEND_API_KEY=
QUOTE_RECIPIENT_EMAIL=         # where quote emails go

# App
NEXT_PUBLIC_APP_URL=           # e.g. https://yoursite.com
```

---

## Execution order

1. Run schema patch SQL in Supabase SQL editor
2. Set up S3 bucket — enable public read, set CORS for your domain
3. Replace `lib/r2.ts` with `lib/s3.ts`, update all imports
4. Update `/api/upload/route.ts` to use S3
5. Add env vars to `.env.local`
6. Run `npm run seed` — verify in Supabase table editor that data is there
7. Fix admin dashboard — wire real Supabase queries
8. Fix admin Categories — modal pattern, CRUD
9. Fix admin Collections — modal pattern, CRUD
10. Fix admin Products — modal pattern, full form, specs, images
11. Verify public site still loads correctly
12. Walk through the checklist top to bottom

---

*This document covers the complete Phase 1 patch. Public UI is preserved. Everything else is wired, seeded, and working.*