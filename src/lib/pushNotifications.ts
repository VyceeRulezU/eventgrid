import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export async function isPushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY
}

export async function getPushPermission(): Promise<NotificationPermission> {
  return Notification.permission
}

export async function requestPermission(): Promise<boolean> {
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  return registration
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) return null
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
    return subscription
  } catch {
    return null
  }
}

export async function getExistingSubscription(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  return registration.pushManager.getSubscription()
}

export async function saveSubscription(subscription: PushSubscription, userId: string) {
  const sub = subscription.toJSON()

  // Remove old subscription with same endpoint for this user
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .filter('subscription', 'cs', JSON.stringify({ endpoint: sub.endpoint }))

  const { error } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id: userId,
      subscription: sub,
      user_agent: navigator.userAgent,
    })
  if (error) console.error('Failed to save push subscription:', error)
}

export async function removeSubscription(subscription: PushSubscription) {
  const sub = subscription.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .filter('subscription', 'cs', JSON.stringify({ endpoint: sub.endpoint }))
  if (error) console.error('Failed to remove push subscription:', error)
}

export async function unsubscribeAll() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await removeSubscription(subscription)
    await subscription.unsubscribe()
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}
