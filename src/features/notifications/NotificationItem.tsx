import type { Notification } from '@/types'
import { Bell, Calendar, CircleDollarSign, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react'

const TYPE_ICONS: Record<string, typeof Bell> = {
  task_assigned: CheckCircle,
  task_due: Calendar,
  issue_raised: AlertTriangle,
  issue_resolved: CheckCircle,
  vendor_update: CircleDollarSign,
  vendor_confirmed: CircleDollarSign,
  guest_checkin: MessageSquare,
}

const TYPE_COLORS: Record<string, string> = {
  task_assigned: 'var(--color-accent)',
  task_due: 'var(--color-warning)',
  issue_raised: 'var(--color-error)',
  issue_resolved: 'var(--color-success)',
  vendor_update: 'var(--color-info)',
  vendor_confirmed: 'var(--color-success)',
  guest_checkin: 'var(--color-info)',
}

interface NotificationItemProps {
  notification: Notification
  onClick: (n: Notification) => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type] || Bell
  const color = TYPE_COLORS[notification.type] || 'var(--color-text-secondary)'
  const timeAgo = getTimeAgo(notification.created_at)

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: notification.is_read ? 'transparent' : 'var(--color-accent-muted)',
        borderLeft: notification.is_read ? '3px solid transparent' : `3px solid var(--color-accent)`,
        cursor: 'pointer',
        transition: 'background var(--transition-fast)',
      }}
      onClick={() => onClick(notification)}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--radius-full)',
        background: `${color}1a`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: notification.is_read ? 400 : 600 }}>
          {notification.title}
        </div>
        {notification.body && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {notification.body}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{timeAgo}</div>
      </div>
    </div>
  )
}

function getTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
