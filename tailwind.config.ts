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
        ivory: "#F7F3EC",
        beige: "#EAE0D0",
        sand: "#D9C7A8",
        stone: "#BDB0A0",
        "soft-grey": "#C7C2B8",
        charcoal: "#1E1B18",
        espresso: "#2A1B12",
        "deep-brown": "#3B2A1E",
        gold: "#B8924C",
        /* preserve legacy tokens for existing pages */
        background: "#F7F3EC",
        surface: "#F5F3EF",
        border: "#E5E2DC",
        accent: "#B8924C",
        dark: "#1E1B18",
        text: {
          primary: "#1A1A1A",
          secondary: "#555550",
          muted: "#9A9892"
        }
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-general-sans)", "system-ui", "sans-serif"],
        /* preserve legacy vars for existing components */
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"]
      },
      maxWidth: {
        content: "1400px"
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
