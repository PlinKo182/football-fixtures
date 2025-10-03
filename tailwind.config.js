/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media', // Usa as preferências do sistema
  theme: {
    extend: {
      colors: {
        'ff-muted': '#6b7280',
      },
      fontSize: {
        'ff-lead': '0.95rem',
      },
      spacing: {
        'ff-card-pad': '0.75rem'
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtils = {
        '.text-ff-title': { 'fontWeight': '600' },
        '.text-ff-subtitle': { 'fontWeight': '500', 'fontSize': '0.95rem' },
        '.text-ff-meta': { 'fontSize': '0.8rem', 'color': '#6b7280' },
        '.text-ff-team': { 'fontSize': '0.95rem', 'fontWeight': '500', 'letterSpacing': '-0.01em' }
      };
      addUtilities(newUtils, ['responsive']);
    }
  ],
}