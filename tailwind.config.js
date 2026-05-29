/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Fair Play OOSH brand palette — base / tint (10%) / shade (hover)
        teal: { DEFAULT: "#14B4C8", tint: "#E9F9FB", shade: "#1EA3B6" },
        purple: { DEFAULT: "#8C148C", tint: "#F4E9F4", shade: "#7A2178" },
        orange: { DEFAULT: "#F06414", tint: "#FDECE2", shade: "#D8531A" },
        lime: { DEFAULT: "#A0C828", tint: "#F1F7E1", shade: "#87AE29" },
        pink: { DEFAULT: "#DC008C", tint: "#FDE6F3", shade: "#C80077" },
        ink: { DEFAULT: "#1C1533", soft: "#4A4560" },
        paper: "#FBFAF7",
      },
      fontFamily: {
        sans: ['Aptos', 'Arial', 'Helvetica', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
