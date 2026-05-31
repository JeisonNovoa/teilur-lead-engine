import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/dashboard/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colores para los fits, alineados con el sistema visual del CSV
        fit: {
          green: "#10b981",
          yellow: "#f59e0b",
          red: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
