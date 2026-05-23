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
          100: "#fcebe2",
          200: "#fad5bf",
          500: "#f07d3b",
          700: "#c24d1a",
        },
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
