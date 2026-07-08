/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      /* -----------------------------------------
         GLOBAL BRAND COLORS
      ----------------------------------------- */
      colors: {
        primary: "#16a34a",          // Stomach (Green)
         orangeBrand: "#f97316",      // Pain Relief (Orange)
        blueBrand: "#3B82F6",        // Diabetes (Blue)
        danger: "#f43f5e",
        textGray: "#4b5563",
        bgCard: "#ffffff",
        orangeBrand: {
        DEFAULT: "#f57e42",
        light: "#ffc2a3", // <-- your light shade
      },

        brand: {
          light: "#E0F2FE",
          DEFAULT: "#3B82F6",
          dark: "#1E3A8A",
        }
      },

      /* -----------------------------------------
         GLOBAL FONT
      ----------------------------------------- */
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      /* -----------------------------------------
         CARD DESIGN SYSTEM
      ----------------------------------------- */
      borderRadius: {
        card: "16px",
        button: "14px",
      },

      /* Shadows */
     boxShadow: {
    card: "0 4px 12px rgba(0,0,0,0.08)",      // soft shadow
    cardHover: "0 8px 20px rgba(0,0,0,0.12)", // hover shadow
  },

      /* Card Image Height */
      spacing: {
        cardImg: "160px",
      },

      /* Uniform Padding for all Cards */
  padding: {
    card: "18px",         // more spacing like screenshot
  },
      /* Fixed card height for perfect alignment */

  height: {
    card: "400px",        // screenshot card height
    cardImg: "150px",     // image section height
  },

  minHeight: {
    card: "400px",
  },
      maxHeight: {
        card: "340px",
      },

      /* Uniform Card Width (auto in grid but limiting size) */
      width: {
        card: "100%",   // makes sure all cards fill their grid space equally
      },
      maxWidth: {
        card: "200px",  // keeps card size consistent across grid
      },
        /* -----------------------------------------
     GRID ALIGNMENT (matches screenshot)
  ----------------------------------------- */
  spacing: {
    cardGap: "20px",
  },
    },
  },
  plugins: [],
};
