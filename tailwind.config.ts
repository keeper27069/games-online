import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0c14",
        foreground: "#f8fafc",
        arcade: {
          dark: "#080a10",
          card: "#121726",
          cardBorder: "#1e293b",
          neonPurple: "#a855f7",
          neonBlue: "#00d2ff",
          neonPink: "#ff2a85",
          neonGreen: "#10b981",
          neonYellow: "#fbbf24",
          neonCyan: "#06b6d4",
          neonOrange: "#f97316",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 210, 255, 0.35)",
        "neon-pink": "0 0 20px rgba(255, 42, 133, 0.35)",
        "neon-purple": "0 0 20px rgba(168, 85, 247, 0.35)",
        "neon-green": "0 0 20px rgba(16, 185, 129, 0.35)",
        "neon-yellow": "0 0 20px rgba(251, 191, 36, 0.35)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "dice-shake": "diceShake 0.5s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(0, 210, 255, 0.6))" },
          "50%": { opacity: "0.7", filter: "drop-shadow(0 0 5px rgba(0, 210, 255, 0.2))" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        diceShake: {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(-12deg) scale(1.1)" },
          "75%": { transform: "rotate(12deg) scale(1.1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
