/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        matcha: "rgb(var(--color-matcha-rgb) / <alpha-value>)",
        coal: "rgb(var(--color-coal-rgb) / <alpha-value>)",
        canvas: "rgb(var(--color-canvas-rgb) / <alpha-value>)",
        coral: {
          DEFAULT: "#CC785C",
          dark: "#A9583E",
        },
        cream: {
          DEFAULT: "rgb(var(--color-cream-rgb) / <alpha-value>)",
          soft: "rgb(var(--color-cream-soft-rgb) / <alpha-value>)",
          strong: "rgb(var(--color-cream-strong-rgb) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-coal-rgb) / <alpha-value>)",
          body: "rgb(var(--color-ink-body-rgb) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted-rgb) / <alpha-value>)",
        },
        hairline: "rgb(var(--color-hairline-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Google Sans"', "Arial", "sans-serif"],
        display: ['"Google Sans"', "Arial", "sans-serif"],
        roboto: ['"Roboto"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
