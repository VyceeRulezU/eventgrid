import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck, Search, RefreshCw, Flag, Truck, MessageSquare, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { getNotifications, markAsRead, markAllAsRead, navigateFromNotification } from '@/lib/notifications'
import { FeedbackChat } from '@/components/shared/FeedbackChat'
import { PageHero } from '@/components/shared/PageHero'
import { Table } from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import type { Notification } from '@/types'
import styles from './NotificationsPage.module.css'

type TabKey = 'all' | 'unread' | 'replies'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'replies', label: 'Replies' },
]

const TYPE_ICONS: Record<string, typeof Bell> = {
  task_assigned: CheckCheck,
  issue_raised: Flag,
  issue_resolved: Flag,
  vendor_update: Truck,
  vendor_confirmed: Truck,
  feedback_reply: MessageSquare,
}

const TYPE_COLORS: Record<string, string> = {
  task_assigned: '#2ecc71',
  issue_raised: '#e74c3c',
  issue_resolved: '#2ecc71',
  vendor_update: '#f39c12',
  vendor_confirmed: '#2ecc71',
  feedback_reply: '#D4A017',
}

const columns: TableColumn[] = [
  { key: 'check', label: '' },
  { key: 'notification', label: 'Notification' },
  { key: 'type', label: 'Type' },
  { key: 'time', label: '' },
  { key: 'actions', label: '' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function parseFeedbackBody(body: string | null): { text: string; feedbackId: string | null } {
  if (!body) return { text: '', feedbackId: null }
  try {
    const parsed = JSON.parse(body)
    if (parsed.feedback_id && parsed.text) {
      return { text: parsed.text, feedbackId: parsed.feedback_id }
    }
  } catch {}
  return { text: body, feedbackId: null }
}

export function NotificationsPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [splitOpen, setSplitOpen] = useState(false)
  const [feedbackThreadId, setFeedbackThreadId] = useState<string | undefined>(undefined)
  const [activeNotifId, setActiveNotifId] = useState<string | undefined>(undefined)

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
    if (n.type === 'feedback_reply') {
      const { feedbackId } = parseFeedbackBody(n.body)
      setSplitOpen(true)
      setActiveNotifId(n.id)
      setFeedbackThreadId(feedbackId || undefined)
      return
    }
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
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const hasSelection = selected.size > 0

  return (
    <div className={styles.page}>
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

      <div className={styles.content}>
        {splitOpen ? (
          <div className={styles.splitLayout}>
            <div className={styles.splitLeft}>
              <Table
                columns={columns}
                minWidth="500px"
                loading={loading}
                empty={!loading && filtered.length === 0}
                emptyIcon={tab === 'replies' ? MessageSquare : Bell}
                emptyTitle={`No ${tab === 'unread' ? 'unread' : tab === 'replies' ? 'reply' : ''} notifications`}
                emptyDescription={tab === 'replies' ? "Admin replies to your feedback will appear here." : "You're all caught up!"}
                toolbar={
                  <div className={styles.searchWrapper}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                      className={`input ${styles.searchInput}`}
                      placeholder="Search notifications..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                }
                bulkBar={hasSelection ? (
                  <div className={styles.bulkBar}>
                    <span className={styles.bulkCount}>{selected.size} selected</span>
                    <button className="btn btn-ghost btn-sm" onClick={handleBulkMarkRead}>
                      <CheckCheck size={12} /> Mark Read
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(new Set()) }}>
                      Clear
                    </button>
                  </div>
                ) : undefined}
              >
                {filtered.map((n) => {
                  const TypeIcon = TYPE_ICONS[n.type] || Bell
                  const typeColor = TYPE_COLORS[n.type] || 'var(--color-accent)'
                  const isFeedbackReply = n.type === 'feedback_reply'
                  const isActive = isFeedbackReply && n.id === activeNotifId
                  const { text: displayBody } = parseFeedbackBody(n.body)
                  const isSelected = selected.has(n.id)

                  return (
                    <tr
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={isActive ? styles.rowActive : undefined}
                      style={{ cursor: 'pointer', background: !n.is_read ? 'var(--color-accent-muted)' : undefined }}
                    >
                      <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', width: 40 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(n.id)}
                          style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: typeColor, color: '#fff', flexShrink: 0, marginTop: 1,
                          }}>
                            <TypeIcon size={14} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontWeight: n.is_read ? 400 : 700,
                              fontSize: 'var(--text-sm)',
                              color: n.is_read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {n.title}
                            </div>
                            {displayBody && (
                              <div style={{
                                fontSize: 'var(--text-xs)',
                                color: isFeedbackReply ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                marginTop: 2, maxWidth: 300,
                              }}>
                                {displayBody}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                          <span style={{
                            fontSize: 9, fontWeight: 600, textTransform: 'capitalize',
                            padding: '0 6px', borderRadius: 4, lineHeight: '16px',
                            color: 'var(--color-text-muted)', background: 'var(--color-surface-3)',
                          }}>
                            {n.type.replace(/_/g, ' ')}
                          </span>
                          {n.event_id && (
                            <span style={{
                              fontSize: 9, fontWeight: 600, textTransform: 'capitalize',
                              padding: '0 6px', borderRadius: 4, lineHeight: '16px',
                              color: 'var(--color-accent)', background: 'var(--color-accent-muted)',
                            }}>
                              event
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {timeAgo(n.created_at)}
                      </td>
                      <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', width: 50 }} onClick={(e) => e.stopPropagation()}>
                        {isFeedbackReply && (
                          <button
                            onClick={() => handleClick(n)}
                            style={{
                              width: 30, height: 30, borderRadius: '50%', border: 'none',
                              background: 'var(--color-accent-muted)', color: 'var(--color-accent)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            title="Open conversation"
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </Table>
            </div>
            <div className={styles.splitRight}>
              <div className={styles.splitRightHeader}>
                <span className={styles.splitRightTitle}>Feedback Conversation</span>
                <button className="btn btn-ghost btn-icon" onClick={() => { setSplitOpen(false); setFeedbackThreadId(undefined); setActiveNotifId(undefined) }}>
                  <X size={24} />
                </button>
              </div>
              <div className={styles.splitRightBody}>
                <FeedbackChat mode="user" initialFeedbackId={feedbackThreadId} />
              </div>
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            minWidth="500px"
            loading={loading}
            empty={!loading && filtered.length === 0}
            emptyIcon={tab === 'replies' ? MessageSquare : Bell}
            emptyTitle={`No ${tab === 'unread' ? 'unread' : tab === 'replies' ? 'reply' : ''} notifications`}
            emptyDescription={tab === 'replies' ? "Admin replies to your feedback will appear here." : "You're all caught up!"}
            toolbar={
              <div className={styles.searchWrapper}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  className={`input ${styles.searchInput}`}
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            }
            bulkBar={hasSelection ? (
              <div className={styles.bulkBar}>
                <span className={styles.bulkCount}>{selected.size} selected</span>
                <button className="btn btn-ghost btn-sm" onClick={handleBulkMarkRead}>
                  <CheckCheck size={12} /> Mark Read
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(new Set()) }}>
                  Clear
                </button>
              </div>
            ) : undefined}
          >
            {filtered.map((n) => {
              const TypeIcon = TYPE_ICONS[n.type] || Bell
              const typeColor = TYPE_COLORS[n.type] || 'var(--color-accent)'
              const isFeedbackReply = n.type === 'feedback_reply'
              const isActive = isFeedbackReply && n.id === activeNotifId
              const { text: displayBody } = parseFeedbackBody(n.body)
              const isSelected = selected.has(n.id)

              return (
                <tr
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={isActive ? styles.rowActive : undefined}
                  style={{ cursor: 'pointer', background: !n.is_read ? 'var(--color-accent-muted)' : undefined }}
                >
                  <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', width: 40 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(n.id)}
                      style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: typeColor, color: '#fff', flexShrink: 0, marginTop: 1,
                      }}>
                        <TypeIcon size={14} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontWeight: n.is_read ? 400 : 700,
                          fontSize: 'var(--text-sm)',
                          color: n.is_read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {n.title}
                        </div>
                        {displayBody && (
                          <div style={{
                            fontSize: 'var(--text-xs)',
                            color: isFeedbackReply ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginTop: 2, maxWidth: 300,
                          }}>
                            {displayBody}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 600, textTransform: 'capitalize',
                        padding: '0 6px', borderRadius: 4, lineHeight: '16px',
                        color: 'var(--color-text-muted)', background: 'var(--color-surface-3)',
                      }}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      {n.event_id && (
                        <span style={{
                          fontSize: 9, fontWeight: 600,
                          padding: '0 6px', borderRadius: 4, lineHeight: '16px',
                          color: 'var(--color-accent)', background: 'var(--color-accent-muted)',
                        }}>
                          event
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {timeAgo(n.created_at)}
                  </td>
                  <td style={{ padding: 'var(--space-4)', verticalAlign: 'middle', width: 50 }} onClick={(e) => e.stopPropagation()}>
                    {isFeedbackReply && (
                      <button
                        onClick={() => handleClick(n)}
                        style={{
                          width: 30, height: 30, borderRadius: '50%', border: 'none',
                          background: 'var(--color-accent-muted)', color: 'var(--color-accent)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        title="Open conversation"
                      >
                        <MessageSquare size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </div>
    </div>
  )
}
