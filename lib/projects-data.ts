// Application / Project browse path. Projects are managed in the admin panel and
// stored in the `projects` table. The static list below is the seed/fallback:
// it renders when the DB table is empty or unconfigured, so the public pages
// always have content. Each "project" is a design application/space; chip `href`
// links into /collections or /categories where a real match exists.
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProjectRow } from "@/lib/supabase/types";

export type ProjectChip = {
  label: string;
  href?: string;
};

export type Project = {
  slug: string;
  name: string;
  category: string;
  concept: string;
  heroImage: string;
  gallery: string[];
  recommendedMaterials: ProjectChip[];
  veneerTones: ProjectChip[];
  flutedPanels: ProjectChip[];
  doors: ProjectChip[];
  laminates: ProjectChip[];
};

// Seed / fallback data. Image slots reuse existing section/collection imagery
// as placeholders until real photos are added.
const STATIC_PROJECTS: Project[] = [
  {
    slug: "residential",
    name: "Residential",
    category: "Spaces",
    concept: "Warm, lived-in interiors where natural grain sets the tone for the whole home.",
    heroImage: "/images/sections/room-discovery.png",
    gallery: ["/images/collections/warm-naturals.png", "/images/veneer-art/grain-oak.png", "/images/collections/modern-neutrals.png"],
    recommendedMaterials: [{ label: "Veneered MDF" }, { label: "Marine Plywood" }, { label: "Engineered Flooring" }],
    veneerTones: [{ label: "Warm Naturals", href: "/collections/warm-naturals" }, { label: "Modern Neutrals", href: "/collections/modern-neutrals" }],
    flutedPanels: [{ label: "Oak Fluted Panel" }, { label: "Ash Slatted Panel" }],
    doors: [{ label: "Walnut Flush Door" }, { label: "Oak Veneer Door" }],
    laminates: [{ label: "Honey Oak Laminate" }, { label: "Wide Plank Oak Floor" }]
  },
  {
    slug: "hospitality",
    name: "Hospitality",
    category: "Spaces",
    concept: "Atmospheric surfaces for hotels, restaurants and lounges that invite guests to linger.",
    heroImage: "/images/sections/architect-mode.png",
    gallery: ["/images/collections/dark-elegance.png", "/images/veneer-art/grain-walnut.png", "/images/collections/statement-grains.png"],
    recommendedMaterials: [{ label: "Fire-rated Plywood" }, { label: "Acoustic Panels" }, { label: "Decorative Veneer" }],
    veneerTones: [{ label: "Dark Elegance", href: "/collections/dark-elegance" }, { label: "Statement Grains", href: "/collections/statement-grains" }],
    flutedPanels: [{ label: "Walnut Fluted Panel" }, { label: "Ebony Slatted Panel" }],
    doors: [{ label: "Teak Frame Set" }, { label: "Walnut Statement Door" }],
    laminates: [{ label: "Smoked Walnut Laminate" }, { label: "Herringbone Oak Floor" }]
  },
  {
    slug: "corporate-office",
    name: "Corporate / Office",
    category: "Spaces",
    concept: "Calm, considered workplaces with quiet confidence in material and detail.",
    heroImage: "/images/sections/plywood-feature.png",
    gallery: ["/images/collections/modern-neutrals.png", "/images/veneer-art/grain-ash.png", "/images/collections/warm-naturals.png"],
    recommendedMaterials: [{ label: "Calibrated Plywood" }, { label: "Acoustic Veneer Panels" }, { label: "Laminate Boards" }],
    veneerTones: [{ label: "Modern Neutrals", href: "/collections/modern-neutrals" }, { label: "Warm Naturals", href: "/collections/warm-naturals" }],
    flutedPanels: [{ label: "Ash Fluted Panel" }, { label: "Oak Acoustic Panel" }],
    doors: [{ label: "Ash Flush Door" }, { label: "Laminate Office Door" }],
    laminates: [{ label: "Cool Ash Laminate" }, { label: "Matte Grey Floor" }]
  },
  {
    slug: "retail",
    name: "Retail",
    category: "Spaces",
    concept: "Bold, expressive backdrops that frame product and pull the eye through the store.",
    heroImage: "/images/sections/door-feature.png",
    gallery: ["/images/collections/statement-grains.png", "/images/veneer-art/grain-ebony.png", "/images/collections/dark-elegance.png"],
    recommendedMaterials: [{ label: "Decorative Veneer" }, { label: "High-Gloss Laminate" }, { label: "Plywood Substrate" }],
    veneerTones: [{ label: "Statement Grains", href: "/collections/statement-grains" }, { label: "Dark Elegance", href: "/collections/dark-elegance" }],
    flutedPanels: [{ label: "Ebony Fluted Panel" }, { label: "Figured Maple Panel" }],
    doors: [{ label: "High-Gloss Display Door" }],
    laminates: [{ label: "Macassar Ebony Laminate" }, { label: "Polished Concrete Floor" }]
  },
  {
    slug: "doors",
    name: "Doors",
    category: "Elements",
    concept: "Flush and framed doors finished in veneer to carry a room's material story through every threshold.",
    heroImage: "/images/sections/door-feature.png",
    gallery: ["/images/veneer-art/grain-walnut.png", "/images/veneer-art/grain-teak.png", "/images/veneer-art/grain-oak.png"],
    recommendedMaterials: [{ label: "Veneered Door Skin" }, { label: "Solid Core Substrate" }, { label: "Edge-banding" }],
    veneerTones: [{ label: "Warm Naturals", href: "/collections/warm-naturals" }, { label: "Dark Elegance", href: "/collections/dark-elegance" }],
    flutedPanels: [{ label: "Matching Fluted Jamb" }],
    doors: [{ label: "Walnut Flush Door" }, { label: "Teak Frame Set" }, { label: "Oak Veneer Door" }],
    laminates: [{ label: "Colour-matched Laminate Edge" }]
  },
  {
    slug: "feature-walls",
    name: "Feature Walls",
    category: "Elements",
    concept: "Statement vertical surfaces — grain, fluting and figure that anchor a space.",
    heroImage: "/images/sections/plywood-feature.png",
    gallery: ["/images/veneer-art/grain-ebony.png", "/images/collections/statement-grains.png", "/images/veneer-art/grain-walnut.png"],
    recommendedMaterials: [{ label: "Wall Veneer" }, { label: "Fluted Panels" }, { label: "Acoustic Backing" }],
    veneerTones: [{ label: "Statement Grains", href: "/collections/statement-grains" }, { label: "Dark Elegance", href: "/collections/dark-elegance" }],
    flutedPanels: [{ label: "Smoked Oak Fluted Panel" }, { label: "Ebony Grain Wall Panel" }, { label: "Figured Maple Sheet" }],
    doors: [{ label: "Concealed Veneer Door" }],
    laminates: [{ label: "Texture-matched Laminate" }]
  },
  {
    slug: "wardrobes-paneling",
    name: "Wardrobes / Paneling",
    category: "Elements",
    concept: "Seamless joinery and panelling where every shutter and run reads as one continuous surface.",
    heroImage: "/images/sections/architect-mode.png",
    gallery: ["/images/collections/warm-naturals.png", "/images/veneer-art/grain-oak.png", "/images/collections/modern-neutrals.png"],
    recommendedMaterials: [{ label: "Veneered MDF" }, { label: "Pre-laminated Boards" }, { label: "Soft-close Hardware" }],
    veneerTones: [{ label: "Warm Naturals", href: "/collections/warm-naturals" }, { label: "Modern Neutrals", href: "/collections/modern-neutrals" }],
    flutedPanels: [{ label: "Fluted Shutter Front" }],
    doors: [{ label: "Sliding Veneer Shutter" }, { label: "Hinged Panel Door" }],
    laminates: [{ label: "Matching Internal Laminate" }]
  },
  {
    slug: "ceiling-joinery",
    name: "Ceiling / Joinery",
    category: "Elements",
    concept: "Linear ceilings and bespoke joinery that bring warmth and rhythm overhead and underfoot.",
    heroImage: "/images/sections/room-discovery.png",
    gallery: ["/images/veneer-art/grain-ash.png", "/images/collections/modern-neutrals.png", "/images/veneer-art/grain-oak.png"],
    recommendedMaterials: [{ label: "Linear Veneer Panels" }, { label: "Acoustic Slats" }, { label: "Plywood Carcass" }],
    veneerTones: [{ label: "Modern Neutrals", href: "/collections/modern-neutrals" }, { label: "Warm Naturals", href: "/collections/warm-naturals" }],
    flutedPanels: [{ label: "Linear Oak Ceiling Panel" }, { label: "Slatted Ash Panel" }],
    doors: [{ label: "Integrated Joinery Door" }],
    laminates: [{ label: "Matte Ceiling Laminate" }]
  },
  {
    slug: "reception-public-spaces",
    name: "Reception / Public Spaces",
    category: "Spaces",
    concept: "First-impression surfaces for lobbies and public areas — refined, durable and memorable.",
    heroImage: "/images/sections/door-feature.png",
    gallery: ["/images/collections/dark-elegance.png", "/images/veneer-art/grain-walnut.png", "/images/collections/statement-grains.png"],
    recommendedMaterials: [{ label: "High-durability Veneer" }, { label: "Fire-rated Plywood" }, { label: "Engineered Stone Pairings" }],
    veneerTones: [{ label: "Dark Elegance", href: "/collections/dark-elegance" }, { label: "Statement Grains", href: "/collections/statement-grains" }],
    flutedPanels: [{ label: "Reception Desk Fluting" }, { label: "Walnut Wall Panel" }],
    doors: [{ label: "Statement Entry Door" }],
    laminates: [{ label: "High-traffic Laminate" }, { label: "Stone-look Floor" }]
  }
];

function asChips(value: ProjectRow["gallery"]): ProjectChip[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { label: item };
      if (item && typeof item === "object" && "label" in item) {
        const chip = item as { label?: unknown; href?: unknown };
        if (typeof chip.label === "string") {
          return { label: chip.label, href: typeof chip.href === "string" ? chip.href : undefined };
        }
      }
      return null;
    })
    .filter((chip): chip is ProjectChip => chip !== null);
}

function asImages(value: ProjectRow["gallery"]): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapProject(row: ProjectRow): Project {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category ?? "",
    concept: row.concept ?? "",
    heroImage: row.hero_image ?? "",
    gallery: asImages(row.gallery),
    recommendedMaterials: asChips(row.recommended_materials),
    veneerTones: asChips(row.veneer_tones),
    flutedPanels: asChips(row.fluted_panels),
    doors: asChips(row.doors),
    laminates: asChips(row.laminates)
  };
}

// Returns DB projects when the table has rows; otherwise falls back to the
// static seed list so the public section/pages always render something.
export async function getProjects(): Promise<Project[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return STATIC_PROJECTS;
    return (data as ProjectRow[]).map(mapProject);
  } catch {
    return STATIC_PROJECTS;
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) return STATIC_PROJECTS.find((p) => p.slug === slug) ?? null;
    if (data) return mapProject(data as ProjectRow);
  } catch {
    // fall through to static
  }
  return STATIC_PROJECTS.find((p) => p.slug === slug) ?? null;
}
