/**
 * Design Tokens for @saas/tokens.
 * Single source of truth for semantic palettes in both CSS (HSL) and Static (HEX).
 * Framework-agnostic: consumable by web, Nuxt, emails, PDFs, and node services.
 */

export interface ColorToken {
  hsl: string
  hex: string
}

export interface SemanticThemeTokens {
  background: ColorToken
  foreground: ColorToken
  card: ColorToken
  cardForeground: ColorToken
  popover: ColorToken
  popoverForeground: ColorToken
  primary: ColorToken
  primaryForeground: ColorToken
  secondary: ColorToken
  secondaryForeground: ColorToken
  muted: ColorToken
  mutedForeground: ColorToken
  accent: ColorToken
  accentForeground: ColorToken
  destructive: ColorToken
  destructiveForeground: ColorToken
  border: ColorToken
  input: ColorToken
  ring: ColorToken
}

export const lightTokens: SemanticThemeTokens = {
  background: { hsl: '0 0% 100%', hex: '#ffffff' },
  foreground: { hsl: '240 10% 3.9%', hex: '#09090b' },
  card: { hsl: '0 0% 100%', hex: '#ffffff' },
  cardForeground: { hsl: '240 10% 3.9%', hex: '#09090b' },
  popover: { hsl: '0 0% 100%', hex: '#ffffff' },
  popoverForeground: { hsl: '240 10% 3.9%', hex: '#09090b' },
  primary: { hsl: '240 5.9% 10%', hex: '#18181b' },
  primaryForeground: { hsl: '0 0% 98%', hex: '#fafafa' },
  secondary: { hsl: '240 4.8% 95.9%', hex: '#f4f4f5' },
  secondaryForeground: { hsl: '240 5.9% 10%', hex: '#18181b' },
  muted: { hsl: '240 4.8% 95.9%', hex: '#f4f4f5' },
  mutedForeground: { hsl: '240 3.8% 46.1%', hex: '#71717a' },
  accent: { hsl: '240 4.8% 95.9%', hex: '#f4f4f5' },
  accentForeground: { hsl: '240 5.9% 10%', hex: '#18181b' },
  destructive: { hsl: '0 84.2% 60.2%', hex: '#ef4444' },
  destructiveForeground: { hsl: '0 0% 98%', hex: '#fafafa' },
  border: { hsl: '240 5.9% 90%', hex: '#e4e4e7' },
  input: { hsl: '240 5.9% 90%', hex: '#e4e4e7' },
  ring: { hsl: '240 5.9% 10%', hex: '#18181b' },
}

export const darkTokens: SemanticThemeTokens = {
  background: { hsl: '240 10% 3.9%', hex: '#09090b' },
  foreground: { hsl: '0 0% 98%', hex: '#fafafa' },
  card: { hsl: '240 10% 3.9%', hex: '#09090b' },
  cardForeground: { hsl: '0 0% 98%', hex: '#fafafa' },
  popover: { hsl: '240 10% 3.9%', hex: '#09090b' },
  popoverForeground: { hsl: '0 0% 98%', hex: '#fafafa' },
  primary: { hsl: '0 0% 98%', hex: '#fafafa' },
  primaryForeground: { hsl: '240 5.9% 10%', hex: '#18181b' },
  secondary: { hsl: '240 3.7% 15.9%', hex: '#27272a' },
  secondaryForeground: { hsl: '0 0% 98%', hex: '#fafafa' },
  muted: { hsl: '240 3.7% 15.9%', hex: '#27272a' },
  mutedForeground: { hsl: '240 5% 64.9%', hex: '#a1a1aa' },
  accent: { hsl: '240 3.7% 15.9%', hex: '#27272a' },
  accentForeground: { hsl: '0 0% 98%', hex: '#fafafa' },
  destructive: { hsl: '0 62.8% 30.6%', hex: '#7f1d1d' },
  destructiveForeground: { hsl: '0 0% 98%', hex: '#fafafa' },
  border: { hsl: '240 3.7% 15.9%', hex: '#27272a' },
  input: { hsl: '240 3.7% 15.9%', hex: '#27272a' },
  ring: { hsl: '240 4.9% 83.9%', hex: '#d4d4d8' },
}

export const baseRadius = '0.5rem'

export const radii = {
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  full: '9999px',
  raw: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    full: '9999px',
  },
} as const

export const typography = {
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const

/**
 * Static token values specifically curated for HTML email templates & PDF generation
 * (requiring resolved HEX colors, explicit font stacks, and px dimensions).
 */
export const emailTokens = {
  colors: {
    background: lightTokens.background.hex,
    foreground: lightTokens.foreground.hex,
    card: lightTokens.card.hex,
    primary: lightTokens.primary.hex,
    primaryText: lightTokens.primaryForeground.hex,
    secondary: lightTokens.secondary.hex,
    secondaryText: lightTokens.secondaryForeground.hex,
    muted: lightTokens.mutedForeground.hex,
    border: lightTokens.border.hex,
    destructive: lightTokens.destructive.hex,
  },
  fonts: {
    body: typography.fontSans,
    mono: typography.fontMono,
  },
  radii: radii.raw,
} as const

export const pdfTokens = {
  ...emailTokens,
} as const

export const designTokens = {
  light: lightTokens,
  dark: darkTokens,
  baseRadius,
  radii,
  typography,
  email: emailTokens,
  pdf: pdfTokens,
} as const

export default designTokens
