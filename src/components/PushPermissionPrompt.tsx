import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { subscribeToPush, getPushPermissionState } from '@/lib/webPush'
import styles from './PushPermissionPrompt.module.css'

const DISMISS_KEY = 'eg-push-dismissed-at'

export function PushPermissionPrompt() {
  const user = useAuthStore((s) => s.user)
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
    const ok = await subscribeToPush(user.id)
    if (ok) setVisible(false)
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
