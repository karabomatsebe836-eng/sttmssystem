/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          dark: '#152A47',
          light: '#2E5278',
        },
        secondary: {
          DEFAULT: '#0F766E',
          dark: '#0A5852',
          light: '#14837B',
        },
        success: '#15803D',
        warning: '#B45309',
        danger: '#B91C1C',
        background: '#FFFFFF',
        surface: {
          DEFAULT: '#F8FAFC',
          dark: '#F1F5F9',
        },
        text: {
          primary: '#111827',
          secondary: '#374151',
          muted: '#6B7280',
        },
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#CBD5E1',
        },
      },
    },
  },
  plugins: [],
};
