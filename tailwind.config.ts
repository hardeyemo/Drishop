import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        // gold.DEFAULT is for fills (use black text on it). gold.deep is the
        // text-safe gold: ~6:1 contrast on white.
        gold: {
          DEFAULT: "#C9A24B",
          bright: "#D8B25C",
          deep: "#7A5A12",
          soft: "#F4EAD0",
        },
        surface: "#F5F5F4",
        line: "#E7E5E4",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
