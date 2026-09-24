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
        fiverr: {
          green: '#1dbf73',
          hover: '#19a463',
          dark: '#0e7041',
          light: '#e8faf0',
          accent: '#10b981'
        },
        surface: {
          900: '#0b0f17',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
          500: '#4b5563'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
