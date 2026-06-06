export type StrengthLevel = 'empty' | 'weak' | 'fair' | 'strong' | 'very-strong'

export function getPasswordStrength(password: string): { level: StrengthLevel; score: number; label: string } {
  if (!password) return { level: 'empty', score: 0, label: '' }

  let score = 0
  if (password.length >= 6) score += 15
  if (password.length >= 10) score += 15
  if (password.length >= 14) score += 10
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20
  if (/\d/.test(password)) score += 15
  if (/[^a-zA-Z0-9]/.test(password)) score += 15
  if (/(.)\1{2,}/.test(password)) score -= 10

  score = Math.max(0, Math.min(100, score))

  if (score < 25) return { level: 'weak', score, label: 'Weak' }
  if (score < 50) return { level: 'fair', score, label: 'Fair' }
  if (score < 75) return { level: 'strong', score, label: 'Strong' }
  return { level: 'very-strong', score, label: 'Very Strong' }
}

export const strengthColors: Record<StrengthLevel, string> = {
  empty: 'transparent',
  weak: 'var(--color-error)',
  fair: 'var(--color-warning)',
  strong: 'var(--color-info)',
  'very-strong': 'var(--color-success)',
}
