import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!token) return json(401, { error: 'Missing auth token' })

    const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !caller) return json(401, { error: 'Invalid token' })

    const { user_id, provider } = await req.json()
    if (!user_id || !provider) return json(400, { error: 'user_id and provider required' })
    if (caller.id !== user_id) return json(403, { error: 'Cannot unlink others' })

    const del = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${user_id}/identities/${provider}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const body = await del.text()

    if (!del.ok) {
      return json(500, { error: body || del.statusText, debug: { status: del.status } })
    }

    return json(200, { success: true })
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : 'Internal error'
    console.error('unlink-identity error:', msg)
    return json(500, { error: msg })
  }
})
