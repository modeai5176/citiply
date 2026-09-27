// Generates the square brand tiles used on the hero globe from lib/brands.ts.
// Run: npx tsx scripts/generate-brand-tiles.ts
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BRANDS, type Brand } from "../lib/brands";

const OUT_DIR = path.join(process.cwd(), "public", "images", "brands");
const SIZE = 600;
const GOLD = "#C9A75C";

// SVGs rendered through <img> can't load web fonts, so stick to fonts every OS ships.
const FONTS = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
};

function escape(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tile(brand: Brand) {
  const serif = brand.face === "serif";
  const word = serif ? brand.name : brand.name.toUpperCase();
  // Shrink long names so they sit comfortably inside the frame.
  const fontSize = Math.min(serif ? 92 : 74, Math.floor((serif ? 820 : 700) / word.length));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#2B241E"/>
      <stop offset="100%" stop-color="#141110"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <rect x="36" y="36" width="${SIZE - 72}" height="${SIZE - 72}" fill="none" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="1.5"/>
  <text x="50%" y="${SIZE / 2 + fontSize * 0.18}" text-anchor="middle" fill="${GOLD}"
    font-family="${FONTS[brand.face]}" font-size="${fontSize}" font-weight="${serif ? 400 : 600}"
    letter-spacing="${serif ? 1 : fontSize * 0.08}">${escape(word)}</text>
  <line x1="${SIZE / 2 - 40}" x2="${SIZE / 2 + 40}" y1="${SIZE / 2 + fontSize * 0.55}" y2="${SIZE / 2 + fontSize * 0.55}" stroke="${GOLD}" stroke-opacity="0.6" stroke-width="1.5"/>
  <text x="50%" y="${SIZE / 2 + fontSize * 0.55 + 46}" text-anchor="middle" fill="#F2EDE4" fill-opacity="0.6"
    font-family="${FONTS.sans}" font-size="20" letter-spacing="5">${escape(brand.range.toUpperCase())}</text>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const brand of BRANDS) {
  writeFileSync(path.join(OUT_DIR, `${brand.slug}.svg`), tile(brand));
  console.log(`wrote public/images/brands/${brand.slug}.svg`);
}
