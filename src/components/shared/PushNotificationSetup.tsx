import { useEffect, useState } from 'react'
import { Bell, BellOff, Smartphone } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { usePushNotificationStore } from '@/store/pushNotification.store'
import {
  isPushSupported,
  getPushPermission,
  requestPermission,
  registerServiceWorker,
  subscribeToPush,
  getExistingSubscription,
  saveSubscription,
  unsubscribeAll,
} from '@/lib/pushNotifications'

export function PushNotificationSetup() {
  const user = useAuthStore((s) => s.user)
  const { enabled, supported, permission, setEnabled, setSupported, setPermission } = usePushNotificationStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    isPushSupported().then(setSupported)
  }, [])

  useEffect(() => {
    if (supported) {
      getPushPermission().then(setPermission)
    }
  }, [supported])

  const handleToggle = async () => {
    if (!user) return
    setLoading(true)
    try {
      if (enabled) {
        await unsubscribeAll()
        setEnabled(false)
      } else {
        if (permission !== 'granted') {
          const granted = await requestPermission()
          setPermission(granted ? 'granted' : 'denied')
          if (!granted) { setLoading(false); return }
        }
        const registration = await registerServiceWorker()
        if (!registration) { setLoading(false); return }
        const existing = await getExistingSubscription(registration)
        const subscription = existing || (await subscribeToPush(registration))
        if (subscription) {
          await saveSubscription(subscription, user.id)
          setEnabled(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        <Smartphone size={18} />
        <span>Push notifications are not supported on this device or browser.</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {enabled ? <Bell size={18} style={{ color: 'var(--color-accent)' }} /> : <BellOff size={18} />}
        <div>
          <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>Push Notifications</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {enabled ? 'Notifications will appear even when this tab is closed' : 'Get notified of important updates'}
          </div>
        </div>
      </div>
      <button
        className={`btn btn-sm ${enabled ? 'btn-secondary' : 'btn-accent'}`}
        style={{ color: '#fff' }}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? '...' : enabled ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}
