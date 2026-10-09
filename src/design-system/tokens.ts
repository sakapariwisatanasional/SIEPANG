/**
 * @license
 * SiEpang Design System — Core Design Tokens (RC1)
 * Single source of truth for colors, typography, spacing, radius, shadows, and breakpoints.
 */

export const TOKENS = {
  // Light-First Surfaces (Part 2 & Part 3)
  colors: {
    pageBackground: '#F7F7F8',
    surfacePrimary: '#FFFFFF',
    surfaceSecondary: '#FAFAFA',
    surfaceSoftWarm: '#FFF9F7',
    surfaceSoftPink: '#FFF4F7',

    // Text Colors
    textPrimary: '#171717',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textWhite: '#FFFFFF',

    // Borders
    borderSubtle: '#ECECEF',
    borderLight: '#F3F4F6',
    borderHighlight: 'rgba(193, 53, 132, 0.3)',

    // Scout Event Instagram Accents (Part 3)
    accents: {
      purple: '#833AB4',
      violet: '#6C4ACF',
      magenta: '#C13584',
      pink: '#E1306C',
      orange: '#F77737',
      yellow: '#FCAF45',
    },

    // Pastel Card Backgrounds
    pastels: {
      purple: '#F5F3FF',
      purpleBorder: '#DDD6FE',
      blue: '#EFF6FF',
      blueBorder: '#BFDBFE',
      green: '#ECFDF5',
      greenBorder: '#A7F3D0',
      orange: '#FFF7ED',
      orangeBorder: '#FED7AA',
      pink: '#FFF1F2',
      pinkBorder: '#FECDD3',
      amber: '#FEFCE8',
      amberBorder: '#FEF08A',
    },

    // Semantic Status Colors (Part 3)
    semantic: {
      success: '#10B981',
      successLight: '#ECFDF5',
      warning: '#F59E0B',
      warningLight: '#FFFBEB',
      danger: '#EF4444',
      dangerLight: '#FEF2F2',
      info: '#0284C7',
      infoLight: '#F0F9FF',
    },
  },

  // Gradients
  gradients: {
    scoutPrimary: 'linear-gradient(135deg, #833AB4 0%, #C13584 30%, #E1306C 52%, #F77737 78%, #FCAF45 100%)',
    scoutSoft: 'linear-gradient(135deg, rgba(131, 58, 180, 0.08) 0%, rgba(225, 48, 108, 0.08) 50%, rgba(247, 119, 55, 0.08) 100%)',
    scoutCardBorder: 'linear-gradient(135deg, rgba(131, 58, 180, 0.3) 0%, rgba(225, 48, 108, 0.3) 50%, rgba(252, 175, 69, 0.3) 100%)',
  },

  // Breakpoints (Part 7)
  breakpoints: {
    xs: 320,
    sm: 375,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1440,
  },

  // Radius Tokens
  radius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.75rem', // 28px
    full: '9999px',
  },

  // Touch Target (Part 4)
  touchTarget: {
    min: '44px',
  },

  // Shadows
  shadows: {
    subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
    card: '0 2px 8px rgba(0, 0, 0, 0.04)',
    elevated: '0 4px 16px rgba(0, 0, 0, 0.06)',
    modal: '0 10px 30px rgba(0, 0, 0, 0.12)',
    buttonHighlight: '0 4px 14px rgba(225, 48, 108, 0.25)',
  },
} as const;

export type DesignTokens = typeof TOKENS;
