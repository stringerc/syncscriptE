// Design System Tokens - Figma-style variables
export const designTokens = {
  // Spacing Scale
  space: {
    4: '0.25rem',   // 4px
    8: '0.5rem',    // 8px
    12: '0.75rem',  // 12px
    16: '1rem',     // 16px
    24: '1.5rem',   // 24px
    32: '2rem',     // 32px
    48: '3rem',     // 48px
    64: '4rem',     // 64px
  },

  // Border Radius
  radius: {
    4: '0.25rem',   // 4px
    8: '0.5rem',    // 8px
    12: '0.75rem',  // 12px
    16: '1rem',     // 16px
    full: '9999px', // Pill shape
  },

  // Breakpoints
  breakpoint: {
    mobile: 390,
    tablet: 1024,
    desktop: 1440,
  },

  // Layout Grid
  grid: {
    desktop: {
      columns: 12,
      margin: 80,
      gutter: 24,
    },
    tablet: {
      columns: 8,
      margin: 64,
      gutter: 20,
    },
    mobile: {
      columns: 4,
      margin: 16,
      gutter: 16,
    },
  },

  // Colors
  color: {
    // Primary
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Neutral
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    // Surface
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Constraints
  constraints: {
    sidebar: {
      min: 240,
      max: 320,
    },
    mainContent: {
      min: 320,
    },
    card: {
      min: 280,
      max: 420,
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
