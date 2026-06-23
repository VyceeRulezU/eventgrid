import { supabase } from './supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export async function isPushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!import.meta.env.VITE_VAPID_PUBLIC_KEY
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
      console.error('VAPID key is not configured')
      return false
    }

    let registration: ServiceWorkerRegistration
    const existing = await navigator.serviceWorker.getRegistration()
    if (existing) {
      registration = existing
    } else {
      registration = await navigator.serviceWorker.register('/sw.js')
    }
    await navigator.serviceWorker.ready

    const applicationServerKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    })

    const subData = subscription.toJSON()

    // Remove old subscriptions for this user with same endpoint
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .filter('subscription', 'cs', JSON.stringify({ endpoint: subData.endpoint }))

    // Insert new subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        subscription: subData,
        user_agent: navigator.userAgent,
      })

    if (error) {
      console.error('Failed to save push subscription:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('subscribeToPush error:', err)
    return false
  }
}

export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      const sub = subscription.toJSON()
      if (sub.endpoint) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .filter('subscription', 'cs', JSON.stringify({ endpoint: sub.endpoint }))
      }
      await subscription.unsubscribe()
    }

    return true
  } catch (err) {
    console.error('unsubscribeFromPush error:', err)
    return false
  }
}

export async function getPushPermissionState(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  if (!('serviceWorker' in navigator)) return 'unsupported'
  if (!('PushManager' in window)) return 'unsupported'
  const p = Notification.permission
  if (p === 'default') return 'prompt' as const
  return p
}
