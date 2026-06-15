/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        'bugatti-black': '#000000',
        'bugatti-dark': '#0a0a0a',
        'bugatti-light': '#f4f4f5',
        'bugatti-accent': '#a1a1aa',
        'bugatti-gold': '#c9b89a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif']
      },
      letterSpacing: {
        widest: '.25em',
        'widest-2': '0.35em',
      }
    },
  },
  plugins: [],
}
