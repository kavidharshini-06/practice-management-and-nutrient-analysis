/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ayur: {
          bg: '#fcfbf7', // Warm herb-white background
          card: '#ffffff',
          text: '#2c3e2b', // Botanical black-green
          // Ayurvedic Dosha Palettes
          vata: {
            light: '#e0f2fe',
            solid: '#0284c7',
            dark: '#0369a1'
          },
          pitta: {
            light: '#fef3c7',
            solid: '#d97706',
            dark: '#b45309'
          },
          kapha: {
            light: '#dcfce7',
            solid: '#16a34a',
            dark: '#15803d'
          },
          // Core Theme
          brand: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          accent: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(22, 101, 52, 0.08), 0 2px 8px -1px rgba(22, 101, 52, 0.04)',
        'premium-hover': '0 10px 30px -4px rgba(22, 101, 52, 0.12), 0 4px 12px -2px rgba(22, 101, 52, 0.06)',
      }
    },
  },
  plugins: [],
}
