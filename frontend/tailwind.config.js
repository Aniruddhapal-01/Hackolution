/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e293b", 
        "primary-container": "#d8e2ff",
        "on-primary-container": "#001a41",
        secondary: "#6366f1",
        tertiary: "#10b981",
        "tertiary-fixed": "#9cf4d5",
        "on-tertiary-fixed": "#002117",
        "primary-fixed": "#d8e2ff",
        "on-primary-fixed": "#001a41",
        bg: {
          primary: "#f7f9fb",
          secondary: "#ffffff",
          tertiary: "#181c22",
          card: "#ffffff",
        },
        accent: {
          teal: "#00e5a0",
          blue: "#3b82f6",
          amber: "#f59e0b",
          red: "#f43f5e",
        },
        border: {
          dim: "rgba(0,0,0,0.07)",
          muted: "rgba(0,0,0,0.13)",
          bright: "rgba(0,0,0,0.22)",
        },
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        display: ["Syne", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
