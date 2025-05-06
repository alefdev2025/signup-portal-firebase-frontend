/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#13263f',
        'brand-purple': '#6c4674',
        'brand-gold': '#d6a851',
        'brand-tan': '#ca8d62',
      }
    }
  },
  plugins: [],
}

