import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        elfy: {
          green: {
            light: '#7FF65F',
            DEFAULT: 'rgba(96, 196, 68, 1)',
            dim: '#1bb930ff',
            dark: '#217e10ff',
          },
          purple: {
            light: '#BC86BA',
            DEFAULT: '#9E4EA5',
            dim: '#822B8A',
            deep: '#350E3A',
          },
          yellow: {
            DEFAULT: '#eae747ff',
          },
          red: '#FF003C', 
          gray: '#27282A',
          black: '#050505',
        },
      },
      fontFamily: {
        header: ['var(--font-montserrat)', 'sans-serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
        tech: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-diamond': 'spin-diamond 3s linear infinite', // NEW: Custom Diamond Spin
        'matrix-green': 'matrix-green 4s ease-in-out infinite',
        'matrix-purple': 'matrix-purple 2s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1.2s ease-in-out infinite',
      },
      keyframes: {
        'spin-diamond': {
          '0%': { transform: 'rotate(45deg)' },
          '100%': { transform: 'rotate(405deg)' }, // 360 + 45 = Full loop maintaining diamond shape
        },
        'matrix-green': {
          '0%, 100%': { color: '#14630bff' },
          '50%': { color: '#0aa41cff' },
        },
        'matrix-purple': {
          '0%, 100%': { color: '#9E4EA5' }, 
          '33%': { color: '#BC86BA' },      
          '66%': { color: '#350E3A' },      
        },
        'cursor-blink': {
          '0%, 30%': { opacity: '1' }, 
          '50%': { opacity: '0' },     
          '100%': { opacity: '1' },    
        }
      }
    },
  },
  plugins: [],
}
export default config
