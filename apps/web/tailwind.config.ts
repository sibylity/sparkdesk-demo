import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#818CF8',
        bg: {
          DEFAULT: '#09090B',
          panel: '#0E0E11',
          surface: '#131316',
          hover: '#1A1A1F',
          selected: '#16161D',
        },
        border: {
          DEFAULT: '#1F1F27',
          strong: '#2A2A35',
        },
      },
    },
  },
} satisfies Config
