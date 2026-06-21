import { createClient } from 'jsr:@supabase/supabase-js@2'
import { withIdempotency } from '../_shared/idempotency.ts'
import { recordReferralCommission } from '../_shared/referral.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const MIN_AMOUNT = Number(Deno.env.get('MINIMUM_ACTIVATION_AMOUNT')) || 20000
const BASE_AMOUNT = Number(Deno.env.get('BASE_ACTIVATION_AMOUNT')) || 2000000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { provider, reference, event_id, idempotency_key } = await req.json()

    if (!provider || !reference || !event_id) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    const key = idempotency_key || `payment_${event_id}_${reference}`

    return await withIdempotency(key, event_id, reference, async () => {
      let isSuccess = false
      let amountPaid = 0
      let promoCodeId: string | null = null

      if (provider === 'paystack') {
        const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
        if (!secretKey) {
          throw new Error('PAYSTACK_SECRET_KEY is not configured')
        }

        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.ok) {
          const payload = await res.json()
          if (payload.data && payload.data.status === 'success') {
            isSuccess = true
            amountPaid = payload.data.amount / 100
            promoCodeId = payload.data.metadata?.promo_code_id || null
          }
        }
      } else if (provider === 'flutterwave') {
        const secretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY')
        if (!secretKey) {
          throw new Error('FLUTTERWAVE_SECRET_KEY is not configured')
        }

        const res = await fetch(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.ok) {
          const payload = await res.json()
          if (payload.data && (payload.data.status === 'successful' || payload.data.status === 'completed')) {
            isSuccess = true
            amountPaid = payload.data.amount
            promoCodeId = payload.data.meta?.promo_code_id || null
          }
        }
      } else if (provider === 'korapay') {
        const secretKey = Deno.env.get('KORAPAY_SECRET_KEY')
        if (!secretKey) {
          throw new Error('KORAPAY_SECRET_KEY is not configured')
        }

        const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${reference}`, {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.ok) {
          const payload = await res.json()
          if (payload.status && payload.data && payload.data.status === 'success') {
            isSuccess = true
            amountPaid = Number(payload.data.amount) || 0
            promoCodeId = payload.data.metadata?.promo_code_id || null
          }
        }
      }

      if (!isSuccess) {
        return new Response(JSON.stringify({ error: 'Payment verification failed at gateway' }), {
          status: 402,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      let expectedAmount: number
      if (promoCodeId) {
        const { data: expectedResult } = await supabaseAdmin.rpc('get_promo_expected_amount', {
          p_promo_code_id: promoCodeId,
          p_base_amount: BASE_AMOUNT,
        })
        expectedAmount = Number(expectedResult) / 100
      } else {
        expectedAmount = MIN_AMOUNT
      }

      if (amountPaid < expectedAmount) {
        return new Response(JSON.stringify({ error: 'Incorrect payment amount' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const { data: updatedEvent, error: updateErr } = await supabaseAdmin
        .from('events')
        .update({
          status: 'active',
          payment_status: 'paid',
          payment_provider: provider,
          amount_paid: Math.round(amountPaid * 100),
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          paystack_ref: reference,
        })
        .eq('id', event_id)
        .neq('payment_status', 'paid')
        .select('id, name, created_by')
        .maybeSingle()

      if (updateErr) {
        console.error('Database update error:', updateErr)
        return new Response(JSON.stringify({ error: 'Database update failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (promoCodeId && updatedEvent) {
        try {
          await supabaseAdmin.from('promo_redemptions').insert({
            promo_code_id: promoCodeId,
            user_id: updatedEvent.created_by,
            event_id: event_id,
            reference,
            final_amount: Math.round(amountPaid * 100),
          })
        } catch {
          // Duplicate or other error — non-critical
        }
        try {
          await supabaseAdmin.rpc('increment_promo_redemption', {
            p_promo_code_id: promoCodeId,
          })
        } catch {
          // Best-effort counter increment
        }
      }

      if (updatedEvent) {
        // Record referral commission (best-effort)
        try {
          await recordReferralCommission(updatedEvent.created_by, event_id, reference)
        } catch {
          // Non-critical
        }

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email, display_name')
          .eq('id', updatedEvent.created_by)
          .maybeSingle()

        if (profile && profile.email) {
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
                email: profile.email,
                first_name: profile.display_name || 'there',
                meta: {
                  amount: `₦${amountPaid.toLocaleString()}`,
                  event_name: updatedEvent.name,
                  payment_method: provider === 'paystack' ? 'Paystack' : 'Korapay'
                }
              })
            })

            if (!emailRes.ok) {
              const errText = await emailRes.text()
              console.error(`onboarding-emails returned status ${emailRes.status}:`, errText)
            } else {
              console.log('onboarding-emails triggered successfully.')
            }
          } catch (emailErr) {
            console.error('Failed to trigger onboarding email:', emailErr)
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    })

  } catch (err) {
    console.error('Verification error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
