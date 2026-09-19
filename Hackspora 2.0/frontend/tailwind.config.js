/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1220",
        surface: "#101A2D",
        "surface-card": "#152238",
        "surface-border": "rgba(255, 255, 255, 0.08)",
        accent: {
          DEFAULT: "#14B8A6", // Teal
          light: "#2DD4BF",
          dark: "#0F766E",
          glow: "rgba(20, 184, 166, 0.15)"
        },
        danger: {
          DEFAULT: "#F43F5E", // Rose
          light: "#FB7185",
          dark: "#BE123C",
          glow: "rgba(244, 63, 94, 0.2)"
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24"
        },
        success: {
          DEFAULT: "#22C55E",
          light: "#4ADE80"
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan 3s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.2' },
          '50%': { transform: 'translateY(100%)', opacity: '0.8' }
        }
      }
    },
  },
  plugins: [],
}
