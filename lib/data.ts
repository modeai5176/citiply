import type { Category, Collection, Product, QuoteRequest } from "@/lib/types";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=82`;

export const categories: Category[] = [
  {
    id: "cat-veneer",
    catalogueId: null,
    name: "Veneers",
    slug: "veneers",
    description: "Natural and engineered veneers for refined architectural surfaces.",
    imageUrl: img("photo-1517581177682-a085bb7ffb38"),
    sortOrder: 1,
    isActive: true
  },
  {
    id: "cat-doors",
    catalogueId: null,
    name: "Doors",
    slug: "doors",
    description: "Premium door surfaces and matching systems for interior projects.",
    imageUrl: img("photo-1604014237744-644a5f0ca6b7"),
    sortOrder: 2,
    isActive: true
  },
  {
    id: "cat-plywood",
    catalogueId: null,
    name: "Plywood",
    slug: "plywood",
    description: "Dependable substrates for contractors and production teams.",
    imageUrl: img("photo-1600585152220-90363fe7e115"),
    sortOrder: 3,
    isActive: true
  },
  {
    id: "cat-flooring",
    catalogueId: null,
    name: "Flooring",
    slug: "flooring",
    description: "Architectural flooring textures with commercial-grade performance.",
    imageUrl: img("photo-1600566753190-17f0baa2a6c3"),
    sortOrder: 4,
    isActive: true
  },
  {
    id: "cat-panels",
    catalogueId: null,
    name: "Wall Panels",
    slug: "wall-panels",
    description: "Statement walls, acoustic surfaces, and warm interior cladding.",
    imageUrl: img("photo-1600607687939-ce8a6c25118c"),
    sortOrder: 5,
    isActive: true
  },
  {
    id: "cat-louvers",
    catalogueId: null,
    name: "Louvers",
    slug: "louvers",
    description: "Linear systems that bring rhythm, depth, and concealment.",
    imageUrl: img("photo-1600210492486-724fe5c67fb0"),
    sortOrder: 6,
    isActive: true
  },
  {
    id: "cat-laminates",
    catalogueId: null,
    name: "Laminates",
    slug: "laminates",
    description: "Durable decorative laminates for fast-moving specification work.",
    imageUrl: img("photo-1600607687644-c7171b42498f"),
    sortOrder: 7,
    isActive: true
  }
];

export const collections: Collection[] = [
  {
    id: "col-reganto",
    categoryId: "cat-veneer",
    name: "Reganto Classic",
    slug: "reganto-classic",
    description: "Consistent wood aesthetics engineered for scale and repeatability.",
    tagline: "Clean wood aesthetics, engineered right.",
    bannerUrl: img("photo-1618220179428-22790b461013"),
    logoUrl: "/brand/reganto.svg",
    brochureUrl: "/downloads/reganto-classic.pdf",
    isFeatured: true
  },
  {
    id: "col-furrow",
    categoryId: "cat-louvers",
    name: "Furrow Panels",
    slug: "furrow-panels",
    description: "Sculpted linear panels that add shadow, depth, and acoustic warmth.",
    tagline: "Four new designs. One sculpted statement.",
    bannerUrl: img("photo-1600607688969-a5bfcd646154"),
    logoUrl: "/brand/furrow.svg",
    brochureUrl: "/downloads/furrow-panels.pdf",
    isFeatured: true
  },
  {
    id: "col-canvas",
    categoryId: "cat-panels",
    name: "Canvas Gradient",
    slug: "canvas-gradient",
    description: "A tonal surface collection for dramatic full-height installations.",
    tagline: "The art of seamless gradience.",
    bannerUrl: img("photo-1600566752355-35792bedcfea"),
    logoUrl: "/brand/canvas.svg",
    brochureUrl: "/downloads/canvas-gradient.pdf",
    isFeatured: true
  },
  {
    id: "col-mattle",
    categoryId: "cat-laminates",
    name: "Mattle Barcode",
    slug: "mattle-barcode",
    description: "Matte metallic rhythm for commercial interiors and feature planes.",
    tagline: "Redefined without limits.",
    bannerUrl: img("photo-1600607687920-4e2a09cf159d"),
    logoUrl: "/brand/mattle.svg",
    brochureUrl: "/downloads/mattle-barcode.pdf",
    isFeatured: true
  }
];

const blur =
  "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";

export const products: Product[] = Array.from({ length: 28 }, (_, index) => {
  const collection = collections[index % collections.length];
  const category = categories.find((item) => item.id === collection.categoryId) ?? categories[0];
  const sku = `${collection.slug.split("-")[0].toUpperCase()}-${String(index + 1).padStart(3, "0")}`;
  const imageUrl = img(index % 2 === 0 ? "photo-1618221195710-dd6b41faaea6" : "photo-1600566753190-17f0baa2a6c3");

  return {
    id: `prod-${index + 1}`,
    sku,
    slug: sku.toLowerCase(),
    name: `${collection.name} ${index + 1}`,
    categoryId: category.id,
    collectionId: collection.id,
    finish: ["Matte", "Open Grain", "Smoked", "Textured"][index % 4],
    baseMaterial: ["Natural Veneer", "MDF", "Plywood", "HDF"][index % 4],
    size: "8 ft x 4 ft",
    thickness: ["0.6 mm", "4 mm", "12 mm", "18 mm"][index % 4],
    colorTone: ["Warm", "Neutral", "Dark", "Light"][index % 4],
    applications: ["Hospitality", "Residential", "Retail", "Office"].slice(0, (index % 4) + 1),
    shortDescription: "Premium surface material selected for speed, clarity, and architectural detailing.",
    specs: [
      { name: "Core", value: "Calibrated engineered substrate" },
      { name: "Pressing", value: "Factory finished" },
      { name: "Maintenance", value: "Wipe with soft dry cloth" }
    ],
    images: [
      {
        id: `img-${index + 1}-main`,
        imageUrl,
        thumbnailUrl: `${imageUrl}&w=500`,
        blurDataUrl: blur,
        alt: `${collection.name} surface ${sku}`,
        kind: "main"
      },
      {
        id: `img-${index + 1}-close`,
        imageUrl: img("photo-1600607688969-a5bfcd646154"),
        thumbnailUrl: img("photo-1600607688969-a5bfcd646154") + "&w=500",
        blurDataUrl: blur,
        alt: `${collection.name} detail ${sku}`,
        kind: "closeup"
      }
    ],
    brochureUrl: collection.brochureUrl,
    isActive: true
  };
});

export const quoteRequests: QuoteRequest[] = [
  {
    id: "quote-1",
    createdAt: "2026-05-21T10:30:00.000Z",
    fullName: "Aarav Mehta",
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    firm: "AM Design Studio",
    city: "Mumbai",
    productCode: "REGANTO-001",
    quantity: "42 sheets",
    message: "Need samples and commercial pricing."
  }
];

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getCollectionBySlug(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

export function getProductBySku(sku: string) {
  return products.find((product) => product.sku.toLowerCase() === sku.toLowerCase());
}
