import type { Product } from "@/lib/types";

// Facets shown in the veneer collection filter bar. Some are backed by real
// product data (finish, application, tone); the rest (species, grain,
// availability) are not yet in the schema, so we derive them deterministically
// from the product SKU/name so every render and the filter options agree.

export const TONE_OPTIONS = ["Light", "Medium", "Dark"] as const;
export const GRAIN_OPTIONS = ["Straight", "Crown", "Quarter", "Burl"] as const;
export const AVAILABILITY_OPTIONS = ["Stocked", "Made-to-order"] as const;
const SPECIES_OPTIONS = ["Oak", "Walnut", "Teak", "Maple", "Ebony", "Ash"] as const;

export type VeneerFacets = {
  species: string;
  tone: string;
  grain: string;
  finish: string;
  applications: string[];
  availability: string;
};

// Stable hash so the same product always maps to the same synthetic facet.
function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(options: readonly T[], seed: string) {
  return options[hash(seed) % options.length];
}

function toneBucket(product: Product): string {
  const tone = product.colorTone?.toLowerCase() ?? "";
  if (/light|natural|blonde|honey|pale/.test(tone)) return "Light";
  if (/dark|espresso|ebony|wenge|smoked|charcoal/.test(tone)) return "Dark";
  if (/medium|amber|chestnut|cognac|walnut/.test(tone)) return "Medium";
  // No keyword match — fall back to a deterministic bucket.
  return TONE_OPTIONS[hash(product.sku) % TONE_OPTIONS.length];
}

export function getVeneerFacets(product: Product): VeneerFacets {
  return {
    species: pick(SPECIES_OPTIONS, `${product.sku}-species`),
    tone: toneBucket(product),
    grain: pick(GRAIN_OPTIONS, `${product.sku}-grain`),
    finish: product.finish && product.finish !== "Not specified" ? product.finish : "Matte",
    applications: product.applications.length ? product.applications : ["Wall Panel"],
    availability: pick(AVAILABILITY_OPTIONS, `${product.sku}-avail`)
  };
}

export const SPECIES_FACET_OPTIONS = SPECIES_OPTIONS;
