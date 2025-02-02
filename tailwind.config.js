/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      tablet: "640px",
    },
    extend: {
      colors: {
        "Green-Custom": "#c8e29c",
      },
    },
  },
  plugins: [],
};
