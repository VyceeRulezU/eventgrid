import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar, Plus, Users, Wallet, ChevronRight,
  Star, Activity, ListChecks,
  CheckCircle, FileText, UserPlus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { ReviewForm } from '@/features/reviews/ReviewForm'
import { MyFeedback } from '@/components/shared/MyFeedback'
import styles from './VendorPortal.module.css'

interface VendorEvent {
  id: string
  event_id: string
  event_name: string
  event_status: string
  event_date: string | null
  planner_id: string
  planner_name: string
  reviewed: boolean
}

interface ActivityItem {
  id: string
  type: string
  desc: string
  event_name: string
  timestamp: string
  icon: typeof Activity
  color: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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

export function VendorPortal() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [events, setEvents] = useState<VendorEvent[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      supabase.from('event_vendors').select('id, event_id, vendor_name, created_at'),
      supabase.from('events').select('id, name, status, event_date, created_by, updated_at'),
      supabase.from('profiles').select('id, display_name'),
      supabase.from('reviews').select('event_id').eq('reviewer_id', user.id),
      supabase.from('events').select('id, name, status, event_date, created_by, updated_at').eq('created_by', user.id).is('deleted_at', null),
      supabase.from('event_activity').select('*, event:events!inner(name)').order('created_at', { ascending: false }).limit(10),
    ]).then(([evRes, eventsRes, profilesRes, reviewsRes, myEventsRes, activityRes]) => {
      const reviewedEventIds = new Set((reviewsRes.data || []).map((r: any) => r.event_id))
      const eventsMap = new Map((eventsRes.data || []).map((e: any) => [e.id, e]))
      const profilesMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p.display_name]))
      const seen = new Set<string>()
      const vendorEvents: VendorEvent[] = []

      const addEvent = (event: any, vendorEventId: string) => {
        if (seen.has(event.id)) return
        seen.add(event.id)
        vendorEvents.push({
          id: vendorEventId,
          event_id: event.id,
          event_name: event.name,
          event_status: event.status,
          event_date: event.event_date,
          planner_id: event.created_by,
          planner_name: profilesMap.get(event.created_by) || '',
          reviewed: reviewedEventIds.has(event.id),
        })
      }

      for (const ev of (evRes.data || []) as any[]) {
        const event = eventsMap.get(ev.event_id)
        if (!event) continue
        addEvent(event, ev.id)
      }

      for (const event of (myEventsRes.data || []) as any[]) {
        addEvent(event, `own-${event.id}`)
      }

      vendorEvents.sort((a, b) => (b.event_date || '').localeCompare(a.event_date || ''))

      const eventIds = new Set(vendorEvents.map((e) => e.event_id))
      const activityIconMap: Record<string, { icon: typeof Activity; color: string }> = {
        task_created: { icon: CheckCircle, color: '#34d399' },
        task_status_changed: { icon: ListChecks, color: '#60a5fa' },
        task_deleted: { icon: FileText, color: '#f87171' },
        phase_status_changed: { icon: Activity, color: '#fbbf24' },
        team_member_added: { icon: UserPlus, color: '#a78bfa' },
        team_report: { icon: FileText, color: '#f472b6' },
      }
      const mapped: ActivityItem[] = (activityRes.data || [])
        .filter((a: any) => eventIds.has(a.event_id))
        .map((a: any) => {
          const meta = activityIconMap[a.action_type] || { icon: Activity, color: 'var(--color-text-muted)' }
          return {
            id: a.id,
            type: a.action_type,
            desc: a.description,
            event_name: a.event?.name || '',
            timestamp: a.created_at,
            icon: meta.icon,
            color: meta.color,
          }
        })
      setActivities(mapped)
      setEvents(vendorEvents)
      setLoading(false)
    })
  }, [user])

  const totalEvents = events.length
  const upcomingEvents = events.filter((e) => e.event_status === 'active' || e.event_status === 'in_progress' || e.event_status === 'confirmed')
  const completedEvents = events.filter((e) => e.event_status === 'completed')
  const pendingReviews = events.filter((e) => e.event_status === 'completed' && !e.reviewed)

  const shortcuts = [
    { icon: Plus, label: 'Create Event', desc: 'Start a new event', onClick: () => navigate('/events/new'), color: 'var(--color-accent)' },
    { icon: Users, label: 'Vendor Directory', desc: 'Browse and claim your profile', onClick: () => navigate('/vendors/directory'), color: '#60a5fa' },
    { icon: Wallet, label: 'Financials', desc: 'Track payments and budgets', onClick: () => navigate('/financials'), color: '#fbbf24' },
    { icon: ListChecks, label: 'My Tasks', desc: 'View assigned to-dos', onClick: () => navigate('/dashboard/my-tasks'), color: '#34d399' },
    { icon: Calendar, label: 'Calendar', desc: 'View your schedule', onClick: () => navigate('/calendar'), color: '#a78bfa' },
    { icon: Activity, label: 'All Events', desc: 'See all assigned events', onClick: () => navigate('/events'), color: '#f472b6' },
  ]

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-4)' }}>
          <img src="/ng-new-logo.png" alt="Loading" style={{ width: 56, height: 56, opacity: 0.4 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.quickActionsTitle}>Vendor Dashboard</h2>
        <div className={styles.quickActionsBtns}>
          <Link to="/events/new" className="btn btn-secondary">
            <Plus size={16} /> New Event
          </Link>
          <Link to="/vendors/directory" className="btn btn-secondary">
            <Users size={16} /> Directory
          </Link>
          <Link to="/events" className="btn btn-primary">
            <Calendar size={16} /> My Events
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardClickable}`} onClick={() => navigate('/events')} onKeyDown={(e) => e.key === 'Enter' && navigate('/events')} role="button" tabIndex={0}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Assigned Events</span>
            <span className={`${styles.statBadge} ${totalEvents > 0 ? styles.statBadgePositive : styles.statBadgeNeutral}`}>{totalEvents} total</span>
          </div>
          <div className={styles.statValue}>{totalEvents}</div>
          <div className={styles.barSparkline}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.barSparklineBar} style={{ height: `${Math.min(100, (i / 5) * 100)}%`, opacity: i <= Math.min(totalEvents, 5) / 5 ? 0.85 : 0.2 }} />
            ))}
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardClickable}`} onClick={() => navigate('/events')} onKeyDown={(e) => e.key === 'Enter' && navigate('/events')} role="button" tabIndex={0}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Upcoming</span>
            <span className={`${styles.statBadge} ${upcomingEvents.length > 0 ? styles.statBadgePositive : styles.statBadgeNeutral}`}>
              {upcomingEvents.length > 0 ? `${upcomingEvents.length} active` : 'none'}
            </span>
          </div>
          <div className={styles.statValue}>{upcomingEvents.length}</div>
          <div className={styles.barSparkline}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.barSparklineBar} style={{ height: `${Math.min(100, (i / 5) * 100)}%`, opacity: i <= Math.min(upcomingEvents.length, 5) / 5 ? 0.85 : 0.2 }} />
            ))}
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardClickable}`} onClick={() => navigate('/events')} onKeyDown={(e) => e.key === 'Enter' && navigate('/events')} role="button" tabIndex={0}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Completed</span>
            <span className={`${styles.statBadge} ${completedEvents.length > 0 ? styles.statBadgePositive : styles.statBadgeNeutral}`}>
              {completedEvents.length > 0 ? `${completedEvents.length} done` : 'none'}
            </span>
          </div>
          <div className={styles.statValue}>{completedEvents.length}</div>
          <div className={styles.barSparkline}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.barSparklineBar} style={{ height: `${Math.min(100, (i / 5) * 100)}%`, opacity: i <= Math.min(completedEvents.length, 5) / 5 ? 0.85 : 0.2 }} />
            ))}
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardClickable} ${styles.statCardReviewsDue}`} onClick={() => navigate('/dashboard/my-tasks')} onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard/my-tasks')} role="button" tabIndex={0}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Reviews Due</span>
            <span className={`${styles.statBadge} ${pendingReviews.length > 0 ? styles.statBadgePositive : styles.statBadgeNeutral}`}>
              {pendingReviews.length > 0 ? `${pendingReviews.length} pending` : 'none'}
            </span>
          </div>
          <div className={styles.statValue}>{pendingReviews.length}</div>
          <div className={styles.barSparkline}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.barSparklineBar} style={{ height: `${Math.min(100, (i / 5) * 100)}%`, opacity: i <= Math.min(pendingReviews.length, 5) / 5 ? 0.85 : 0.2 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts + Events two-col */}
      <div className={styles.twoCol}>
        {/* Events */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={16} style={{ color: 'var(--color-accent)' }} />
              My Events
            </h3>
            {events.length > 0 && (
              <Link to="/events" className={styles.sectionLink}>View all →</Link>
            )}
          </div>

          {events.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__icon"><Calendar size={24} /></div>
              <div className="empty-state__title">No events assigned yet</div>
              <div className="empty-state__description">You'll see your events here once a planner assigns you.</div>
            </div>
          ) : (
            <div className={styles.tableScroll}>
              <div className={styles.table}>
                <div className={`${styles.tableHead} ${styles.tableHeadEvents}`}>
                  <span>Event</span>
                  <span>Date</span>
                  <span>Planner</span>
                  <span className={styles.tableHeadCenter}>Status</span>
                </div>
                <div className={styles.tableBody}>
                  {events.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      className={`${styles.tableRow} ${styles.tableRowEvents} ${styles.tableRowClickable}`}
                      onClick={() => navigate(`/events/${ev.event_id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${ev.event_id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div>
                        <div className={styles.cellPrimary}>{ev.event_name}</div>
                        {!ev.reviewed && ev.event_status === 'completed' && (
                          <div className={styles.cellSecondary} style={{ color: 'var(--color-accent)' }}>
                            <Star size={10} /> Review pending
                          </div>
                        )}
                      </div>
                      <div className={styles.cellTruncate}>{formatDate(ev.event_date)}</div>
                      <div className={styles.cellTruncate}>{ev.planner_name || '—'}</div>
                      <div className={styles.cellCenter}>
                        <span className={`badge badge-${
                          ev.event_status === 'active' || ev.event_status === 'in_progress' || ev.event_status === 'confirmed' ? 'green'
                          : ev.event_status === 'completed' ? 'green'
                          : ev.event_status === 'draft' ? 'grey'
                          : 'yellow'
                        }`}>
                          <span className="badge-dot" />
                          {ev.event_status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Shortcuts</h3>
          </div>
          <div className={styles.shortcutList}>
            {shortcuts.map((action) => (
              <button
                key={action.label}
                type="button"
                className={styles.shortcutItem}
                onClick={action.onClick}
              >
                <div className={styles.shortcutIcon} style={{ background: `${action.color}18`, color: action.color }}>
                  <action.icon size={18} />
                </div>
                <div className={styles.shortcutText}>
                  <div className={styles.shortcutLabel}>{action.label}</div>
                  <div className={styles.shortcutDesc}>{action.desc}</div>
                </div>
                <ChevronRight size={16} className={styles.shortcutArrow} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Activity size={16} style={{ color: 'var(--color-accent)' }} />
              Recent Activity
            </h3>
          </div>
          <div className={styles.activityList}>
            {activities.map((a) => (
              <div key={a.id} className={styles.activityItem}>
                <div className={styles.activityIcon} style={{ background: `${a.color}18`, color: a.color }}>
                  <a.icon size={16} />
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityDesc}>{a.desc}</div>
                  <div className={styles.activityMeta}>
                    {a.event_name && <span>{a.event_name}</span>}
                    {a.event_name && <span className={styles.activityDot}>·</span>}
                    <span>{timeAgo(a.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews section for completed events */}
      {events.filter((ev) => !ev.reviewed && ev.event_status === 'completed' && ev.planner_id).length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Star size={16} style={{ color: 'var(--color-accent)' }} />
              Reviews to Submit
            </h3>
          </div>
          <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
            {events.filter((ev) => !ev.reviewed && ev.event_status === 'completed' && ev.planner_id).map((ev) => (
              <div key={ev.id} style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{ev.event_name}</p>
                <ReviewForm
                  reviewedId={ev.planner_id}
                  eventId={ev.event_id}
                  reviewerRole="vendor"
                  onSubmitted={() => setEvents((prev) => prev.map((e) => e.event_id === ev.event_id ? { ...e, reviewed: true } : e))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div>
        <MyFeedback />
      </div>
    </div>
  )
}
