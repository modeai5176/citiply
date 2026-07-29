// Pure, server/client-agnostic helper split out from lib/projects-data.ts —
// that module imports lib/supabase/admin.ts ("server-only"), so a client
// component cannot import a runtime value from it. This file only takes a
// type-only import of Project (erased at compile time), so it is safe for
// components/home/RealProjects.tsx and other client components to use
// directly, alongside the server-side app/(public)/projects/page.tsx.
import type { Project } from "@/lib/projects-data";

const FAMILY_KEYWORDS: Array<[string, RegExp]> = [
  ["Plywood", /plywood/i],
  ["Flooring", /floor|plank/i],
  ["Exterior", /facade|cladding|exterior/i],
  ["Millwork", /joinery|millwork|shutter|wardrobe|cabinet/i]
];

// The `projects` table has no product-family relation, so "which CITIPLY
// families were used" is derived from the chip data admins already fill in —
// non-empty chip groups map directly, and recommendedMaterials free text is
// keyword-matched against the remaining families.
export function deriveFamiliesUsed(project: Project): string[] {
  const found = new Set<string>();
  if (project.veneerTones.length) found.add("Veneers");
  if (project.flutedPanels.length) found.add("Panels");
  if (project.doors.length) found.add("Doors");
  if (project.laminates.length) found.add("Laminates");

  const materialsText = project.recommendedMaterials.map((chip) => chip.label).join(" | ");
  FAMILY_KEYWORDS.forEach(([family, pattern]) => {
    if (pattern.test(materialsText)) found.add(family);
  });

  return Array.from(found);
}
