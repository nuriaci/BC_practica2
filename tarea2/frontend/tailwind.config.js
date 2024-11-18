/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        elegant: ['"Playfair Display"', 'serif'],
      },
      colors: {
        dark: '#111111',
      },
    },
  },
  plugins: [],
}
