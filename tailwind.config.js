/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#b9dcff",
          300: "#8bc7ff",
          400: "#52a8ff",
          500: "#007aff",
          600: "#006ee6",
          700: "#005bbf",
          800: "#004b99",
          900: "#003f7a",
          950: "#00284d",
        },
        warm: {
          50: "#f7f8fb",
          100: "#eef1f6",
          200: "#dde3ec",
          500: "#697386",
          700: "#374151",
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
