/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base:     'var(--bg-base)',
          panel:    'var(--bg-panel)',
          hover:    'var(--bg-hover)',
          selected: 'var(--bg-selected)',
        },
        fg: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
        border:  'var(--border)',
        accent: {
          DEFAULT: 'var(--accent, #f97316)',
          soft:    'var(--accent-soft, rgba(249,115,22,0.12))',
        },
        grad: 'var(--grad, #f97316)',
      },
      boxShadow: {
        panel: 'var(--shadow)',
      },
    }
  },
  plugins: [
    ({ addUtilities }) => addUtilities({
      '.app-drag':    { WebkitAppRegion: 'drag' },
      '.app-no-drag': { WebkitAppRegion: 'no-drag' },
    })
  ]
}
