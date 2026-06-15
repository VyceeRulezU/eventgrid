import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const BASE_AMOUNT = Number(Deno.env.get('BASE_ACTIVATION_AMOUNT')) || 2000000  // 2,000,000 kobo = ₦20,000

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

    // Update event if not already paid
    const { data: updatedEvent, error } = await supabaseAdmin
      .from('events')
      .update({
        status: 'active',
        payment_status: 'paid',
        paystack_ref: reference,
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

      // Record promo redemption if promo code was used
      const promoCodeId = metadata.promo_code_id || null
      if (promoCodeId) {
        // Validate the promo code server-side
        const { data: expectedResult } = await supabaseAdmin.rpc('get_promo_expected_amount', {
          p_promo_code_id: promoCodeId,
          p_base_amount: BASE_AMOUNT,
        })
        const expectedKobo = Number(expectedResult)

        // Only record if the amount paid matches (or exceeds) what the promo code expects
        if (amount >= expectedKobo) {
          await supabaseAdmin
            .from('promo_redemptions')
            .insert({
              promo_code_id: promoCodeId,
              user_id: updatedEvent.created_by,
              event_id: metadata.event_id,
              reference,
              final_amount: amount,
            })
            .ignoreConflicts()

          await supabaseAdmin.rpc('increment_promo_redemption', {
            p_promo_code_id: promoCodeId,
          })
        } else {
          console.warn(`Promo code ${promoCodeId} used but amount ${amount} < expected ${expectedKobo}`)
        }
      }

      // Retrieve the planner/creator's profile for email notification
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
    } else {
      console.log(`Event ${metadata.event_id} already marked paid, skipping notification`)
    }
  }

  return new Response('OK', { status: 200 })
})
