import type { Config } from 'tailwindcss';
const c = (v: string) => `hsl(var(--${v}))`;
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: c('background'), foreground: c('foreground'), border: c('border'), input: c('border'), ring: c('accent'),
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
        accent: { DEFAULT: c('accent'), foreground: '0 0% 100%' },
        card: { DEFAULT: c('card'), foreground: c('foreground') },
        navy: { 950: '#070d1c', 900: '#0b1530', 800: '#101d40', 700: '#1a2b5c' },
      },
      borderRadius: { lg: '0.75rem', md: '0.5rem', sm: '0.375rem' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
