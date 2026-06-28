import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

export function initSentry() {
  if (!dsn) {
    console.warn('Sentry DSN not set — skipping initialization')
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.25,
  })
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!dsn) {
    console.error('Unhandled error (Sentry not configured):', error, context)
    return
  }
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context)
    Sentry.captureException(error)
  })
}

export { Sentry }
