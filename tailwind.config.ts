import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // MyConnectedCare (prototype): calm teal
        mcc: { 50: "#eefaf8", 100: "#d5f2ee", 600: "#0b6e69", 700: "#085a56", 800: "#064744", 900: "#043331" },
        // Intake Assistant: clean indigo admin
        ia: { 50: "#f1f3fd", 100: "#e1e6fb", 600: "#3b4cc0", 700: "#2f3d9c", 800: "#253079" },
        // EMR: dense clinical slate/blue
        emr: { 50: "#f3f6f9", 100: "#e3e9f0", 600: "#1f4e79", 700: "#173b5c", 800: "#0f2940" },
      },
    },
  },
  plugins: [],
} satisfies Config;
