/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        concern: {
          low: '#16a34a',       // Green
          moderate: '#f59e0b',  // Amber
          watch: '#dc2626',     // Red
          allergen: '#dc2626',  // Red alert
        },
        slate: {
          850: '#152033',
        }
      },
      fontSize: {
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'explanation': ['1.0625rem', { lineHeight: '1.625rem' }],
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'card-light': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
