/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material 3 color tokens (placeholder - will be refined later)
        primary: {
          DEFAULT: '#6750A4',
          50: '#F6F4FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        secondary: {
          DEFAULT: '#625B71',
          50: '#F9F8FB',
          100: '#F3F1F6',
          200: '#E7E4ED',
          300: '#D1CCD9',
          400: '#B3ACBE',
          500: '#958FA3',
          600: '#7A7489',
          700: '#625B71',
          800: '#4A4458',
          900: '#332D41',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
