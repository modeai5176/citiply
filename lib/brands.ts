// Partner brands shown on the homepage hero (globe tiles on desktop, marquee on mobile).
//
// These are typographic wordmarks, not the brands' registered logos — we don't
// redraw trademarks. To use official artwork, drop the brand-supplied SVG into
// public/images/brands/logos/<slug>.svg and set `logo` below; the marquee
// renders it single-colour via CSS mask.
//
// Globe tiles are generated from this list: `npx tsx scripts/generate-brand-tiles.ts`.

export type Brand = {
  slug: string;
  name: string;
  /** Short range line under the wordmark on globe tiles. */
  range: string;
  /** Wordmark typeface family so the row doesn't read as one repeated font. */
  face: "serif" | "sans";
  /** Official single-colour SVG (optional) — see note above. */
  logo?: string;
};

export const BRANDS: Brand[] = [
  { slug: "century", name: "Century", range: "Veneers & Plywood", face: "sans" },
  { slug: "greenply", name: "Greenply", range: "Veneers & Plywood", face: "sans" },
  { slug: "greenlam", name: "Greenlam", range: "Laminates & Veneers", face: "serif" },
  { slug: "duroply", name: "Duroply", range: "Plywood", face: "sans" },
  { slug: "kitply", name: "Kitply", range: "Plywood", face: "sans" },
  { slug: "merino", name: "Merino", range: "Laminates", face: "serif" },
  { slug: "formica", name: "Formica", range: "Laminates", face: "sans" },
  { slug: "wilsonart", name: "Wilsonart", range: "Laminates", face: "serif" },
  { slug: "archidply", name: "Archidply", range: "Plywood", face: "sans" },
  { slug: "sharonply", name: "Sharon Ply", range: "Plywood", face: "serif" }
];

export const brandTileSrc = (brand: Brand) => `/images/brands/${brand.slug}.svg`;
