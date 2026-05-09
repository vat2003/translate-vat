import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 18px 45px var(--shadow-panel)"
      }
    }
  },
  plugins: []
};

export default config;
