import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, title, body, url, tag, renotify } = await req.json()

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: 'userId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all push subscriptions for this user (multiple devices)
    const { data: subs, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId)

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    webpush.setVapidDetails(
      'mailto:support@naligrid.com',
      vapidPublicKey,
      vapidPrivateKey
    )

    const payload = JSON.stringify({
      title,
      body: body || '',
      url: url || '/',
      icon: '/logo-192.png',
      badge: '/badge-72.png',
      tag: tag || '',
      renotify: renotify || false,
    })

    let sent = 0
    const expiredIds: string[] = []

    for (const sub of subs) {
      try {
        const s = sub.subscription as { endpoint: string; keys: { p256dh: string; auth: string } }
        await webpush.sendNotification({
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        }, payload)
        sent++
      } catch (err) {
        if (err instanceof Error) {
          const msg = err.message || ''
          // Subscription expired or no longer valid
          if (msg.includes('410') || msg.includes('404') || msg.includes('unsubscribed') || msg.includes('expired') || (err as any).statusCode === 410 || (err as any).statusCode === 404) {
            expiredIds.push(sub.id)
          } else {
            console.error('Push send error:', msg)
          }
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('id', expiredIds)
    }

    return new Response(
      JSON.stringify({ sent, expired: expiredIds.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-push-notification error:', err instanceof Error ? err.stack || err.message : err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? `${err.name}: ${err.message}` : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
