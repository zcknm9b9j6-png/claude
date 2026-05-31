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
        blue: { DEFAULT: "#2D7DD2", tint: "#E8F1FB", shade: "#2468B2" },
        ink: { DEFAULT: "#1C1533", soft: "#4A4560" },
        paper: "#FBFAF7",
      },
      fontFamily: {
        sans: ['Aptos', 'Arial', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        "logo-in": {
          "0%": { opacity: "0", transform: "scale(0.8) rotate(-6deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "logo-in": "logo-in 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.35s ease both",
      },
    },
  },
  plugins: [],
};
