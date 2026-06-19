const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'NaliGrid <noreply@naligrid.com>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name, email } = await req.json()

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Thank You — Your EventGrid Survey Code',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#0B1120;color:#e2e8f0;border-radius:16px;">
            <h1 style="color:#fff;margin:0 0 8px;">Thank You, ${name}!</h1>
            <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6;">
              Your survey response has been recorded. We appreciate your time and feedback — it helps us build a better platform for event professionals.
            </p>
            <div style="background:#1a2432;border:1px solid #2a3a4e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">Your exclusive early-access code</p>
              <p style="margin:0;font-size:32px;font-weight:700;color:#fff;letter-spacing:4px;">BETA-NALIGRID</p>
            </div>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
              Keep this code safe — you'll to create an event for free and explore the platform.
            </p>
          </div>
        `,
      }),
    })

    const body = await res.text()

    if (!res.ok) {
      console.error('Resend API error:', res.status, body)
      return new Response(
        JSON.stringify({ error: `Failed to send email (${res.status})` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
