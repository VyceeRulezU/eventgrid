import { useEffect, useState } from 'react'
import { Bell, CheckCheck, MessageSquare, Calendar, Users, AlertCircle, Info, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/notifications'
import type { Notification } from '@/types'

const TYPE_ICONS: Record<string, typeof Bell> = {
  feedback_reply: MessageSquare,
  event_update: Calendar,
  team_invite: Users,
  vendor_update: Users,
  alert: AlertCircle,
  info: Info,
}

export function NotificationsPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getNotifications(user.id, 100).then((data) => {
      setNotifications(data)
      setLoading(false)
    })
  }, [user])

  const handleMarkRead = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.id)
      setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x)))
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await markAllAsRead(user.id)
    setNotifications(notifications.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
              <Bell size={20} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ margin: 0 }}>Notifications</h2>
              {unreadCount > 0 && (
                <span className="badge badge-accent" style={{ fontSize: 11 }}>{unreadCount} new</span>
              )}
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              All communications and alerts
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={14} />
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1,2,3,4].map((i) => <div key={i} className="skeleton skeleton-card" style={{ height: 80 }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><Bell size={32} /></div>
          <div className="empty-state__title">No notifications yet</div>
          <div className="empty-state__description">
            You'll see notifications here when someone replies to your feedback or sends you an update.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Bell
            return (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n)}
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4) var(--space-5)',
                  background: n.is_read ? 'transparent' : 'var(--color-accent-muted)',
                  border: `1px solid ${n.is_read ? 'var(--color-border-subtle)' : 'var(--color-accent-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: n.is_read ? 'var(--color-surface-2)' : 'var(--color-accent-muted)',
                  color: n.is_read ? 'var(--color-text-muted)' : 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: 'var(--text-sm)', marginBottom: 2 }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 4 }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!n.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0, marginTop: 6 }} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
