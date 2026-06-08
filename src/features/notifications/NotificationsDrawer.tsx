import { useEffect, useRef } from 'react'
import { X, Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notification.store'
import { getNotifications, markAsRead, markAllAsRead, navigateFromNotification } from '@/lib/notifications'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@/types'

export function NotificationsDrawer() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { notifications, drawerOpen, setDrawerOpen, setNotifications, decrementUnread, unreadCount } = useNotificationStore()
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !drawerOpen) return
    getNotifications(user.id).then(setNotifications)
  }, [user, drawerOpen, setNotifications])

  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [drawerOpen])

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.id)
      decrementUnread()
      setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x)))
    }
    setDrawerOpen(false)
    navigateFromNotification(n, navigate)
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await markAllAsRead(user.id)
    setNotifications(notifications.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() })))
  }

  return (
    <>
      {drawerOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 999,
        }} />
      )}

      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(380px, 100vw)',
          background: 'var(--color-bg-base)',
          borderLeft: '1px solid var(--color-border)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--transition-base)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Bell size={20} />
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <span className="badge badge-accent" style={{ fontSize: 11 }}>{unreadCount}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-icon" onClick={handleMarkAllRead} title="Mark all as read">
                <CheckCheck size={18} />
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={() => setDrawerOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-8)',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}>
              <Bell size={32} style={{ marginBottom: 'var(--space-3)', opacity: 0.4 }} />
              <div style={{ fontSize: 'var(--text-sm)' }}>No notifications yet</div>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
            ))
          )}
        </div>
      </div>
    </>
  )
}
