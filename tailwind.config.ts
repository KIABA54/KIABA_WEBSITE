import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette rouge/noir (remplace l'ancienne rose/bleu). Les clés
        // "pink"/"blue" sont gardées telles quelles — des dizaines de
        // composants utilisent déjà `brand-pink-*`/`brand-blue-*` partout
        // dans le site — seules les VALEURS changent, donc tout le site
        // (boutons, badges, textes...) suit automatiquement sans avoir à
        // toucher chaque fichier individuellement.
        brand: {
          pink: {
            // → ROUGE (remplace l'ancien rose)
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626",
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
          },
          blue: {
            // → NOIR / gris neutre (remplace l'ancien bleu)
            50: "#F7F7F7",
            100: "#EBEBEB",
            200: "#D6D6D6",
            300: "#B0B0B0",
            400: "#7A7A7A",
            500: "#4A4A4A",
            600: "#2E2E2E",
            700: "#1C1C1C",
            800: "#101010",
            900: "#000000",
            950: "#000000",
          },
          cyan: {
            50: "#F0F9FF",
            100: "#E0F2FE",
            400: "#38BDF8",
            500: "#0EA5E9",
            600: "#0284C7",
            700: "#0369A1",
          },
          dark: "#0B0F19",
          gold: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        "3xs": ["0.625rem", { lineHeight: "0.875rem" }],
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 20px -8px rgba(0,0,0,0.18)",
        "card-hover": "0 2px 6px 0 rgba(15,23,42,0.06), 0 14px 28px -10px rgba(0,0,0,0.28)",
        "glow-pink": "0 8px 24px -6px rgba(239,68,68,0.45)",
        popover: "0 12px 40px -8px rgba(15,23,42,0.25)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        zoomIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-in": "fadeIn 180ms ease-out",
        "zoom-in": "zoomIn 180ms cubic-bezier(0.16,1,0.3,1)",
        "slide-up": "slideUp 280ms cubic-bezier(0.16,1,0.3,1)",
        "slide-in-right": "slideInRight 280ms cubic-bezier(0.16,1,0.3,1)",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
