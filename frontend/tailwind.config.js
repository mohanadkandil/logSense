/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Your beautiful light-to-dark color pairs
        mint: {
          light: '#DEF5EE',
          dark: '#8EE4C9',
        },
        purple: {
          light: '#ECE3FF',
          dark: '#9665FF',
        },
        yellow: {
          light: '#FFEFA4',
          dark: '#FFDD40',
        },
        blue: {
          light: '#E7EFFF',
          dark: '#76A1FB',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}