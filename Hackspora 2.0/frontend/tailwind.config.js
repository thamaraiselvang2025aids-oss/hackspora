/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        surface: "#F8FAFC",
        "surface-card": "#FFFFFF",
        "surface-border": "rgba(0, 0, 0, 0.1)",
        brown: {
          DEFAULT: "#5D4037",
          light: "#8D6E63",
          dark: "#3E2723"
        },
        accent: {
          DEFAULT: "#7C3AED", // Violet
          light: "#8B5CF6",
          dark: "#6D28D9",
          glow: "rgba(124, 58, 237, 0.15)"
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
