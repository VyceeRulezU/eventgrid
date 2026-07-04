const AUTH_URL = Deno.env.get('SUPABASE_URL')!.replace(/\/*$/, '') + '/auth/v1'
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
    if (!token) return json(401, { error: 'Missing authorization token' })

    // Verify caller by hitting GoTrue's /user endpoint
    const whoRes = await fetch(`${AUTH_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!whoRes.ok) return json(401, { error: 'Invalid authorization token' })
    const caller: any = await whoRes.json()
    if (!caller?.id) return json(401, { error: 'Invalid authorization token' })

    const { user_id, provider } = await req.json()
    if (!user_id || !provider) return json(400, { error: 'user_id and provider are required' })
    if (caller.id !== user_id) return json(403, { error: 'You can only unlink your own identities' })

    // Delete the identity via the GoTrue admin API
    const del = await fetch(`${AUTH_URL}/admin/users/${user_id}/identities/${provider}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    const body = await del.text()

    if (!del.ok) {
      return json(500, { error: body || del.statusText, debug: { status: del.status } })
    }

    // Parse the admin delete response — GoTrue returns the deleted identity on success
    let parsed: any
    try { parsed = JSON.parse(body) } catch { /* empty body on 204 etc */ }

    return json(200, { success: true })
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : 'Internal error'
    console.error('unlink-identity error:', msg)
    return json(500, { error: msg })
  }
})
