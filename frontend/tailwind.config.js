import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#020817', ink: '#061a3d', panel: '#0d1c29',
        cyan: '#22baff', electric: '#1689db', magenta: '#ec32bd',
        fog: '#f7f2f3', muted: '#c2cad8', dim: '#849aa6',
      },
      fontFamily: { display: ['Bodoni Moda', 'serif'], sans: ['Manrope', 'sans-serif'], mono: ['DM Mono', 'monospace'] },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(91,217,237,.3), 0 0 60px rgba(91,217,237,.1)',
        'glow-blue': '0 0 20px rgba(66,140,245,.3), 0 0 60px rgba(66,140,245,.1)',
        'glow-magenta': '0 0 20px rgba(217,98,197,.3)',
      },
      spacing: { '18': '4.5rem', '22': '5.5rem', '26': '6.5rem' },
    },
  },
  plugins: [forms],
};
