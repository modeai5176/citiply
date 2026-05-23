create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  tagline text,
  banner_url text,
  logo_url text,
  brochure_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  slug text not null unique,
  category_id uuid not null references public.categories(id),
  collection_id uuid not null references public.collections(id),
  finish text,
  base_material text,
  size text,
  thickness text,
  color_tone text,
  applications text[] not null default '{}',
  short_description text,
  brochure_url text,
  seo_title text,
  seo_description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  thumbnail_url text not null,
  blur_data_url text not null,
  kind text not null check (kind in ('main', 'closeup', 'application', 'texture')),
  sort_order integer not null default 0
);

create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  spec_name text not null,
  spec_value text not null,
  sort_order integer not null default 0
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  whatsapp text,
  firm text,
  city text not null,
  product_code text,
  quantity text,
  message text,
  status text not null default 'pending'
);

create table if not exists public.enquiry_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  whatsapp text,
  firm text,
  city text not null,
  message text,
  status text not null default 'pending'
);

create table if not exists public.enquiry_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.enquiry_sessions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_code text not null,
  product_name text not null,
  collection_name text,
  category_name text,
  quantity text,
  note text
);

alter table public.collections add column if not exists tagline text;
alter table public.collections add column if not exists logo_url text;
alter table public.collections add column if not exists is_active boolean default true;

alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists brochure_url text;
alter table public.products add column if not exists is_active boolean default true;
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists applications text[];

alter table public.product_images add column if not exists blur_data_url text;
alter table public.product_images add column if not exists thumbnail_url text;
alter table public.product_images add column if not exists sort_order int4 default 0;

alter table public.quote_requests add column if not exists status text default 'pending';
alter table public.quote_requests add column if not exists whatsapp text;
alter table public.quote_requests add column if not exists firm text;
alter table public.quote_requests add column if not exists quantity text;

alter table public.categories add column if not exists sort_order int4 default 0;
alter table public.categories add column if not exists is_active boolean default true;

alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_specs enable row level security;
alter table public.quote_requests enable row level security;
alter table public.enquiry_sessions enable row level security;
alter table public.enquiry_items enable row level security;

drop policy if exists public_read_categories on public.categories;
create policy public_read_categories on public.categories for select using (is_active = true);
drop policy if exists public_read_collections on public.collections;
create policy public_read_collections on public.collections for select using (is_active = true);
drop policy if exists public_read_products on public.products;
create policy public_read_products on public.products for select using (is_active = true);
drop policy if exists public_read_product_images on public.product_images;
create policy public_read_product_images on public.product_images for select using (true);
drop policy if exists public_read_product_specs on public.product_specs;
create policy public_read_product_specs on public.product_specs for select using (true);
drop policy if exists public_insert_quotes on public.quote_requests;
create policy public_insert_quotes on public.quote_requests for insert with check (true);
drop policy if exists admin_all_categories on public.categories;
create policy admin_all_categories on public.categories for all using (auth.role() = 'authenticated');
drop policy if exists admin_all_collections on public.collections;
create policy admin_all_collections on public.collections for all using (auth.role() = 'authenticated');
drop policy if exists admin_all_products on public.products;
create policy admin_all_products on public.products for all using (auth.role() = 'authenticated');
drop policy if exists admin_all_images on public.product_images;
create policy admin_all_images on public.product_images for all using (auth.role() = 'authenticated');
drop policy if exists admin_all_specs on public.product_specs;
create policy admin_all_specs on public.product_specs for all using (auth.role() = 'authenticated');
drop policy if exists admin_read_quotes on public.quote_requests;
create policy admin_read_quotes on public.quote_requests for select using (auth.role() = 'authenticated');
drop policy if exists public_insert_enquiry_sessions on public.enquiry_sessions;
create policy public_insert_enquiry_sessions on public.enquiry_sessions for insert with check (true);
drop policy if exists public_insert_enquiry_items on public.enquiry_items;
create policy public_insert_enquiry_items on public.enquiry_items for insert with check (true);
drop policy if exists admin_all_enquiry_sessions on public.enquiry_sessions;
create policy admin_all_enquiry_sessions on public.enquiry_sessions for all using (auth.role() = 'authenticated');
drop policy if exists admin_all_enquiry_items on public.enquiry_items;
create policy admin_all_enquiry_items on public.enquiry_items for all using (auth.role() = 'authenticated');

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.collections, public.products, public.product_images, public.product_specs to anon, authenticated, service_role;
grant insert on public.quote_requests to anon, authenticated, service_role;
grant insert on public.enquiry_sessions, public.enquiry_items to anon, authenticated, service_role;
grant select, insert, update, delete on public.categories, public.collections, public.products, public.product_images, public.product_specs, public.quote_requests, public.enquiry_sessions, public.enquiry_items to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
