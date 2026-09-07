import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: {
          50: '#151D2F',
          100: '#1E293B',
          200: '#283548',
          300: '#334155',
        },
        brand: {
          teal: '#06b6d4',
          cyan: '#22d3ee',
          sky: '#38bdf8',
          blue: '#2563eb',
        },
        risk: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#f59e0b',
          low: '#10b981',
          minimal: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
