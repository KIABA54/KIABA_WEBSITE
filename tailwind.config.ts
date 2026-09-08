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
        brand: {
          pink: {
            50: "#FDF2F8",
            100: "#FCE7F3",
            200: "#FBCFE8",
            300: "#F472B6",
            500: "#EC4899",
            600: "#DB2777",
            700: "#BE185D",
          },
          blue: {
            50: "#EFF6FF",
            100: "#DBEAFE",
            500: "#3B82F6",
            600: "#2563EB",
            700: "#1D4ED8",
            800: "#1E40AF",
            900: "#1E3A8A",
            950: "#0F172A",
          },
          cyan: {
            400: "#38BDF8",
            500: "#0EA5E9",
            600: "#0284C7",
          },
          dark: "#0B0F19",
          gold: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
