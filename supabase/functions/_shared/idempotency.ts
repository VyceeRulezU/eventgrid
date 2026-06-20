import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

export async function withIdempotency(
  idempotencyKey: string,
  eventId: string,
  reference: string | null,
  processFn: () => Promise<Response>,
): Promise<Response> {
  const { error: insertError } = await supabase
    .from('payment_idempotency_keys')
    .insert({
      idempotency_key: idempotencyKey,
      event_id: eventId,
      reference,
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

  // Unique violation — key already exists
  if (insertError && insertError.code === '23505') {
    const { data: existing } = await supabase
      .from('payment_idempotency_keys')
      .select('status, response')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existing?.status === 'completed') {
      // Return cached response
      return new Response(JSON.stringify(existing.response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Still pending — another request is processing
    return new Response(JSON.stringify({ error: 'Request is already being processed' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (insertError) {
    console.error('Idempotency insert error:', insertError)
    throw insertError
  }

  // New key — execute the handler
  try {
    const response = await processFn()
    const body = await response.clone().json()

    if (response.status >= 200 && response.status < 300) {
      // Only cache successful responses
      await supabase
        .from('payment_idempotency_keys')
        .update({ status: 'completed', response: body })
        .eq('idempotency_key', idempotencyKey)
    } else {
      // Release the lock on failure so retries are possible
      await supabase
        .from('payment_idempotency_keys')
        .delete()
        .eq('idempotency_key', idempotencyKey)
        .eq('status', 'pending')
    }

    return new Response(JSON.stringify(body), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    // Release the lock so the caller can retry
    await supabase
      .from('payment_idempotency_keys')
      .delete()
      .eq('idempotency_key', idempotencyKey)
      .eq('status', 'pending')
    throw err
  }
}
