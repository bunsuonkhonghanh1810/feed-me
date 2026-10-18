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
        "canteen-amber": "#FFB703",
        "canteen-amber-light": "#FFDE82",
        "fresh-mint": "#06D6A0",
        "fresh-mint-dark": "#005D43",
        "warm-terracotta": "#E76F51",
        "terracotta-dark": "#731A04",
        "deep-navy": "#1D3557",
        "soft-cream": "#FFFDF9",
        "surface": "#F9F9FF",
        "surface-container-low": "#F0F3FF",
        "surface-container": "#E7EEFF",
        "surface-container-high": "#DEE8FF",
        "surface-card": "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
