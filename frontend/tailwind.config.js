/** @type {import('tailwindcss').Config} */
// Calm palette: the app's existing `indigo` and `slate` classes are remapped, so every screen picks it up.
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'] },
      colors: {
        indigo: { 50: '#EEF6F6', 100: '#D5E9EA', 200: '#AFD3D6', 300: '#7DB6BB', 400: '#4F979E', 500: '#327C84', 600: '#276A71', 700: '#20565C', 800: '#1C464B', 900: '#17393D' },
        slate: { 50: '#F5F7F6', 100: '#EAEFED', 200: '#D8E0DD', 300: '#BCC8C4', 400: '#8D9C98', 500: '#66766F', 600: '#4E5D58', 700: '#3B4843', 800: '#28332F', 900: '#182320' },
      },
      borderRadius: { xl: '14px' },
    },
  },
  plugins: [],
};
