/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef8ee",
          100: "#fdf0d5",
          200: "#f9dda9",
          300: "#f5c573",
          400: "#f0a83b",
          500: "#ed9317",
          600: "#dd780d",
          700: "#b75c0e",
          800: "#924913",
          900: "#763c13",
          950: "#401d06",
        },
        warm: {
          50: "#fdf8f6",
          100: "#f9e9e2",
          200: "#f4d6c9",
          300: "#ebb9a3",
          400: "#e09372",
          500: "#d47347",
          600: "#c35d3b",
          700: "#a24a32",
          800: "#863f2d",
          900: "#6d3729",
          950: "#3a1a14",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Noto Sans SC",
          "sans-serif",
        ],
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
