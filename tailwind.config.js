/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fff7f5',
          100: '#ffeee9',
          200: '#ffd9cf',
          300: '#ffbcac',
          400: '#ff9c85',
          500: '#f27a63',
        },
        rose: {
          50: '#fff1f4',
          100: '#ffe1e7',
          200: '#ffc0cd',
          300: '#f79bb0',
          400: '#e8748f',
          500: '#d15a76',
          600: '#b5445f',
        },
        plum: {
          400: '#8a6b7c',
          500: '#6b4d5e',
          600: '#4a3546',
          700: '#3a2938',
        },
        gold: {
          300: '#f0d9a8',
          400: '#e0bc7a',
          500: '#cf9f52',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Quicksand"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
