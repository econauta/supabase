/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#212529',
          800: '#343a40',
          700: '#495057',
        },
        gray: {
          600: '#6c757d',
          500: '#adb5bd',
          400: '#ced4da',
        },
        light: {
          300: '#dee2e6',
          200: '#e9ecef',
          100: '#f8f9fa',
        },
        accent: '#32CF8B',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '1px',
        md: '2px',
        lg: '2px',
        xl: '3px',
        '2xl': '4px',
      },
    },
  },
  plugins: [],
};
