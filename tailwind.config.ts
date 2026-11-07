import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0B1F3A", 700: "#12305a" },
        emerald: { DEFAULT: "#0E7C5A", 50: "#ecfaf4", 700: "#0a5f45" },
        gold: { DEFAULT: "#D4A017", 50: "#fdf7e3", 700: "#D4A017" },
      },
    },
  },
  plugins: [],
} satisfies Config;
