/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFBEA',
          100: '#FFF3C4',
          200: '#FFE685',
          300: '#FFD54A',
          400: '#FFC107',
          500: '#F5B800',
          600: '#D9A000',
          700: '#A87A00',
          800: '#7A5800',
          900: '#4D3700',
        },
        ink: {
          DEFAULT: '#0C0B09',
          raised: '#161411',
          soft: '#9A948A',
          muted: '#6E6860',
          line: '#2A2620',
        },
        parchment: '#F4F0E6',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Sora', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      animation: {
        'fade-in': 'fadeIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        'rise': 'rise 1s cubic-bezier(0.22, 1, 0.36, 1) both',
        'reveal': 'reveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        'amber-drift': 'amberDrift 18s ease-in-out infinite alternate',
        'brand-mark': 'brandMark 1.15s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rise: {
          '0%': { transform: 'translateY(28px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        reveal: {
          '0%': { clipPath: 'inset(0 100% 0 0)', opacity: '0.4' },
          '100%': { clipPath: 'inset(0 0 0 0)', opacity: '1' },
        },
        amberDrift: {
          '0%': { transform: 'translate(-8%, -4%) scale(1)' },
          '100%': { transform: 'translate(6%, 8%) scale(1.12)' },
        },
        brandMark: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(12px)', letterSpacing: '0.12em' },
          '60%': { opacity: '1', transform: 'scale(1.02) translateY(0)', letterSpacing: '-0.01em' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)', letterSpacing: '-0.025em' },
        },
      },
    },
  },
  plugins: [],
}
