import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'
import { recordReferralCommission } from '../_shared/referral.ts'
import { reportError } from '../_shared/sentry.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const BASE_AMOUNT = Number(Deno.env.get('BASE_ACTIVATION_AMOUNT')) || 2000000

Deno.serve(async (req) => {
  try {
    const body = await req.text()

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

    // Idempotency check using the payment reference as the key
    const { error: insertError } = await supabaseAdmin
      .from('payment_idempotency_keys')
      .insert({
        idempotency_key: reference,
        event_id: metadata.event_id,
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

    const { data: updatedEvent, error } = await supabaseAdmin
      .from('events')
      .update({
        status: 'active',
        payment_status: 'paid',
        paystack_ref: reference,
        amount_paid: amount,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.event_id)
      .neq('payment_status', 'paid')
      .select('id, name, created_by')
      .maybeSingle()

    if (error) {
      console.error('DB update error:', error)
      return new Response('DB error', { status: 500 })
    }

    if (updatedEvent) {
      const amountInNaira = amount / 100
      console.log(`Event ${updatedEvent.id} ("${updatedEvent.name}") activated — ref: ${reference}, amount: ₦${amountInNaira}`)

      const promoCodeId = metadata.promo_code_id || null
      if (promoCodeId) {
        try {
          await supabaseAdmin.from('promo_redemptions').insert({
            promo_code_id: promoCodeId,
            user_id: updatedEvent.created_by,
            event_id: metadata.event_id,
            reference,
            final_amount: amount,
          })
        } catch {
          // Already recorded or non-critical
        }
        try {
          await supabaseAdmin.rpc('increment_promo_redemption', {
            p_promo_code_id: promoCodeId,
          })
        } catch {
          // Best-effort
        }
      }

      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('email, display_name')
        .eq('id', updatedEvent.created_by)
        .maybeSingle()

      if (profileData && profileData.email) {
        const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/onboarding-emails`
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        try {
          const emailRes = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'payment',
              email: profileData.email,
              first_name: profileData.display_name || 'there',
              meta: {
                amount: `₦${amountInNaira.toLocaleString()}`,
                event_name: updatedEvent.name,
                payment_method: 'Paystack'
              }
            })
          })

          if (!emailRes.ok) {
            const errText = await emailRes.text()
            console.error('Failed to trigger payment email from webhook:', emailRes.status, errText)
          } else {
            console.log('Payment email triggered from webhook successfully')
          }
        } catch (emailErr) {
          console.error('Error calling onboarding-emails from webhook:', emailErr)
        }
      }

      // Send push notification to event creator
      const { error: pushErr } = await supabaseAdmin.functions.invoke('send-push-notification', {
        body: {
          userId: updatedEvent.created_by,
          title: 'Event activated',
          body: `Payment confirmed for ${updatedEvent.name} — all features unlocked`,
          url: `/events/${metadata.event_id}`,
          tag: `payment-${metadata.event_id}`,
        },
      })
      if (pushErr) console.error('Failed to send push notification:', pushErr)

      // Record referral commission (best-effort)
      try {
        await recordReferralCommission(updatedEvent.created_by, metadata.event_id, reference)
      } catch {
        // Non-critical
      }

      // Mark idempotency key as completed
      await supabaseAdmin
        .from('payment_idempotency_keys')
        .update({ status: 'completed' })
        .eq('idempotency_key', reference)
    } else {
      console.log(`Event ${metadata.event_id} already marked paid, skipping notification`)
      // Mark idempotency key as completed even when event was already paid
      await supabaseAdmin
        .from('payment_idempotency_keys')
        .update({ status: 'completed' })
        .eq('idempotency_key', reference)
    }
  }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Paystack webhook error:', err)
    await reportError(err, { function: 'paystack-webhook' })
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
})
