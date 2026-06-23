import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { subscribeToPush, getPushPermissionState } from '@/lib/webPush'
import styles from './PushPermissionPrompt.module.css'

const DISMISS_KEY = 'eg-push-dismissed-at'

export function PushPermissionPrompt() {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!user) {
      setVisible(false)
      return
    }

    const timer = setTimeout(async () => {
      const state = await getPushPermissionState()
      if (state !== 'prompt') return

      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (dismissed) {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        if (Number(dismissed) > weekAgo) return
        localStorage.removeItem(DISMISS_KEY)
      }

      setVisible(true)
    }, 30000)

    return () => clearTimeout(timer)
  }, [user])

  async function handleEnable() {
    if (!user) return
    const result = await subscribeToPush(user.id)
    setVisible(false)
    if (result.ok) {
      showNotification({ variant: 'success', title: 'Push notifications enabled', message: 'You will now receive updates even when this tab is closed.' })
    } else {
      const messages: Record<string, string> = {
        permission_denied: 'Please allow notifications in your browser prompt.',
        not_supported: 'Push notifications are not supported on this browser. Try Chrome on Android, or add this site to your home screen on iOS.',
        sw_error: 'Could not register the notification service. Try updating your browser or using Chrome.',
        config_error: 'Notifications are not configured yet. Please try again later.',
        save_error: 'Could not save your subscription. Try again from Settings.',
      }
      showNotification({ variant: 'error', title: 'Setup failed', message: messages[result.reason] || 'Could not complete setup. Try again from Settings.' })
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.prompt}>
        <button className={styles.close} onClick={handleDismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
        <div className={styles.promptIcon}>
          <Bell size={20} />
        </div>
        <div className={styles.promptBody}>
          <p className={styles.promptTitle}>Enable notifications</p>
          <p className={styles.promptText}>
            Get instant updates on tasks, issues, and vendor activity.
          </p>
          <div className={styles.promptActions}>
            <button className={styles.enableBtn} onClick={handleEnable}>
              Enable notifications
            </button>
            <button className={styles.notNowBtn} onClick={handleDismiss}>
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
