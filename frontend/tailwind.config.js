/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0f1a',
          900: '#11172a',
          800: '#1a2238',
          700: '#252f4a',
        },
        ember: {
          400: '#ff9966',
          500: '#ff7a45',
          600: '#f25c2e',
        },
        sky: {
          400: '#5eb8ff',
          500: '#3b9eff',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(91, 184, 255, 0.35)',
      },
    },
  },
  plugins: [],
};
