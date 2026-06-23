import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'
import { recordReferralCommission } from '../_shared/referral.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const body = await req.text()

  const signature = req.headers.get('x-korapay-signature')
  const secretKey = Deno.env.get('KORAPAY_SECRET_KEY')
  if (!secretKey) {
    console.error('KORAPAY_SECRET_KEY not set')
    return new Response('Server config error', { status: 500 })
  }

  const hash = createHmac('sha256', secretKey).update(body).digest('hex')
  if (!signature || hash !== signature) {
    console.error('Invalid Korapay signature')
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)
  console.log('Korapay webhook event:', event.event)

  const chargeCompleted = event.event === 'charge.completed'
  const transferCompleted = event.event === 'transfer.completed'

  if (chargeCompleted || transferCompleted) {
    const { reference, amount, metadata } = event.data
    const eventId = metadata?.event_id
    if (!eventId) {
      console.error('Missing event_id in metadata')
      return new Response('Missing event_id', { status: 400 })
    }

    // Idempotency check using the payment reference as the key
    const { error: insertError } = await supabaseAdmin
      .from('payment_idempotency_keys')
      .insert({
        idempotency_key: reference,
        event_id: eventId,
        reference,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

    if (insertError && insertError.code === '23505') {
      console.log(`Webhook for reference ${reference} already processed, skipping`)
      return new Response('OK', { status: 200 })
    }

    if (insertError) {
      console.error('Idempotency insert error:', insertError)
      return new Response('DB error', { status: 500 })
    }

    const updates: Record<string, unknown> = {
      payment_status: 'paid',
      paystack_ref: reference,
      amount_paid: amount * 100,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (chargeCompleted) {
      updates.status = 'active'
    }

    const { data: updatedEvent, error } = await supabaseAdmin
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .neq('payment_status', 'paid')
      .select('id, name, created_by')
      .maybeSingle()

    if (error) {
      console.error('DB update error:', error)
      return new Response('DB error', { status: 500 })
    }

    if (updatedEvent) {
      const amountInNaira = amount / 100
      console.log(`Event ${updatedEvent.id} ("${updatedEvent.name}") paid — ref: ${reference}, amount: ₦${amountInNaira}`)

      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('email, display_name')
        .eq('id', updatedEvent.created_by)
        .maybeSingle()

      if (profileData?.email) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/onboarding-emails`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'payment',
              email: profileData.email,
              first_name: profileData.display_name || 'there',
              meta: {
                amount: `₦${amountInNaira.toLocaleString()}`,
                event_name: updatedEvent.name,
                payment_method: 'Korapay',
              },
            }),
          })
        } catch (emailErr) {
          console.error('Error triggering payment email:', emailErr)
        }
      }

      // Send push notification to event creator
      const { error: pushErr } = await supabaseAdmin.functions.invoke('send-push-notification', {
        body: {
          userId: updatedEvent.created_by,
          title: 'Event activated',
          body: `Payment confirmed for ${updatedEvent.name} — all features unlocked`,
          url: `/events/${eventId}`,
          tag: `payment-${eventId}`,
        },
      })
      if (pushErr) console.error('Failed to send push notification:', pushErr)

      // Record referral commission (best-effort)
      try {
        await recordReferralCommission(updatedEvent.created_by, eventId, reference)
      } catch {
        // Non-critical
      }

      // Mark idempotency key as completed
      await supabaseAdmin
        .from('payment_idempotency_keys')
        .update({ status: 'completed' })
        .eq('idempotency_key', reference)
    } else {
      console.log(`Event ${eventId} already marked paid, skipping`)
      // Mark idempotency key as completed even when event was already paid
      await supabaseAdmin
        .from('payment_idempotency_keys')
        .update({ status: 'completed' })
        .eq('idempotency_key', reference)
    }
  }

  return new Response('OK', { status: 200 })
})
