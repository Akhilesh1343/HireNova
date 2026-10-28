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
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // HireNova Emerald & Obsidian Visual System Tokens (Prompt Specs)
        void: '#050807',
        obsidian: {
          950: '#020403',
          900: '#050807', // Main background
          850: '#0B1210', // Card background
          800: '#0E1714', // Elevated surface
          750: '#131F1B', // Active/hover surface
          700: '#182A24', // Subtle borders
          600: '#223C34', // Secondary borders
          500: '#4D6B60', // Subtle text
          400: '#94A3A8', // Secondary text (#94A3A8)
          300: '#CBD5D0', // Body text
          200: '#E2E8E5', // High contrast text
          100: '#F1F5F3',
          50: '#F8FAFC',  // Primary text (#F8FAFC)
        },
        navy: {
          950: '#020403',
          900: '#050807', // Base deep near-black emerald
          850: '#0B1210', // Card emerald background
          800: '#0E1714',
          750: '#131F1B',
          700: '#182A24',
          600: '#223C34',
          500: '#4D6B60',
          400: '#94A3A8',
          300: '#CBD5D0',
          200: '#E2E8E5',
          100: '#F8FAFC',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0', // Light mint (#A7F3D0)
          300: '#6EE7B7',
          400: '#34D399', // Bright accent (#34D399)
          500: '#10B981',
          600: '#059669', // Primary accent (#059669)
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
        mint: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#A7F3D0', // Light mint
          300: '#6EE7B7',
          400: '#34D399', // Bright accent
          500: '#10B981',
          600: '#059669',
        },
        indigo: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0', // Light mint
          300: '#6EE7B7',
          400: '#34D399', // Bright accent
          500: '#10B981',
          600: '#059669', // Primary accent
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#0B1D16',
        },
        purple: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0', // Light mint
          300: '#6EE7B7',
          400: '#34D399', // Bright accent
          500: '#10B981',
          600: '#059669', // Primary accent
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#0B1D16',
        },
        violet: {
          400: '#34D399', // Replaced with bright emerald accent
          500: '#10B981',
          600: '#059669', // Replaced with primary emerald
          700: '#047857',
          900: '#064E3B',
        },
        cyan: {
          300: '#A7F3D0',
          400: '#34D399', // Bright mint accent
          500: '#10B981',
          600: '#059669',
          900: '#064E3B',
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
          white: '#0B1210',
          surface: '#0B1210',
          card: '#0B1210',
          subtle: '#131F1B',
          border: 'rgba(52, 211, 153, 0.12)',
          muted: '#94A3A8',
          text: '#F8FAFC',
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
