const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '')

  const suffix = Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
  return base ? `${base}-${suffix}` : suffix
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
