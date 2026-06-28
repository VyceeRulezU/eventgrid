const store = new Map<string, number>()

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  const prev = store.get(key)
  if (!prev || prev < windowStart) {
    store.set(key, now)
    return true
  }

  const attempts = store.get(key + ':count') || 0
  if (attempts >= maxAttempts) return false

  store.set(key + ':count', attempts + 1)
  store.set(key + ':last', now)
  return true
}

export function getRateLimitRemaining(key: string, maxAttempts: number): number {
  const count = store.get(key + ':count') || 0
  return Math.max(0, maxAttempts - count)
}
