import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        '3xl': '1920px',
      },
      fontSize: {
        'fluid-xs': ['clamp(0.625rem, 0.5rem + 0.5vw, 0.75rem)', { lineHeight: '1.5' }],
        'fluid-sm': ['clamp(0.75rem, 0.65rem + 0.5vw, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-base': ['clamp(0.875rem, 0.75rem + 0.5vw, 1rem)', { lineHeight: '1.6' }],
        'fluid-lg': ['clamp(1rem, 0.85rem + 0.75vw, 1.25rem)', { lineHeight: '1.5' }],
        'fluid-xl': ['clamp(1.125rem, 0.9rem + 1vw, 1.5rem)', { lineHeight: '1.4' }],
        'fluid-2xl': ['clamp(1.25rem, 1rem + 1.25vw, 1.875rem)', { lineHeight: '1.3' }],
        'fluid-3xl': ['clamp(1.5rem, 1.1rem + 2vw, 2.25rem)', { lineHeight: '1.2' }],
        'fluid-4xl': ['clamp(1.875rem, 1.3rem + 2.5vw, 3rem)', { lineHeight: '1.1' }],
        'fluid-5xl': ['clamp(2.25rem, 1.5rem + 3.5vw, 3.75rem)', { lineHeight: '1.1' }],
        'fluid-6xl': ['clamp(2.75rem, 1.75rem + 4.5vw, 4.5rem)', { lineHeight: '1' }],
      },
      spacing: {
        'fluid-1': 'clamp(0.25rem, 0.15rem + 0.5vw, 0.5rem)',
        'fluid-2': 'clamp(0.5rem, 0.3rem + 1vw, 1rem)',
        'fluid-4': 'clamp(1rem, 0.5rem + 2vw, 2rem)',
        'fluid-6': 'clamp(1.5rem, 0.75rem + 3vw, 3rem)',
        'fluid-8': 'clamp(2rem, 1rem + 4vw, 4rem)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      keyframes: {
        'marquee-infinite': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'marquee-infinite': 'marquee-infinite 60s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config