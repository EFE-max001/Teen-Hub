import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-black': '#020008',
        'card-bg': '#0d0017',
        'neon-purple': '#a855f7',
        'deep-purple': '#3b0764',
        'mid-purple': '#6d28d9',
        'silver': '#94a3b8',
        'crimson': '#dc2626',
        'electric-blue': '#3b82f6',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      backgroundImage: {
        'purple-glow': 'radial-gradient(ellipse at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168,85,247,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(168,85,247,0.8)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.8' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.9' },
          '97%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'radar-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        flicker: 'flicker 8s infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
        'radar-spin': 'radar-spin 4s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config