/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // HireNova Visual System Tokens
        void: '#070B14',
        navy: {
          950: '#04070D',
          900: '#070B14', // Base deep navy / near-black
          850: '#0B1020', // Secondary dark layer / panel
          800: '#0F172A', // Card navy
          750: '#131D33', // Elevated surface
          700: '#1A2642', // Structural borders & dividers
          600: '#25355A', // Secondary borders
          500: '#475569', // Subtle text
          400: '#94A3B8', // Secondary muted text
          300: '#CBD5E1', // Body text on dark
          200: '#E2E8F0', // High contrast text on dark
          100: '#F1F5F9',
        },
        violet: {
          400: '#A78BFA',
          500: '#8B5CF6', // Electric violet accent
          600: '#7C3AED',
          700: '#6D28D9',
          900: '#2E1065',
        },
        cyan: {
          300: '#7DD3FC',
          400: '#4FD1FF', // Electric cyan accent
          500: '#0EA5E9',
          600: '#0284C7',
          900: '#0C4A6E',
        },
        orange: {
          400: '#FF8C5A',
          500: '#FF6B35', // Warm orange accent
          600: '#EA580C',
          700: '#C2410C',
          900: '#7C2D12',
        },
        // Warm white & light section tokens
        warm: {
          white: '#F8F9FA',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          subtle: '#F1F5F9',
          border: '#E2E8F0',
          muted: '#94A3B8',
          text: '#0F172A',
        }
      },
      fontFamily: {
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'card-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.1)',
        'panel': '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        'grid-light': 'linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
        'radial-radial': 'radial-gradient(circle at 50% 0%, rgba(79, 209, 255, 0.12), transparent 70%)',
      }
    },
  },
  plugins: [],
}
