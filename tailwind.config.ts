import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm paper canvas
        canvas: {
          DEFAULT: '#F7F6F2',
          soft: '#FBFAF8',
          sunk: '#F0EEE8',
          raised: '#FFFFFF',
        },
        // Ink (text + structure)
        ink: {
          DEFAULT: '#14181A',
          900: '#14181A',
          800: '#23292A',
          700: '#3A403D',
          500: '#5C625E',
          400: '#7A807B',
          300: '#9aa09b',
        },
        // Forest accent system
        forest: {
          50: '#EAF1ED',
          100: '#D6E5DC',
          200: '#A9C9B8',
          300: '#6FA589',
          400: '#3C8163',
          500: '#1E5C44',
          600: '#184C38',
          700: '#143E2E',
          900: '#0F2D22',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '1180px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'grid-ink':
          'linear-gradient(to right, rgba(20,24,26,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,24,26,0.045) 1px, transparent 1px)',
        'radial-forest':
          'radial-gradient(60% 60% at 50% 0%, rgba(30,92,68,0.12) 0%, rgba(30,92,68,0) 70%)',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,24,26,0.04), 0 18px 40px -24px rgba(20,24,26,0.25)',
        raised: '0 1px 0 rgba(255,255,255,0.6) inset, 0 24px 60px -28px rgba(20,24,26,0.35)',
        glow: '0 0 0 1px rgba(30,92,68,0.15), 0 18px 50px -20px rgba(30,92,68,0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease forwards',
      },
    },
  },
  plugins: [],
};

export default config;
