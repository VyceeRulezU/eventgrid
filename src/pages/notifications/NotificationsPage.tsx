import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck, Search, Inbox, MailOpen, RefreshCw, Reply } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { getNotifications, markAsRead, markAllAsRead, navigateFromNotification } from '@/lib/notifications'
import { PageHero } from '@/components/shared/PageHero'
import type { Notification } from '@/types'
import styles from './NotificationsPage.module.css'

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
            <div className={styles.tabBar}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
                >
                  {t.label}
                  {t.key === 'unread' && unreadCount > 0 && (
                    <span className={styles.tabCount}>({unreadCount})</span>
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
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setLoading(true); user && getNotifications(user.id, 200).then((d) => { setNotifications(d); setLoading(false) }) }} data-tooltip="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        }
      />

      <div className={styles.searchWrapper}>
        <Search size={14} className={styles.searchIcon} />
        <input
          className={`input ${styles.searchInput}`}
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 64 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`empty-state ${styles.emptyState}`}>
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
          {selected.size > 0 && (
            <div className={styles.bulkBar}>
              <span className={styles.bulkCount}>{selected.size} selected</span>
              <button className="btn btn-ghost btn-sm" onClick={handleBulkMarkRead}>
                <MailOpen size={12} /> Mark Read
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(new Set()); setSelectAll(false) }}>
                Clear
              </button>
            </div>
          )}

          <div className={styles.inbox}>
            <div className={styles.inboxHeader}>
              <div className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectAll && filtered.length > 0}
                  onChange={toggleSelectAll}
                />
              </div>
              <div>Subject</div>
              <div style={{ paddingRight: 4 }}>Date</div>
            </div>

            {filtered.map((n) => {
              const isFeedbackReply = n.type === 'feedback_reply'
              return (
                <div
                  key={n.id}
                  className={`${styles.row} ${n.is_read ? styles.rowRead : styles.rowUnread}`}
                >
                  <div className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selected.has(n.id)}
                      onChange={() => toggleSelect(n.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.rowContent} onClick={() => handleClick(n)}>
                    <div className={styles.rowTitleRow}>
                      {isFeedbackReply && <Reply size={12} className={styles.replyIcon} />}
                      <span className={`${styles.rowSubject} ${
                        isFeedbackReply && !n.is_read
                          ? styles.rowSubjectGold
                          : n.is_read
                            ? styles.rowSubjectNormal
                            : styles.rowSubjectBold
                      }`}>
                        {n.title}
                      </span>
                      {!n.is_read && <span className={styles.rowDot} />}
                    </div>
                    {n.body && (
                      <div className={`${styles.rowSnippet} ${isFeedbackReply ? styles.rowSnippetGold : ''}`}>
                        {n.body}
                      </div>
                    )}
                  </div>
                  <div className={styles.rowDate}>
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
