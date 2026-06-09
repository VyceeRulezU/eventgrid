import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck, Search, Inbox, MailOpen, RefreshCw, Reply } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { getNotifications, markAsRead, markAllAsRead, navigateFromNotification } from '@/lib/notifications'
import { PageHero } from '@/components/shared/PageHero'
import type { Notification } from '@/types'

type TabKey = 'all' | 'unread' | 'replies'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'replies', label: 'Replies' },
]

export function NotificationsPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    if (!user) return
    getNotifications(user.id, 200).then((data) => {
      setNotifications(data)
      setLoading(false)
    })
  }, [user])

  const filtered = notifications.filter((n) => {
    if (tab === 'unread' && n.is_read) return false
    if (tab === 'replies' && n.type !== 'feedback_reply') return false
    if (search) {
      const q = search.toLowerCase()
      if (!n.title.toLowerCase().includes(q) && !(n.body || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.id)
      setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x)))
    }
    navigateFromNotification(n, navigate)
  }

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return
    await markAllAsRead(user.id)
    setNotifications(notifications.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() })))
  }, [user, notifications])

  const handleBulkMarkRead = async () => {
    if (!user) return
    for (const id of selected) {
      await markAsRead(id)
    }
    setNotifications(notifications.map((n) => selected.has(n.id) ? { ...n, is_read: true, read_at: n.read_at || new Date().toISOString() } : n))
    setSelected(new Set())
    setSelectAll(false)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set())
      setSelectAll(false)
    } else {
      setSelected(new Set(filtered.map((n) => n.id)))
      setSelectAll(true)
    }
  }

  return (
    <div>
      <PageHero
        icon={Bell}
        title="Notifications"
        subtitle={`${unreadCount} unread · ${notifications.length} total`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              display: 'flex', gap: 1,
              background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)',
              padding: 2, overflow: 'hidden',
            }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: '4px 12px', border: 'none', cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    background: tab === t.key ? 'var(--color-accent)' : 'transparent',
                    color: tab === t.key ? '#000' : 'var(--color-text-muted)',
                    fontSize: 'var(--text-xs)', fontWeight: 600,
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                  {t.key === 'unread' && unreadCount > 0 && (
                    <span style={{ marginLeft: 4, opacity: 0.7 }}>({unreadCount})</span>
                  )}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
                <CheckCheck size={14} />
                Mark All Read
              </button>
            )}
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setLoading(true); user && getNotifications(user.id, 200).then((d) => { setNotifications(d); setLoading(false) }) }}>
              <RefreshCw size={14} />
            </button>
          </div>
        }
      />

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-3)', position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          className="input"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36, borderRadius: 12 }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 64 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 'var(--space-8)' }}>
          <div className="empty-state__icon">
            {tab === 'replies' ? <Reply size={32} /> : <Inbox size={32} />}
          </div>
          <div className="empty-state__title">No {tab === 'unread' ? 'unread' : tab === 'replies' ? 'reply' : ''} notifications</div>
          <div className="empty-state__description">
            {tab === 'replies' ? "Admin replies to your feedback will appear here." : "You're all caught up!"}
          </div>
        </div>
      ) : (
        <>
          {/* Bulk actions */}
          {selected.size > 0 && (
            <div style={{
              padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-2)',
              background: 'var(--color-accent-muted)', borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
            }}>
              <span style={{ fontWeight: 600 }}>{selected.size} selected</span>
              <button className="btn btn-ghost btn-sm" onClick={handleBulkMarkRead}>
                <MailOpen size={12} /> Mark Read
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(new Set()); setSelectAll(false) }}>
                Clear
              </button>
            </div>
          )}

          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr auto',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-surface-1)',
              borderBottom: '1px solid var(--color-border-subtle)',
              fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectAll && filtered.length > 0}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                />
              </div>
              <div>Subject</div>
              <div style={{ paddingRight: 4 }}>Date</div>
            </div>

            {/* Rows */}
            {filtered.map((n) => {
              const isFeedbackReply = n.type === 'feedback_reply'
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr auto',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    background: n.is_read ? 'var(--color-surface-2)' : 'var(--color-accent-muted)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                    alignItems: 'center',
                  }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(n.id)}
                      onChange={() => toggleSelect(n.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                    />
                  </div>
                  <div
                    style={{ minWidth: 0, cursor: 'pointer' }}
                    onClick={() => handleClick(n)}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 1,
                    }}>
                      {isFeedbackReply && (
                        <Reply size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                      )}
                      <span style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: n.is_read ? 400 : 700,
                        color: n.is_read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {isFeedbackReply && !n.is_read ? (
                          <span style={{ color: 'var(--color-accent)' }}>{n.title}</span>
                        ) : (
                          n.title
                        )}
                      </span>
                      {!n.is_read && (
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: isFeedbackReply ? 'var(--color-accent)' : 'var(--color-accent)',
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                    {n.body && (
                      <div style={{
                        fontSize: 'var(--text-xs)',
                        color: isFeedbackReply ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                      }}>
                        {n.body}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 10, color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap', flexShrink: 0, paddingRight: 4,
                  }}>
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
