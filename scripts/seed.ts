import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import ws from "ws";

const IMAGES = {
  veneer: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1200",
    "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=1200",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1200",
    "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200"
  ],
  panels: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
    "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200"
  ]
};

const CATEGORIES_SEED = [
  { name: "Natural Veneers", slug: "natural-veneers", description: "Premium natural wood veneers from around the world", sort_order: 1 },
  { name: "Exotic Veneers", slug: "exotic-veneers", description: "Rare and specialty exotic wood veneers", sort_order: 2 },
  { name: "Wall Panels", slug: "wall-panels", description: "Decorative fluted and groove wall panels", sort_order: 3 },
  { name: "Specialty Series", slug: "specialty-series", description: "Unique surface treatment series", sort_order: 4 },
  { name: "Coloured Veneers", slug: "coloured-veneers", description: "Pre-finished coloured and dyed veneers", sort_order: 5 },
  { name: "Textured Veneers", slug: "textured-veneers", description: "Rough cut, torched, and weathered surfaces", sort_order: 6 },
  { name: "Premium Collections", slug: "premium-collections", description: "Curated premium veneer collections", sort_order: 7 }
];

const COLLECTIONS_SEED = [
  { name: "Natural Veneers", slug: "natural-veneers-range", category_slug: "natural-veneers", tagline: "Real wood. Timeless grain.", description: "A wide selection of natural wood veneers spanning light to dark tones." },
  { name: "Evergreen Series", slug: "evergreen-series", category_slug: "natural-veneers", tagline: "The classics. Always.", description: "Timeless species available year-round in consistent quality." },
  { name: "Founders Collection 4", slug: "founders-collection-4", category_slug: "exotic-veneers", tagline: "A landmark in veneering. Since 1992.", description: "FC4 marks 25 years of Turakhia Natural Veneers with rare species for discerning designers." },
  { name: "FIERO", slug: "fiero", category_slug: "exotic-veneers", tagline: "Smoke. Fire. Depth.", description: "Rare exotic species with extraordinary grain and character." },
  { name: "NSD & Hand Picked Veneers", slug: "nsd-hand-picked", category_slug: "exotic-veneers", tagline: "Handpicked. Irreplaceable.", description: "Individually selected rare veneers curated by expert craftsmen." },
  { name: "Weathered", slug: "weathered", category_slug: "textured-veneers", tagline: "Time-worn. Authentically aged.", description: "Veneers with the character of aged, weathered wood." },
  { name: "RoughCut", slug: "roughcut", category_slug: "textured-veneers", tagline: "Raw grain. Honest surface.", description: "Eco-friendly rough cut veneer with no sanding required." },
  { name: "Torched", slug: "torched", category_slug: "textured-veneers", tagline: "Fire-kissed grain.", description: "Charcoal, flamed and torched finishes for dramatic textural impact." },
  { name: "Volcano", slug: "volcano", category_slug: "textured-veneers", tagline: "Diagonal drama.", description: "Diagonal grain undulations with a profiled solid wood illusion." },
  { name: "Burl", slug: "burl", category_slug: "specialty-series", tagline: "Nature's rare formations.", description: "Burl veneer surfaces with one-of-a-kind formations." },
  { name: "Metallico", slug: "metallico", category_slug: "specialty-series", tagline: "Dark metal aesthetic.", description: "Deep rich surfaces with metallic undertones for statement interiors." },
  { name: "FADED", slug: "faded", category_slug: "coloured-veneers", tagline: "Soft colour. Natural base.", description: "Dyed veneers with faded antique-inspired palettes." },
  { name: "THUNDER", slug: "thunder", category_slug: "coloured-veneers", tagline: "Gold. Drama. Precision.", description: "Gold inlay and acrylico surfaces for demanding luxury projects." },
  { name: "Fluted Wall Panels", slug: "fluted-wall-panels", category_slug: "wall-panels", tagline: "Linear walls. Fast specification.", description: "Decorative wall panel references for premium interior surfaces." }
];

const PRODUCTS_BY_COLLECTION: Record<string, string[]> = {
  "founders-collection-4": ["Black Gum", "Indian Rosewood", "Macassar Ebony", "Wenge", "Barbasco", "Yewtree", "Santos Rosewood", "Rosso", "Ontano Rosso", "Stonewood", "Zericoted", "Sucupira", "Ipe", "Spilted", "American Walnut", "Indian Walnut", "European Walnut", "Lacewood", "Zebrano", "Bocote", "Sassnero", "Riverwood", "Spalted Teak", "Burmese Teak", "Golden Wenge", "Anigre Figured", "Eucalyptus Figured", "Anigre", "White Oak"],
  "evergreen-series": ["Teak", "Walnut", "Rosewood", "Ebony"],
  "natural-veneers-range": ["American Maple", "Chestnut", "Sycamore", "Ash", "Hackberry", "Poplar", "Birds Eye Maple", "Larch", "Rivertree", "Beech", "Lebanese Cedar", "Plaintree", "Red Oak", "Roseheart", "Kevasingo", "Sapeli", "European Cherry", "African Mahogany", "African Cherry", "Red Cedar", "Padauk", "Sapeli Pomele", "Eucalyptus Pommele"],
  fiero: ["Exotic Ebony Oak", "Patternwood Figured", "Sassafras", "Thinwin", "Patternwood Pommele", "Koa", "Teatree", "Saddle Tree", "Raintree", "Rainwood", "Yewwood", "Black Alder", "Jamire", "Cocobolo", "Kossipo", "Kossipo Pomele", "Arc", "Sasswood", "Pearwood", "Barwood", "Sapgum", "Coffeebin", "Zitrone", "Thermo Robusta", "Bolivian"],
  weathered: ["Laura Petro", "Exotic Bugged Oak", "Bugged Oak", "Mexican Laurel", "Ironwood", "Robusta", "Blackwood", "Brown Laurel", "Izombe", "Golden Patternwood", "Bog Elm", "Bog Ash", "Tan Oak", "Winewood", "Cottonwood", "Crispa", "Nyssa", "Kelloggi", "Bur Oak", "Coralbean", "Cordia Burl", "Cocoplum", "Black Locust", "Ironbark", "Tomentosa", "Pin Oak", "Voilet Armani", "Calabash Burl", "Coccinea", "Cowania", "Plicata", "Ginko", "Japonica", "Bolivier", "Grey Armani", "Sand Bolivier"],
  roughcut: ["Rough Ebony Oak", "Rough Teatree", "Rough Bur Oak", "Rough Cocoplum", "Rough Yewwood", "Rough Coreal", "Exotic Rough Bugged Oak", "Rough American Walnut", "Rough Bugged Oak", "Rough Burmese Teak", "Rough Kossipo", "Rough Sapeli", "Rough White Oak", "Rough Ash", "Rough Olive Beech"],
  volcano: ["Volcano Yewwood", "Volcano Bugged Oak", "Volcano Kossipo"],
  burl: ["Firoze Oak", "Firoze Mappa Burl", "Vavona Burl", "Walnut Burl", "Elm Burl", "Maple Burl", "Olive Ash Burl", "White Oak Burl", "Poplar Burl"],
  metallico: ["Black Oak", "Blackstone", "Blacknut", "Blacktree", "Flame Koa", "Cocotree", "Choconut", "Flame Larch", "Limed Oak", "Choco Eucalyptus Figured", "Choco Birds Eye Maple", "Choco Ash Burl", "Choco Poplar Burl"],
  torched: ["Torched Charcoal Oak", "Torched Hagburry", "Torched Eucalyptus Figured", "Torched Ironwood", "Torched Tanned Oak", "Torched Yewtree", "Torched Flame Larch", "Torched Flamed Oak", "Torched Tamo Ash", "Torched Poplar Burl", "Torched Flamed Oak Burl", "Torched Exotic Rough White Oak", "Torched Elm", "Torched Maple", "Torched Sycamore", "Torched Ash", "Torched Birch", "Torched Beech", "Torched Red Oak", "Torched Sapeli"],
  faded: ["Faded Antic Oak", "Faded Blue Moon", "Faded Dyed Sycamore", "Faded Dyed Ash", "Faded Dyed Beech", "Faded Dyed Mahogany"],
  thunder: ["Gold Inlay Coffeetree", "Gold Inlay Coffeebin", "Gold Inlay Sassafras", "Acrylico Blackstone", "Acrylico Sassafras"],
  "fluted-wall-panels": ["Linear Oak", "Linear Walnut", "Reeded Ash", "Groove Teak", "Slimline Ebony"]
};

function getImage(pool: string[], index: number): string {
  return pool[index % pool.length];
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function generateSku(collectionSlug: string, index: number): string {
  const prefix = collectionSlug.replace(/-/g, "").substring(0, 4).toUpperCase();
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function getSpecsForCollection(collectionSlug: string) {
  if (["roughcut", "volcano"].includes(collectionSlug)) {
    return [
      { spec_name: "Thickness", spec_value: "0.8mm" },
      { spec_name: "Standard Size", spec_value: "8ft x 4ft" },
      { spec_name: "Surface", spec_value: "Rough Cut - No Sanding" },
      { spec_name: "Application", spec_value: "Rustic Interiors, Feature Walls" }
    ];
  }
  return [
    { spec_name: "Thickness", spec_value: "0.6mm" },
    { spec_name: "Standard Size", spec_value: "8ft x 4ft" },
    { spec_name: "Species Type", spec_value: "Natural Wood" },
    { spec_name: "Surface", spec_value: "Unfinished" },
    { spec_name: "Application", spec_value: "Furniture, Wall Paneling, Doors, Cabinets" }
  ];
}

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(url, key, {
    realtime: {
      transport: ws as unknown as WebSocketLikeConstructor
    }
  });
  const categoryMap: Record<string, string> = {};

  console.log("Seeding categories...");
  for (let index = 0; index < CATEGORIES_SEED.length; index += 1) {
    const category = CATEGORIES_SEED[index];
    const { data, error } = await supabase
      .from("categories")
      .upsert({ ...category, image_url: getImage(IMAGES.veneer, index), is_active: true }, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error) throw error;
    categoryMap[data.slug] = data.id;
  }

  const collectionMap: Record<string, string> = {};
  console.log("Seeding collections...");
  for (let index = 0; index < COLLECTIONS_SEED.length; index += 1) {
    const collection = COLLECTIONS_SEED[index];
    const categoryId = categoryMap[collection.category_slug];
    if (!categoryId) continue;
    const { data, error } = await supabase
      .from("collections")
      .upsert({
        name: collection.name,
        slug: collection.slug,
        category_id: categoryId,
        tagline: collection.tagline,
        description: collection.description,
        banner_url: getImage(collection.category_slug === "wall-panels" ? IMAGES.panels : IMAGES.veneer, index),
        logo_url: null,
        brochure_url: null,
        is_featured: index < 4,
        is_active: true
      }, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error) throw error;
    collectionMap[data.slug] = data.id;
  }

  console.log("Seeding products...");
  for (const [collectionSlug, names] of Object.entries(PRODUCTS_BY_COLLECTION)) {
    const collectionId = collectionMap[collectionSlug];
    const collection = COLLECTIONS_SEED.find((item) => item.slug === collectionSlug);
    if (!collectionId || !collection) continue;
    const categoryId = categoryMap[collection.category_slug];

    for (let index = 0; index < names.length; index += 1) {
      const name = names[index];
      const sku = generateSku(collectionSlug, index);
      const productImage = getImage(collection.category_slug === "wall-panels" ? IMAGES.panels : IMAGES.veneer, index);
      const { data: product, error } = await supabase
        .from("products")
        .upsert({
          sku,
          name,
          slug: `${collectionSlug}-${slugify(name)}`,
          category_id: categoryId,
          collection_id: collectionId,
          finish: "Unfinished",
          base_material: "Natural Wood",
          size: "8ft x 4ft",
          thickness: ["roughcut", "volcano"].includes(collectionSlug) ? "0.8mm" : "0.6mm",
          color_tone: "Natural",
          applications: ["Furniture", "Wall Paneling", "Doors", "Cabinets"],
          short_description: `Premium ${name} veneer from the ${collection.name} range.`,
          brochure_url: null,
          is_active: true,
          seo_title: `${name} Veneer | ${collection.name}`,
          seo_description: `Buy ${name} veneer sheets. Premium quality natural wood veneer.`
        }, { onConflict: "sku" })
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("product_images").delete().eq("product_id", product.id);
      await supabase.from("product_images").insert({
        product_id: product.id,
        image_url: productImage,
        thumbnail_url: productImage.replace("w=1200", "w=400"),
        blur_data_url: "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
        kind: "main",
        sort_order: 0
      });

      await supabase.from("product_specs").delete().eq("product_id", product.id);
      await supabase.from("product_specs").insert(getSpecsForCollection(collectionSlug).map((spec, specIndex) => ({ ...spec, product_id: product.id, sort_order: specIndex })));
    }
    console.log(`Seeded ${names.length} products in ${collectionSlug}`);
  }

  console.log("Seed complete.");
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
