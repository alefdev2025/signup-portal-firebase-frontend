/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'brand-dark': '#13263f',
        'brand-purple': '#6f2d74',
        'brand-gold': '#d6a851',
        'brand-tan': '#ca8d62',
      }
    }
  },
  plugins: [],
}

