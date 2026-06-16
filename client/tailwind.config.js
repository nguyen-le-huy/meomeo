/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        matcha: "#C2D8C4",
        coal: "#222222",
      },
      fontFamily: {
        sans: ['"Google Sans"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
