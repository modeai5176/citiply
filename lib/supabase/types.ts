export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type DbRecord = Record<string, unknown>;

type Table<Row extends DbRecord, Insert extends DbRecord, Update extends DbRecord = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type CatalogueRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
} & DbRecord;

export type CategoryRow = {
  id: string;
  catalogue_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
} & DbRecord;

export type CollectionRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  banner_url: string | null;
  logo_url: string | null;
  brochure_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
} & DbRecord;

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category_id: string;
  collection_id: string;
  finish: string | null;
  base_material: string | null;
  size: string | null;
  thickness: string | null;
  color_tone: string | null;
  applications: string[] | null;
  short_description: string | null;
  brochure_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  created_at: string;
} & DbRecord;

export type ProductImageRow = {
  id: string;
  product_id: string;
  image_url: string;
  thumbnail_url: string;
  blur_data_url: string | null;
  kind: "main" | "closeup" | "application" | "texture";
  sort_order: number;
} & DbRecord;

export type ProductSpecRow = {
  id: string;
  product_id: string;
  spec_name: string;
  spec_value: string;
  sort_order: number;
} & DbRecord;

export type QuoteRequestRow = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  firm: string | null;
  city: string;
  product_code: string | null;
  quantity: string | null;
  message: string | null;
  status: "pending" | "contacted" | "closed" | string;
} & DbRecord;

export type ProjectRow = {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  category: string | null;
  concept: string | null;
  hero_image: string | null;
  gallery: Json | null;
  recommended_materials: Json | null;
  veneer_tones: Json | null;
  fluted_panels: Json | null;
  doors: Json | null;
  laminates: Json | null;
  sort_order: number;
  is_active: boolean;
} & DbRecord;

export type ProjectLeadRow = {
  id: string;
  created_at: string;
  project_type: string | null;
  city: string | null;
  required_materials: string | null;
  finish_mood: string | null;
  timeline: string | null;
  attachment_url: string | null;
  phone: string;
  email: string;
  status: "pending" | "contacted" | "closed" | string;
} & DbRecord;

export type EnquirySessionRow = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  firm: string | null;
  city: string;
  message: string | null;
  status: "pending" | "contacted" | "closed" | string;
} & DbRecord;

export type EnquiryItemRow = {
  id: string;
  session_id: string;
  product_id: string | null;
  product_code: string;
  product_name: string;
  collection_name: string | null;
  category_name: string | null;
  quantity: string | null;
  note: string | null;
} & DbRecord;

export type CatalogueInsert = Omit<CatalogueRow, "id" | "created_at"> & { id?: string; created_at?: string };
export type CategoryInsert = Omit<CategoryRow, "id" | "created_at"> & { id?: string; created_at?: string };
export type CollectionInsert = Omit<CollectionRow, "id" | "created_at"> & { id?: string; created_at?: string };
export type ProductInsert = Omit<ProductRow, "id" | "created_at"> & { id?: string; created_at?: string };
export type ProductImageInsert = Omit<ProductImageRow, "id"> & { id?: string };
export type ProductSpecInsert = Omit<ProductSpecRow, "id"> & { id?: string };
export type QuoteRequestInsert = Omit<QuoteRequestRow, "id" | "created_at" | "status"> & {
  id?: string;
  created_at?: string;
  status?: string;
};
export type ProjectInsert = Omit<ProjectRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};
export type ProjectLeadInsert = Omit<ProjectLeadRow, "id" | "created_at" | "status"> & {
  id?: string;
  created_at?: string;
  status?: string;
};
export type EnquirySessionInsert = Omit<EnquirySessionRow, "id" | "created_at" | "status"> & {
  id?: string;
  created_at?: string;
  status?: string;
};
export type EnquiryItemInsert = Omit<EnquiryItemRow, "id"> & { id?: string };

export type Database = {
  public: {
    Tables: {
      catalogues: Table<CatalogueRow, CatalogueInsert>;
      categories: Table<CategoryRow, CategoryInsert>;
      collections: Table<CollectionRow, CollectionInsert>;
      products: Table<ProductRow, ProductInsert>;
      product_images: Table<ProductImageRow, ProductImageInsert>;
      product_specs: Table<ProductSpecRow, ProductSpecInsert>;
      quote_requests: Table<QuoteRequestRow, QuoteRequestInsert>;
      project_leads: Table<ProjectLeadRow, ProjectLeadInsert>;
      projects: Table<ProjectRow, ProjectInsert>;
      enquiry_sessions: Table<EnquirySessionRow, EnquirySessionInsert>;
      enquiry_items: Table<EnquiryItemRow, EnquiryItemInsert>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
