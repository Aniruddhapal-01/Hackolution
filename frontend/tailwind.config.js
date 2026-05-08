/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        brand: { DEFAULT: "#3b82f6", dark: "#2563eb", light: "#60a5fa" },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
