import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#16A34A',
        'primary-light': '#DCFCE7',
        'primary-border': '#86EFAC',
        error: '#DC2626',
        'error-light': '#FEF2F2',
        'error-border': '#FCA5A5',
        amber: '#D97706',
        'amber-light': '#FFFBEB',
        'amber-border': '#FCD34D',
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
