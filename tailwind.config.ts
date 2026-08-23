import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/templates/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Smallest phones still in use (iPhone SE 1st gen and similar) are 320px.
      // `xs` gives layouts a step between that and Tailwind's 640px `sm`.
      screens: {
        xs: '400px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#8B6F5C",
          50: "#F7F3F0",
          100: "#EDE5DF",
          200: "#D9C9BD",
          300: "#C4AB99",
          400: "#B08D77",
          500: "#8B6F5C",
          600: "#6F594A",
          700: "#534337",
          800: "#382D25",
          900: "#1C1712",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D4A574",
          50: "#FBF6F0",
          100: "#F5EADD",
          200: "#EBD5BB",
          300: "#E0BF99",
          400: "#D4A574",
          500: "#C48C52",
          600: "#A5713B",
          700: "#7C552C",
          800: "#53391E",
          900: "#2A1D0F",
          foreground: "#2D2926",
        },
        accent: {
          DEFAULT: "#C97B7B",
          50: "#FAF0F0",
          100: "#F3DEDE",
          200: "#E7BCBC",
          300: "#DA9A9A",
          400: "#C97B7B",
          500: "#B85C5C",
          600: "#964848",
          700: "#713636",
          800: "#4B2424",
          900: "#261212",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#7BAF7B",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#C75050",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        script: ["var(--font-great-vibes)", "cursive"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
