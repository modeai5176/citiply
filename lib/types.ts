export type Catalogue = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

// A Product Family (catalogue) with its second-level category filters nested in.
// Used to render the family-driven navigation (Family → Filter → Collection).
export type ProductFamily = Catalogue & {
  categories: Category[];
};

export type Category = {
  id: string;
  catalogueId: string | null;
  catalogueName?: string;
  catalogueSlug?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type Collection = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  bannerUrl: string;
  logoUrl?: string;
  brochureUrl: string;
  isFeatured: boolean;
  productCount?: number;
};

export type ProductImage = {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  blurDataUrl: string;
  alt: string;
  kind: "main" | "closeup" | "application" | "texture";
};

export type Product = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  categoryId: string;
  collectionId: string;
  categoryName?: string;
  collectionName?: string;
  finish: string;
  baseMaterial: string;
  size: string;
  thickness: string;
  colorTone: string;
  applications: string[];
  shortDescription: string;
  specs: Array<{ name: string; value: string }>;
  images: ProductImage[];
  brochureUrl: string;
  isActive: boolean;
};

export type QuoteRequest = {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  firm?: string;
  city: string;
  productCode?: string;
  quantity?: string;
  message?: string;
};
