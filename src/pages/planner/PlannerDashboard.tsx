import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Calendar, CircleDollarSign, Users, UserPlus,
  ExternalLink, BarChart3, CheckCircle2,
  Mail, X, Copy, Check, UserCheck, ListChecks,
  Activity, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { Pagination } from '@/components/ui/Pagination'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { SEO } from '@/components/shared/SEO'
import type { Event, EventPhase, Task } from '@/types'
import styles from './PlannerDashboard.module.css'

const ACTIVITY_PAGE_SIZE = 5

interface EventWithPhases extends Event {
  phases?: EventPhase[]
}

interface ActivityItem {
  id: string
  type: 'event_created' | 'task_updated' | 'phase_completed'
  typeLabel: string
  desc: string
  eventName?: string
  timestamp: string
  link?: string
  icon: typeof Activity
  color: string
}

function formatEventType(type: string | null | undefined): string {
  if (!type) return '—'
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getCurrentPhaseName(event: EventWithPhases): string {
  const phases = event.phases || []
  if (event.current_phase && phases.length > 0) {
    return phases[event.current_phase - 1]?.phase_name || `Phase ${event.current_phase}`
  }
  return '—'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface StatConfig {
  label: string
  value: number
  data: { value: number }[]
  positive: boolean
  clickable?: boolean
  onClick?: () => void
}

function calcTrend(data: { value: number }[]): { label: string; positive: boolean | null } {
  if (data.length < 2) return { label: 'No prior data', positive: null }
  const last = data[data.length - 1]?.value ?? 0
  const prev = data[data.length - 2]?.value ?? 0
  if (prev === 0 && last === 0) return { label: '0% this month', positive: null }
  if (prev === 0) return { label: '+100% this month', positive: true }
  const pct = Math.round(((last - prev) / prev) * 100)
  if (pct > 0) return { label: `+${pct}% this month`, positive: true }
  if (pct < 0) return { label: `${pct}% last month`, positive: false }
  return { label: '0% this month', positive: null }
}

function BarSparkline({ data, positive }: { data: { value: number }[]; positive: boolean | null }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const variant =
    positive === true ? styles.barSparklinePositive
    : positive === false ? styles.barSparklineNegative
    : ''

  return (
    <div className={`${styles.barSparkline} ${variant}`} aria-hidden="true">
      {data.map((d, i) => (
        <div
          key={i}
          className={styles.barSparklineBar}
          style={{ height: `${Math.max((d.value / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  )
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

function InviteClientModal({ events, onClose }: {
  events: { id: string; name: string }[]
  onClose: () => void
}) {
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id || '')
  const [generating, setGenerating] = useState(false)
  const [portalToken, setPortalToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const showNotification = useUIStore((s) => s.showNotification)

  const generateLink = async () => {
    if (!selectedEvent) return
    setGenerating(true)
    const { data, error } = await supabase
      .from('client_portals')
      .insert({ event_id: selectedEvent })
      .select('token')
      .single()

    if (error) {
      showNotification({ variant: 'error', title: 'Failed', message: error.message })
      setGenerating(false)
      return
    }
    setPortalToken(data.token)
    setGenerating(false)
  }

  const portalUrl = portalToken ? `${window.location.origin}/portal/${portalToken}` : null

  const copyLink = () => {
    if (!portalUrl) return
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={`card ${styles.modalCard}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <ExternalLink size={18} style={{ marginRight: 'var(--space-2)', verticalAlign: 'middle', color: 'var(--color-accent)' }} />
            Invite Client
          </h3>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className={styles.modalDesc}>
          Generate a read-only portal link for your client. They can view progress without seeing financial data.
        </p>

        {!portalToken ? (
          <>
            <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label" htmlFor="invite-event">Select Event</label>
              <DropdownMenu
                trigger={<span>{events.find((e) => e.id === selectedEvent)?.name || 'Select event...'}</span>}
                items={events.map((e) => ({ label: e.name, value: e.id }))}
                onSelect={(item) => setSelectedEvent(item.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={`btn btn-primary ${styles.modalActionsPrimary}`}
                onClick={generateLink}
                disabled={generating || !selectedEvent}
              >
                <ExternalLink size={16} />
                {generating ? 'Generating...' : 'Generate Portal Link'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.modalUrlBox}>{portalUrl}</div>
            <div className={styles.modalActions}>
              <button type="button" className={`btn btn-primary ${styles.modalActionsPrimary}`} onClick={copyLink}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AddCoordinatorModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const org = useAuthStore((s) => s.org)
  const showNotification = useUIStore((s) => s.showNotification)

  const handleInvite = async () => {
    if (!email.trim()) return
    setSending(true)

    const { error } = await supabase
      .from('org_invites')
      .insert({
        org_id: org!.id,
        email: email.trim().toLowerCase(),
        role: 'coordinator',
        display_name: name.trim() || null,
      })

    if (error) {
      if (error.code === '42P01') {
        setSent(true)
        setSending(false)
        return
      }
      showNotification({ variant: 'error', title: 'Failed to invite', message: error.message })
      setSending(false)
      return
    }

    setSent(true)
    setSending(false)
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={`card ${styles.modalCard}`} style={{ maxWidth: 440 }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <UserCheck size={18} style={{ marginRight: 'var(--space-2)', verticalAlign: 'middle', color: 'var(--color-info)' }} />
            Add Coordinator
          </h3>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {!sent ? (
          <>
            <p className={styles.modalDesc}>Invite a coordinator to join your organisation.</p>
            <div className={styles.modalFieldGroup}>
              <div className="input-wrapper">
                <label className="input-label" htmlFor="coord-name">Coordinator Name</label>
                <input
                  id="coord-name"
                  className="input"
                  placeholder="e.g. Amaka Obi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="input-wrapper">
                <label className="input-label" htmlFor="coord-email">Email Address *</label>
                <input
                  id="coord-email"
                  className="input"
                  type="email"
                  placeholder="coordinator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={`btn btn-primary ${styles.modalActionsPrimary}`}
                onClick={handleInvite}
                disabled={sending || !email.trim()}
              >
                <Mail size={16} />
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <div className={styles.modalSuccess}>
            <div className={styles.modalSuccessIcon}>
              <CheckCircle2 size={28} />
            </div>
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Invite Sent!</div>
            <div className={styles.modalDesc}>
              An invite has been recorded for <strong>{email}</strong>.
            </div>
            <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

export function PlannerDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)

  const [events, setEvents] = useState<EventWithPhases[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0, activeEvents: 0, draftEvents: 0,
    upcomingTasks: 0, openIssues: 0, totalVendors: 0,
  })
  const [timeline, setTimeline] = useState({
    events: [] as { value: number }[],
    tasks: [] as { value: number }[],
    issues: [] as { value: number }[],
    vendors: [] as { value: number }[],
  })
  const [showInviteClient, setShowInviteClient] = useState(false)
  const [showAddCoordinator, setShowAddCoordinator] = useState(false)
  const [activityPage, setActivityPage] = useState(1)

  useEffect(() => {
    if (!user || !org) { setLoading(false); return }

    async function load() {
      const { data: evts } = await supabase
        .from('events')
        .select('*')
        .eq('org_id', org!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!evts) { setLoading(false); return }

      const eventsWithPhases: EventWithPhases[] = await Promise.all(
        evts.map(async (ev) => {
          const { data: phases } = await supabase
            .from('event_phases')
            .select('*')
            .eq('event_id', ev.id)
            .order('phase_number', { ascending: true })
          return { ...ev, phases: phases || [] } as EventWithPhases
        })
      )

      setEvents(eventsWithPhases)

      const active = evts.filter((e) => e.status === 'active' || e.status === 'in_progress').length

      const { count: tasksDue } = await supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .is('deleted_at', null)
        .not('status', 'eq', 'done')
        .lte('due_datetime', new Date().toISOString())

      const { count: issues } = await supabase
        .from('issues')
        .select('id', { count: 'exact' })
        .is('resolved_at', null)

      const { count: vendors } = await supabase
        .from('vendors')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org!.id)
        .is('deleted_at', null)

      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20)

      if (taskData) setTasks(taskData)

      setStats({
        totalEvents: evts.length,
        activeEvents: active,
        draftEvents: evts.filter((e) => e.status === 'draft').length,
        upcomingTasks: tasksDue || 0,
        openIssues: issues || 0,
        totalVendors: vendors || 0,
      })

      const sixMos = new Date()
      sixMos.setMonth(sixMos.getMonth() - 5)
      sixMos.setDate(1)
      sixMos.setHours(0, 0, 0, 0)
      const since = sixMos.toISOString()

      const [evDates, tDates, iDates, vDates] = await Promise.all([
        supabase.from('events').select('created_at').eq('org_id', org!.id).is('deleted_at', null).gte('created_at', since),
        supabase.from('tasks').select('created_at').is('deleted_at', null).gte('created_at', since),
        supabase.from('issues').select('created_at').is('deleted_at', null).gte('created_at', since),
        supabase.from('vendors').select('created_at').eq('org_id', org!.id).is('deleted_at', null).gte('created_at', since),
      ])

      function binToMonths(dates: { created_at: string }[]): { value: number }[] {
        const buckets: Record<string, number> = {}
        for (let i = 5; i >= 1; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i + 1)
          buckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0
        }
        for (const r of dates) {
          const d = new Date(r.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          if (key in buckets) buckets[key]++
        }
        return Object.values(buckets).map((v) => ({ value: v }))
      }

      setTimeline({
        events: binToMonths(evDates?.data || []),
        tasks: binToMonths(tDates?.data || []),
        issues: binToMonths(iDates?.data || []),
        vendors: binToMonths(vDates?.data || []),
      })

      setLoading(false)
    }

    load()
  }, [user, org])

  const activities = useMemo(() => {
    const items: ActivityItem[] = []

    for (const ev of events) {
      items.push({
        id: `evt-${ev.id}`,
        type: 'event_created',
        typeLabel: 'Event',
        desc: `Created "${ev.name}"`,
        eventName: ev.name,
        timestamp: ev.created_at,
        link: `/events/${ev.id}`,
        icon: Calendar,
        color: 'var(--color-accent)',
      })

      const completedPhases = (ev.phases || []).filter((p) => p.status === 'completed')
      if (completedPhases.length > 0) {
        const latest = completedPhases[completedPhases.length - 1]
        items.push({
          id: `phase-${latest.id}`,
          type: 'phase_completed',
          typeLabel: 'Phase',
          desc: `Completed "${latest.phase_name}"`,
          eventName: ev.name,
          timestamp: latest.completed_at || ev.updated_at,
          link: `/events/${ev.id}`,
          icon: CheckCircle2,
          color: 'var(--color-accent)',
        })
      }
    }

    for (const t of tasks) {
      const linkedEvent = events.find((e) => e.id === t.event_id)
      items.push({
        id: `task-${t.id}`,
        type: 'task_updated',
        typeLabel: 'Task',
        desc: `"${t.title}" → ${t.status.replace('_', ' ')}`,
        eventName: linkedEvent?.name,
        timestamp: t.updated_at || t.created_at,
        link: t.event_id ? `/events/${t.event_id}/tasks` : undefined,
        icon: ListChecks,
        color: t.status === 'done' ? 'var(--color-accent)' : 'var(--color-warning)',
      })
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return items
  }, [events, tasks])

  const activityTotalPages = Math.max(1, Math.ceil(activities.length / ACTIVITY_PAGE_SIZE))
  const pagedActivities = activities.slice(
    (activityPage - 1) * ACTIVITY_PAGE_SIZE,
    activityPage * ACTIVITY_PAGE_SIZE
  )

  useEffect(() => {
    if (activityPage > activityTotalPages) setActivityPage(1)
  }, [activityPage, activityTotalPages])

  const eventSelectList = events.map((e) => ({ id: e.id, name: e.name }))

  const statCards: StatConfig[] = [
    { label: 'Total Events', value: stats.totalEvents, data: timeline.events, positive: calcTrend(timeline.events).positive ?? true, clickable: true, onClick: () => navigate('/events') },
    { label: 'Active Events', value: stats.activeEvents, data: timeline.events, positive: calcTrend(timeline.events).positive ?? true, clickable: true, onClick: () => navigate('/events') },
    { label: 'Overdue Tasks', value: stats.upcomingTasks, data: timeline.tasks, positive: stats.upcomingTasks === 0 },
    { label: 'Open Issues', value: stats.openIssues, data: timeline.issues, positive: stats.openIssues === 0 },
  ]

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-4)' }}>
          <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 56, height: 56, opacity: 0.4 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <SEO title="Planner Dashboard" description="Access your Planner Workspace: track guest counts, budget developments, vendor payouts, and coordinator tasks live." />
      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.quickActionsTitle}>Quick Actions</h2>
        <div className={styles.quickActionsBtns}>
          <button type="button" className={styles.actionOutline} onClick={() => setShowAddCoordinator(true)}>
            <UserPlus size={16} /> Add Coordinator
          </button>
          <button type="button" className={styles.actionOutline} onClick={() => setShowInviteClient(true)}>
            <ExternalLink size={16} /> Invite Client
          </button>
          <Link to="/events/new" className="btn btn-primary" id="tour-create-event">
            <Plus size={16} /> Create Event
          </Link>
        </div>
      </div>

      {/* Overview bento cards */}
      <div className={styles.statsGrid} id="tour-stats-grid">
        {statCards.map((s) => {
          const trend = calcTrend(s.data)
          const badgeClass =
            trend.positive === true ? styles.statBadgePositive
            : trend.positive === false ? styles.statBadgeNegative
            : styles.statBadgeNeutral

          return (
            <div
              key={s.label}
              className={`${styles.statCard} ${s.clickable ? styles.statCardClickable : ''}`}
              onClick={s.onClick}
              onKeyDown={(e) => s.clickable && e.key === 'Enter' && s.onClick?.()}
              role={s.clickable ? 'button' : undefined}
              tabIndex={s.clickable ? 0 : undefined}
            >
              <div className={styles.statCardHeader}>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={`${styles.statBadge} ${badgeClass}`}>{trend.label}</span>
              </div>
              <div className={styles.statValue}>{s.value.toLocaleString()}</div>
              <BarSparkline data={s.data} positive={s.positive ? true : s.positive === false ? false : null} />
            </div>
          )
        })}
      </div>

      {/* Events + shortcuts */}
      <div className={styles.twoCol}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={16} style={{ color: 'var(--color-accent)' }} />
              My Events
            </h3>
            <Link to="/events" className={styles.sectionLink}>View all →</Link>
          </div>

          {events.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__icon"><Calendar size={24} /></div>
              <div className="empty-state__title">No events yet</div>
              <div className="empty-state__description">Create your first event to get started</div>
              <Link to="/events/new" className="btn btn-primary">
                <Plus size={16} /> Create Event
              </Link>
            </div>
          ) : (
            <div className={styles.tableScroll}>
              <div className={styles.table}>
                <div className={`${styles.tableHead} ${styles.tableHeadEvents}`}>
                  <span>Event</span>
                  <span>Type</span>
                  <span>Date</span>
                  <span className={styles.tableHeadCenter}>Guests</span>
                  <span>Venue</span>
                  <span className={styles.tableHeadCenter}>Status</span>
                  <span>Current Phase</span>
                  <span className={styles.tableHeadCenter}>Payment</span>
                </div>
                <div className={styles.tableBody}>
                  {events.slice(0, 5).map((event) => {
                    const phases = event.phases || []
                    const completed = phases.filter((p) => p.status === 'completed').length
                    return (
                      <div
                        key={event.id}
                        className={`${styles.tableRow} ${styles.tableRowEvents} ${styles.tableRowClickable}`}
                        onClick={() => navigate(`/events/${event.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                        role="button"
                        tabIndex={0}
                      >
                        <div>
                          <div className={styles.cellPrimary}>{event.name}</div>
                          <div className={styles.cellSecondary}>
                            {completed}/{phases.length || 9} phases · Updated {formatDate(event.updated_at)}
                          </div>
                        </div>
                        <div className={styles.cellTruncate}>
                          <span className={styles.eventType}>{formatEventType(event.event_type)}</span>
                        </div>
                        <div className={styles.cellTruncate}>{formatDate(event.event_date)}</div>
                        <div className={styles.cellCenter}>
                          <span className={styles.cellTruncate}>{event.guest_count ?? '—'}</span>
                        </div>
                        <div className={styles.cellTruncate}>{event.venue_name || '—'}</div>
                        <div className={styles.cellCenter}>
                          <span className={`badge badge-${
                            event.status === 'active' || event.status === 'in_progress' || event.status === 'completed' ? 'green'
                            : event.status === 'draft' ? 'grey' : 'red'
                          }`}>
                            <span className="badge-dot" />
                            {event.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <div className={styles.cellTruncate}>{getCurrentPhaseName(event)}</div>
                          <div className={styles.cellSecondary}>{completed}/{phases.length || 9} done</div>
                        </div>
                        <div className={styles.cellCenter}>
                          <span className={`badge badge-${event.payment_status === 'paid' ? 'paid' : 'unpaid'}`}>
                            {event.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.sectionCard} id="tour-shortcuts">
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Shortcuts</h3>
          </div>
          <div className={styles.shortcutList}>
            {[
              { icon: Plus, label: 'New Event', desc: 'Start a new event draft', onClick: () => navigate('/events/new'), color: 'var(--color-accent)' },
              { icon: UserPlus, label: 'Add Coordinator', desc: 'Invite a team member', onClick: () => setShowAddCoordinator(true), color: 'var(--color-info)' },
              { icon: ExternalLink, label: 'Client Portal', desc: 'Generate a read-only link', onClick: () => setShowInviteClient(true), color: 'var(--color-accent)' },
              { icon: CircleDollarSign, label: 'Financials', desc: 'Budgets & vendor payments', onClick: () => navigate('/financials'), color: 'var(--color-warning)' },
              { icon: Users, label: 'Vendor Directory', desc: 'Browse and manage vendors', onClick: () => navigate('/vendors/directory'), color: 'var(--color-text-secondary)' },
              { icon: BarChart3, label: 'Event Reports', desc: 'Aftermath & PDF export', onClick: () => events[0] && navigate(`/events/${events[0].id}/aftermath`), color: 'var(--color-text-secondary)' },
            ].map((action) => (
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
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Activity size={16} style={{ color: 'var(--color-accent)' }} />
            Recent Activity
          </h3>
        </div>

        {activities.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <div className="empty-state__title">No activity yet</div>
            <div className="empty-state__description">Activities will appear here as you manage events</div>
          </div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <div className={styles.table}>
                <div className={`${styles.tableHead} ${styles.tableHeadActivity}`}>
                  <span />
                  <span>Type</span>
                  <span>Activity</span>
                  <span>Event</span>
                  <span>Date</span>
                  <span className={styles.tableHeadRight}>Ago</span>
                </div>
                <div className={styles.tableBody}>
                  {pagedActivities.map((act) => (
                    <div
                      key={act.id}
                      className={`${styles.tableRow} ${styles.tableRowActivity} ${act.link ? styles.tableRowClickable : ''}`}
                      onClick={() => act.link && navigate(act.link)}
                      onKeyDown={(e) => act.link && e.key === 'Enter' && navigate(act.link!)}
                      role={act.link ? 'button' : undefined}
                      tabIndex={act.link ? 0 : undefined}
                    >
                      <div
                        className={styles.activityIcon}
                        style={{ background: `${act.color}18`, color: act.color }}
                      >
                        <act.icon size={14} />
                      </div>
                      <div className={styles.typeBadge}>{act.typeLabel}</div>
                      <div className={styles.activityDesc}>{act.desc}</div>
                      <div className={styles.cellTruncate}>{act.eventName || '—'}</div>
                      <div className={styles.cellTruncate}>{formatDate(act.timestamp)}</div>
                      <div className={styles.cellRight}>{timeAgo(act.timestamp)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.tableFooter}>
              <span className={styles.tableFooterInfo}>
                Showing {(activityPage - 1) * ACTIVITY_PAGE_SIZE + 1}–{Math.min(activityPage * ACTIVITY_PAGE_SIZE, activities.length)} of {activities.length}
              </span>
              <Pagination
                currentPage={activityPage}
                totalPages={activityTotalPages}
                onPageChange={setActivityPage}
              />
            </div>
          </>
        )}
      </div>

      {showInviteClient && (
        <InviteClientModal events={eventSelectList} onClose={() => setShowInviteClient(false)} />
      )}
      {showAddCoordinator && (
        <AddCoordinatorModal onClose={() => setShowAddCoordinator(false)} />
      )}
    </div>
  )
}
