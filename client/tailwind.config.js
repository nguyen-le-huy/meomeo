/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        matcha: "#F5F0E8",
        coal: "#141413",
        canvas: "#FAF9F5",
        coral: {
          DEFAULT: "#CC785C",
          dark: "#A9583E",
        },
        cream: {
          DEFAULT: "#EFE9DE",
          soft: "#F5F0E8",
          strong: "#E8E0D2",
        },
        ink: {
          DEFAULT: "#141413",
          body: "#3D3D3A",
          muted: "#6C6A64",
        },
      },
      fontFamily: {
        sans: ['"Google Sans"', "Arial", "sans-serif"],
        display: ['"Google Sans"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
