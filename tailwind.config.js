/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6750A4",
          50: "#F6F4FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        surface: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        success: {
          light: "#DCFCE7",
          DEFAULT: "#22C55E",
          dark: "#166534",
        },
        warning: {
          light: "#FEF3C7",
          DEFAULT: "#F59E0B",
          dark: "#92400E",
        },
        danger: {
          light: "#FEE2E2",
          DEFAULT: "#EF4444",
          dark: "#991B1B",
        },
        secondary: {
          DEFAULT: "#625B71",
          50: "#F9F8FB",
          100: "#F3F1F6",
          200: "#E7E4ED",
          300: "#D1CCD9",
          400: "#B3ACBE",
          500: "#958FA3",
          600: "#7A7489",
          700: "#625B71",
          800: "#4A4458",
          900: "#332D41",
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
