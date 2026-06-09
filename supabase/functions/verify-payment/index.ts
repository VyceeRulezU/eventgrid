import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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
    const { provider, reference, event_id } = await req.json()

    if (!provider || !reference || !event_id) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    let isSuccess = false
    let amountPaid = 0 // in Naira

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
          amountPaid = payload.data.amount / 100 // convert kobo to Naira
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
        }
      }
    }

    if (!isSuccess) {
      return new Response(JSON.stringify({ error: 'Payment verification failed at gateway' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // Verify amount is correct (₦20,000 standard price)
    if (amountPaid < 20000) {
      return new Response(JSON.stringify({ error: 'Incorrect payment amount' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // Update the database record using the service role admin client (bypasses RLS trigger check)
    const { data: updatedEvent, error: updateErr } = await supabaseAdmin
      .from('events')
      .update({
        status: 'active',
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
        // Save the reference for audits
        ...(provider === 'paystack' ? { paystack_ref: reference } : {})
      })
      .eq('id', event_id)
      .neq('payment_status', 'paid')
      .select('id, name, created_by')
      .maybeSingle()

    if (updateErr) {
      console.error('Database update error:', updateErr)
      return new Response(JSON.stringify({ error: 'Database update failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // If successfully activated, send confirmation email
    if (updatedEvent) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, display_name')
        .eq('id', updatedEvent.created_by)
        .maybeSingle()

      if (profile && profile.email) {
        const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/onboarding-emails`
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        try {
          await fetch(functionUrl, {
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
                payment_method: provider === 'paystack' ? 'Paystack' : 'Flutterwave'
              }
            })
          })
        } catch (emailErr) {
          console.error('Failed to trigger onboarding email:', emailErr)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (err) {
    console.error('Verification error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
