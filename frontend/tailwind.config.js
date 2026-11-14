const v = (n) => `rgb(var(${n}) / <alpha-value>)`;
const scale = (p, keys) => Object.fromEntries(keys.map((k) => [k, v(`--${p}-${k}`)]));
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"Google Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        slate: scale('s', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        cyan: scale('c', [300, 400, 500]), // accent (blue) - name kept so existing classes follow the theme
      },
    },
  },
  plugins: [],
};
