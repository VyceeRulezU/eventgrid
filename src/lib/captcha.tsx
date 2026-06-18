import { useCallback, useEffect, useState } from 'react'
import { Turnstile } from 'react-turnstile'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
export const hasCaptcha = Boolean(TURNSTILE_SITE_KEY) && (typeof window === 'undefined' || !window.navigator.webdriver)

export function useCaptchaToken() {
  const [token, setToken] = useState<string | null>(null)

  const getToken = useCallback((): string | undefined => {
    const t = token
    setToken(null)
    return t || undefined
  }, [token])

  return { token, setToken, getToken }
}

export function CaptchaField({
  onToken,
}: {
  onToken: (token: string | null) => void
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(() => setReady(true), { timeout: 2000 })
      return () => cancelIdleCallback(id)
    } else {
      const id = window.setTimeout(() => setReady(true), 500)
      return () => clearTimeout(id)
    }
  }, [])

  if (!hasCaptcha) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--space-3) 0' }}>
      {ready ? (
        <Turnstile
          sitekey={TURNSTILE_SITE_KEY!}
          onVerify={(token) => { onToken(token) }}
          onError={() => onToken(null)}
          onExpire={() => onToken(null)}
          theme="dark"
          size="normal"
        />
      ) : (
        <div style={{ width: 300, height: 65, background: 'var(--color-surface-2)', borderRadius: 6 }} />
      )}
    </div>
  )
}
