/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "outline-variant": "#333333",
        "primary-fixed-dim": "#ffffff",
        "on-primary-fixed-variant": "#000000",
        "primary": "#ffffff",
        "surface-container-high": "#1a1a1a",
        "surface-container-lowest": "#000000",
        "surface-bright": "#2a2a2a",
        "tertiary": "#888888",
        "secondary": "#dddddd",
        "surface-container-low": "#0a0a0a",
        "surface": "#050505",
        "on-surface-variant": "#a3a3a3",
        "surface-variant": "#111111",
        "error": "#ff5555",
        "on-surface": "#ffffff",
        "surface-container": "#0f0f0f",
        "primary-container": "#222222",
        "on-primary-container": "#ffffff",
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "label-md": ["Geist", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"],
        "label-sm": ["Geist", "sans-serif"]
      }
    },
  },
  plugins: [],
}
