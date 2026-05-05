import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './frontend/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        hover: 'rgb(var(--hover) / <alpha-value>)',
        subtext: 'rgb(var(--subtext) / <alpha-value>)',
        inverse: 'rgb(var(--inverse) / <alpha-value>)',
        'always-dark': 'rgb(var(--always-dark) / <alpha-value>)',
        'always-light': 'rgb(var(--always-light) / <alpha-value>)',
        'terminal-text': 'rgb(var(--terminal-text) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      letterSpacing: {
        label: '0.08em',
        wide2: '0.15em',
        brand: '0.25em',
      },
      borderRadius: {
        none: '0',
        DEFAULT: '0',
      },
    },
  },
  corePlugins: {
    boxShadow: false,
    backdropBlur: false,
    backdropBrightness: false,
    backdropFilter: false,
  },
  plugins: [],
};

export default config;
