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
            light: '#C2FE9A',
            DEFAULT: '#78F654',
            dim: '#0BD426',
            dark: '#15530A',
          },
          purple: {
            light: '#BC86BA',
            DEFAULT: '#9E4EA5',
            dim: '#822B8A',
            deep: '#350E3A',
          },
          yellow: {
            DEFAULT: '#F7D277',
          },
          red: '#FF003C', 
          gray: '#27282A',
          black: '#050505',
        },
      },
      fontFamily: {
        // HIGH: The Gotham/Ultra Look
        header: ['var(--font-montserrat)', 'sans-serif'],
        
        // LOW: The Raw Typewriter/Hacker Look (Default Mono)
        mono: ['Courier New', 'Courier', 'monospace'],
        
        // TECH: Clean Modern Mono (Optional use)
        tech: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
