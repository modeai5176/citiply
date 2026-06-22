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
        /* All colors resolve to CSS variables so themes (data-theme on <html>)
           re-skin the entire site. The -rgb channel vars enable Tailwind alpha
           modifiers, e.g. bg-ivory/50. */
        ivory: "rgb(var(--color-ivory-rgb) / <alpha-value>)",
        beige: "rgb(var(--color-beige-rgb) / <alpha-value>)",
        sand: "rgb(var(--color-sand-rgb) / <alpha-value>)",
        stone: "rgb(var(--color-stone-rgb) / <alpha-value>)",
        "soft-grey": "rgb(var(--color-soft-grey-rgb) / <alpha-value>)",
        charcoal: "rgb(var(--color-charcoal-rgb) / <alpha-value>)",
        espresso: "rgb(var(--color-espresso-rgb) / <alpha-value>)",
        "deep-brown": "rgb(var(--color-deep-brown-rgb) / <alpha-value>)",
        gold: "rgb(var(--color-gold-rgb) / <alpha-value>)",
        /* semantic / legacy tokens — also theme-driven */
        background: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        accent: "rgb(var(--color-gold-rgb) / <alpha-value>)",
        dark: "rgb(var(--color-charcoal-rgb) / <alpha-value>)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)"
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
