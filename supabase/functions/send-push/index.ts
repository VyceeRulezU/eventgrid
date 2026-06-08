import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

interface PushPayload {
  userId: string
  title: string
  body?: string
  url?: string
}

Deno.serve(async (req) => {
  try {
    const { userId, title, body, url } = (await req.json()) as PushPayload
    if (!userId || !title) {
      return new Response(JSON.stringify({ error: 'userId and title are required' }), { status: 400 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500 })
    }

    webpush.setVapidDetails(
      'mailto:support@eventgrid.ng',
      vapidPublicKey,
      vapidPrivateKey
    )

    const payload = JSON.stringify({ title, body, url, icon: '/favicon/favicon-96x96.png' })
    let sent = 0

    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, payload)
        sent++
      } catch (err) {
        if (err instanceof Error && err.message.includes('410')) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      }
    }

    return new Response(JSON.stringify({ sent }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500 })
  }
})
