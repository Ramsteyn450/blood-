/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blood: { 50:'#fff1f1',100:'#ffe4e4',200:'#ffbaba',300:'#ff8585',400:'#ff4d4d',500:'#f83b3b',600:'#e51d1d',700:'#c11414',800:'#9f1414',900:'#841818',950:'#490707' },
      },
      fontFamily: { display: ['"Playfair Display"','serif'], body: ['"DM Sans"','sans-serif'] },
    },
  },
  plugins: [],
};
