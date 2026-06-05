import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const body = await req.text()

  // Verify Paystack HMAC signature
  const signature = req.headers.get('x-paystack-signature')
  const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!
  const hash = createHmac('sha512', secretKey).update(body).digest('hex')

  if (!signature || hash !== signature) {
    console.error('Invalid Paystack signature')
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)
  console.log('Paystack webhook event:', event.event)

  if (event.event === 'charge.success') {
    const { metadata, reference, amount } = event.data

    if (!metadata?.event_id) {
      console.error('Missing event_id in metadata')
      return new Response('Missing event_id', { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('events')
      .update({
        status: 'active',
        payment_status: 'paid',
        paystack_ref: reference,
        activated_at: new Date().toISOString(),
      })
      .eq('id', metadata.event_id)

    if (error) {
      console.error('DB update error:', error)
      return new Response('DB error', { status: 500 })
    }

    console.log(`Event ${metadata.event_id} activated — ref: ${reference}, amount: ₦${amount / 100}`)
  }

  return new Response('OK', { status: 200 })
})
