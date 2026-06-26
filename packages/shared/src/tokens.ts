export const colors = {
  bgBase: '#111827',
  accent: '#D4A017',
  accentHover: '#B8860B',
  accentMuted: 'rgba(212, 160, 23, 0.15)',
  accentBorder: 'rgba(212, 160, 23, 0.25)',
  surface1: '#1F2937',
  surface2: '#374151',
  surface3: '#4B5563',
  surfaceHover: '#2D3748',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#111827',
  border: '#374151',
  borderSubtle: '#1F2937',
  borderFocus: '#D4A017',
  statusGreen: '#22C55E',
  statusGreenBg: 'rgba(34, 197, 94, 0.10)',
  statusYellow: '#EAB308',
  statusYellowBg: 'rgba(234, 179, 8, 0.10)',
  statusRed: '#EF4444',
  statusRedBg: 'rgba(239, 68, 68, 0.10)',
  statusGrey: '#6B7280',
  statusGreyBg: 'rgba(107, 114, 128, 0.10)',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#EAB308',
}

export const spacing: Record<number, number> = {
  1: 4, 2: 8, 3: 12, 4: 16,
  5: 20, 6: 24, 8: 32, 10: 40,
  12: 48, 16: 64,
}

export const radius = {
  sm: 6, md: 8, lg: 12, xl: 16, full: 9999,
}

export const fontSize = {
  xs: 12, sm: 14, base: 16,
  subtitle: 18, title: 20, titleLg: 24, display: 32,
}

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

export type StatusLevel = 'green' | 'yellow' | 'red' | 'grey'

export function getStatusColor(status: StatusLevel) {
  const map = {
    green: { dot: colors.statusGreen, bg: colors.statusGreenBg },
    yellow: { dot: colors.statusYellow, bg: colors.statusYellowBg },
    red: { dot: colors.statusRed, bg: colors.statusRedBg },
    grey: { dot: colors.statusGrey, bg: colors.statusGreyBg },
  }
  return map[status]
}
