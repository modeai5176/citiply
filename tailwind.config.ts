import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        surface: "#F5F3EF",
        border: "#E5E2DC",
        accent: "#C9A96E",
        dark: "#111111",
        text: {
          primary: "#1A1A1A",
          secondary: "#555550",
          muted: "#9A9892"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"]
      },
      boxShadow: {
        premium: "0 24px 60px rgba(17, 17, 17, 0.12)",
        soft: "0 12px 28px rgba(17, 17, 17, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
