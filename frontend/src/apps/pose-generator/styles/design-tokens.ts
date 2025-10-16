/**
 * Design Tokens for Pose Generator Premium UI
 * Centralized design system with type safety
 */

export const designTokens = {
  // Colors
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Primary blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#8b5cf6', // Secondary purple
      700: '#7c3aed',
      800: '#6d28d9',
      900: '#5b21b6',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#10b981', // Success green
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Warning yellow
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Error red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    primaryHover: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
    rainbow: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
    aurora: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },

  // Spacing (follows 8px grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '40px',
    '3xl': '48px',
    '4xl': '64px',
    '5xl': '80px',
    '6xl': '96px',
  },

  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px', // Standard cards
    lg: '12px', // Modals
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
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
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.025em',
    },
  },

  // Shadows (Multi-layer for depth)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    premium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    premiumLg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    glow: {
      blue: '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
      purple: '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1)',
      green: '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.1)',
      yellow: '0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1)',
      red: '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1)',
    },
  },

  // Animation Durations
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
      slowest: '1000ms',
    },
    timing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Difficulty colors
  difficulty: {
    beginner: {
      color: '#10b981',
      bg: '#dcfce7',
      border: '#86efac',
    },
    intermediate: {
      color: '#f59e0b',
      bg: '#fef3c7',
      border: '#fcd34d',
    },
    advanced: {
      color: '#ef4444',
      bg: '#fee2e2',
      border: '#fca5a5',
    },
    expert: {
      color: '#8b5cf6',
      bg: '#f3e8ff',
      border: '#d8b4fe',
    },
  },

  // Status colors
  status: {
    pending: {
      color: '#64748b',
      bg: '#f1f5f9',
      border: '#cbd5e1',
    },
    processing: {
      color: '#3b82f6',
      bg: '#dbeafe',
      border: '#93c5fd',
    },
    completed: {
      color: '#10b981',
      bg: '#dcfce7',
      border: '#86efac',
    },
    failed: {
      color: '#ef4444',
      bg: '#fee2e2',
      border: '#fca5a5',
    },
  },
} as const

// Type exports for TypeScript support
export type ColorShade = keyof typeof designTokens.colors.primary
export type ColorPalette = keyof typeof designTokens.colors
export type Spacing = keyof typeof designTokens.spacing
export type BorderRadius = keyof typeof designTokens.borderRadius
export type FontSize = keyof typeof designTokens.typography.fontSize
export type Shadow = keyof typeof designTokens.shadows
export type AnimationDuration = keyof typeof designTokens.animation.duration
export type AnimationTiming = keyof typeof designTokens.animation.timing
export type Difficulty = keyof typeof designTokens.difficulty
export type Status = keyof typeof designTokens.status

// Helper functions
export const getColor = (palette: ColorPalette, shade: ColorShade = 500) => {
  const colorPalette = designTokens.colors[palette]
  if (typeof colorPalette === 'object' && shade in colorPalette) {
    return colorPalette[shade as keyof typeof colorPalette]
  }
  return designTokens.colors.neutral[500]
}

export const getGradient = (name: keyof typeof designTokens.gradients) => {
  return designTokens.gradients[name]
}

export const getShadow = (name: keyof typeof designTokens.shadows) => {
  return designTokens.shadows[name]
}

export const getDifficultyColor = (difficulty: string) => {
  const normalized = difficulty.toLowerCase() as Difficulty
  return designTokens.difficulty[normalized] || designTokens.difficulty.beginner
}

export const getStatusColor = (status: string) => {
  const normalized = status.toLowerCase() as Status
  return designTokens.status[normalized] || designTokens.status.pending
}
