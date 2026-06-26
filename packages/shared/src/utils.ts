import type { StatusLevel } from './tokens'

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export function toKobo(naira: number): number {
  return Math.round(naira * 100)
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`
  if (digits.length === 10) return `+234${digits}`
  return phone
}

export const PHASE_NAMES: Record<number, string> = {
  1: 'Lead & Client Onboarding',
  2: 'Event Planning & Strategy',
  3: 'Vendor Management',
  4: 'Team Coordination',
  5: 'Guest Management',
  6: 'Pre-Event Finalization',
  7: 'Event Day Operations',
  8: 'Event Closeout',
  9: 'Post-Event Analysis',
}

export function getOccupancyStatus(seated: number, capacity: number): StatusLevel {
  if (seated === 0) return 'grey'
  if (seated > capacity) return 'red'
  if (seated === capacity) return 'green'
  return 'yellow'
}

export function getLiveBoardStatusLevel(status: string): StatusLevel {
  const map: Record<string, StatusLevel> = {
    green: 'green',
    yellow: 'yellow',
    red: 'red',
    grey: 'grey',
  }
  return map[status] ?? 'grey'
}

export function formatEventDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
