import type { Config } from 'tailwindcss';

/**
 * Calm, light, spacious design tokens.
 *
 * Every color is a CSS variable (RGB triplet) defined in src/index.css, so the
 * dark variant is a pure variable swap — components never branch on theme.
 * The single accent is a calm deep teal (#0D6B62 / dark #5CC8B8); status
 * colors are deliberately desaturated.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--text) / <alpha-value>)',
        ink2: 'rgb(var(--text-2) / <alpha-value>)',
        ink3: 'rgb(var(--text-3) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
          tint: 'rgb(var(--accent-tint) / <alpha-value>)',
          'tint-2': 'rgb(var(--accent-tint-2) / <alpha-value>)',
        },
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
        ok: 'rgb(var(--ok) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', '"Noto Sans Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '13': ['13px', { lineHeight: '1.45' }],
      },
      borderRadius: {
        card: '12px',
        field: '10px',
      },
      boxShadow: {
        // Structure comes from borders; only floating layers get a shadow.
        popover: 'var(--popover-shadow)',
      },
      keyframes: {
        // Motion budget: 150ms ease, only in response to a user action
        // (popover/menu opening, toast). No entrance animations anywhere else.
        'panel-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'overlay-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'panel-in': 'panel-in 0.15s ease-out both',
        'overlay-in': 'overlay-in 0.15s ease-out both',
        'toast-in': 'toast-in 0.15s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
