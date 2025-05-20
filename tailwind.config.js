/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'mohero': {
          dark: '#111111',
          sidebar: '#1a1a1a',
          card: '#222222',
          accent: '#84cc16', // lime-500
          'accent-hover': '#65a30d', // lime-600
          background: '#ecf0f4'
        },
      },
    },
  },
  plugins: [],
};
