import { createAdminClient } from "@/lib/supabase/admin";
import type { Catalogue, Category, Collection, Product, ProductFamily, ProductImage } from "@/lib/types";
import type { CatalogueRow, CategoryRow, CollectionRow, ProductImageRow, ProductRow, ProductSpecRow } from "@/lib/supabase/types";

const fallbackImage = "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1600&q=82";
const fallbackBlur = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";

type ProductWithRelations = ProductRow & {
  product_images?: ProductImageRow[] | null;
  product_specs?: ProductSpecRow[] | null;
  categories?: { name?: string | null } | null;
  collections?: { name?: string | null } | null;
};

type CategoryWithCatalogue = CategoryRow & {
  catalogues?: { name?: string | null; slug?: string | null } | null;
};

function mapCatalogue(row: CatalogueRow): Catalogue {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    imageUrl: row.image_url || fallbackImage,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active
  };
}

function mapCategory(row: CategoryWithCatalogue): Category {
  return {
    id: row.id,
    catalogueId: row.catalogue_id ?? null,
    catalogueName: row.catalogues?.name ?? undefined,
    catalogueSlug: row.catalogues?.slug ?? undefined,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    imageUrl: row.image_url || fallbackImage,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active
  };
}

function mapCollection(row: CollectionRow, productCount?: number): Collection {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    tagline: row.tagline ?? row.description ?? "",
    bannerUrl: row.banner_url || fallbackImage,
    logoUrl: row.logo_url ?? undefined,
    brochureUrl: row.brochure_url ?? "#",
    isFeatured: row.is_featured,
    productCount
  };
}

function mapImage(row: ProductImageRow, product: ProductRow): ProductImage {
  return {
    id: row.id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url || row.image_url,
    blurDataUrl: row.blur_data_url || fallbackBlur,
    alt: `${product.name} ${row.kind}`,
    kind: row.kind
  };
}

function fallbackProductImage(product: ProductRow): ProductImage {
  return {
    id: `${product.id}-fallback`,
    imageUrl: fallbackImage,
    thumbnailUrl: fallbackImage,
    blurDataUrl: fallbackBlur,
    alt: product.name,
    kind: "main"
  };
}

function mapProduct(row: ProductWithRelations): Product {
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => mapImage(image, row));

  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    categoryId: row.category_id,
    collectionId: row.collection_id,
    categoryName: row.categories?.name ?? undefined,
    collectionName: row.collections?.name ?? undefined,
    finish: row.finish ?? "Not specified",
    baseMaterial: row.base_material ?? "Not specified",
    size: row.size ?? "Not specified",
    thickness: row.thickness ?? "Not specified",
    colorTone: row.color_tone ?? "Not specified",
    applications: row.applications ?? [],
    shortDescription: row.short_description ?? "",
    specs: (row.product_specs ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((spec) => ({ name: spec.spec_name, value: spec.spec_value })),
    images: images.length ? images : [fallbackProductImage(row)],
    brochureUrl: row.brochure_url ?? "#",
    isActive: row.is_active
  };
}

async function getCollectionCounts(collectionIds: string[]) {
  if (!collectionIds.length) return new Map<string, number>();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("collection_id")
    .eq("is_active", true)
    .in("collection_id", collectionIds);

  return (data ?? []).reduce((counts, product) => {
    counts.set(product.collection_id, (counts.get(product.collection_id) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

export async function getCatalogues() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("catalogues")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCatalogue);
}

export async function getCatalogueBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("catalogues")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCatalogue(data) : null;
}

export async function getCategories(options: { catalogueId?: string } = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("categories")
    .select("*, catalogues(name, slug)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (options.catalogueId) query = query.eq("catalogue_id", options.catalogueId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as CategoryWithCatalogue[]).map(mapCategory);
}

export async function getCategoryBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, catalogues(name, slug)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCategory(data as CategoryWithCatalogue) : null;
}

export async function getCollections(options: { categoryId?: string; featuredOnly?: boolean; limit?: number; withCounts?: boolean; newest?: boolean } = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .order(options.newest ? "created_at" : "is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.featuredOnly) query = query.eq("is_featured", true);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const counts = options.withCounts ? await getCollectionCounts(rows.map((row) => row.id)) : new Map<string, number>();
  return rows.map((row) => mapCollection(row, counts.get(row.id)));
}

export async function getCollectionBySlug(slug: string, withCount = false) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const counts = withCount ? await getCollectionCounts([data.id]) : new Map<string, number>();
  return mapCollection(data, counts.get(data.id));
}

export async function getProducts(options: { categoryId?: string; collectionId?: string; limit?: number; excludeId?: string; newest?: boolean } = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select("*, product_images(*), product_specs(*), categories(name), collections(name)")
    .eq("is_active", true)
    .order(options.newest ? "created_at" : "name", { ascending: !options.newest });

  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.collectionId) query = query.eq("collection_id", options.collectionId);
  if (options.excludeId) query = query.neq("id", options.excludeId);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProductWithRelations[]).map(mapProduct);
}

export async function getProductBySku(sku: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_specs(*), categories(name), collections(name)")
    .eq("sku", sku)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProduct(data as ProductWithRelations) : null;
}

export async function getProductStaticParams(limit = 200) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("sku")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((product) => ({ sku: product.sku }));
}

// Groups categories (filters) under their parent catalogue (Product Family),
// so the navigation can render the Family → Filter tree in one pass.
function groupFamilies(catalogues: Catalogue[], categories: Category[]): ProductFamily[] {
  return catalogues.map((catalogue) => ({
    ...catalogue,
    categories: categories.filter((category) => category.catalogueId === catalogue.id)
  }));
}

export async function getNavigationData() {
  const [catalogues, categories, collections] = await Promise.all([
    getCatalogues(),
    getCategories(),
    getCollections({ featuredOnly: true, limit: 4 })
  ]);

  const families = groupFamilies(catalogues, categories);

  return { catalogues, categories, collections, families };
}
