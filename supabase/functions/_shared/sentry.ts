// Lightweight Sentry error reporting for Supabase Edge Functions (Deno).
// Sends errors to Sentry via the Envelope HTTP API — no SDK dependency.

const SENTRY_DSN = Deno.env.get('SENTRY_DSN')

function parseDsn(dsn: string): { host: string; projectId: string; publicKey: string } | null {
  try {
    const url = new URL(dsn)
    const parts = url.pathname.replace(/^\//, '').split('/')
    const host = url.hostname + (url.port ? `:${url.port}` : '')
    return { host, projectId: parts[0], publicKey: url.username }
  } catch {
    return null
  }
}

/** Send an error event to Sentry. Returns true on success. */
export async function reportError(
  error: unknown,
  extra?: Record<string, unknown>,
): Promise<boolean> {
  if (!SENTRY_DSN) return false

  const config = parseDsn(SENTRY_DSN)
  if (!config) {
    console.error('[Sentry] Invalid DSN')
    return false
  }

  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    exception: {
      values: [{ type: error instanceof Error ? error.constructor.name : 'Error', value: message, stacktrace: stack ? { frames: [] } : undefined }],
    },
    extra: extra || {},
    environment: Deno.env.get('ENVIRONMENT') || 'production',
    server_name: Deno.env.get('SUPABASE_URL') || 'edge-function',
    tags: {
      function: Deno.env.get('SUPABASE_FUNCTION_NAME') || 'unknown',
      runtime: 'deno',
    },
  }

  const payload = JSON.stringify(event)

  try {
    // Sentry envelope format: https://develop.sentry.dev/sdk/envelopes/
    const envelope = [
      JSON.stringify({ event_id: event.event_id, sent_at: event.timestamp, dsn: SENTRY_DSN }),
      payload,
    ].join('\n')

    const response = await fetch(`https://${config.host}/api/${config.projectId}/envelope/`, {
      method: 'POST',
      body: envelope,
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
    })

    if (!response.ok) {
      console.error(`[Sentry] Failed to send error: ${response.status} ${response.statusText}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[Sentry] Network error:', err)
    return false
  }
}

/**
 * Wraps a Deno.serve handler with Sentry error reporting.
 * Catches unhandled errors, reports them to Sentry, and returns a 500 response.
 */
export function wrapHandler(
  handler: (req: Request) => Promise<Response> | Response,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (err) {
      await reportError(err, { url: req.url, method: req.method })
      console.error('Unhandled error:', err)
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  }
}
