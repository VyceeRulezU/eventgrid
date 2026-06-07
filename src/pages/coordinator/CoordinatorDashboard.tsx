import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar, CheckSquare, Radio, AlertTriangle,
  Clock, ChevronRight, Activity, ListChecks,
  CheckCircle2, Flag, Users, Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { Pagination } from '@/components/ui/Pagination'
import { SEO } from '@/components/shared/SEO'
import type { Event, EventPhase, Task } from '@/types'
import styles from './CoordinatorDashboard.module.css'

const ACTIVITY_PAGE_SIZE = 5

interface AssignedEvent extends Event {
  phases?: EventPhase[]
  taskCount?: number
  overdueCount?: number
}

interface TaskWithEvent extends Task {
  event?: { name: string } | null
}

interface ActivityItem {
  id: string
  type: 'task_updated' | 'phase_completed' | 'event_active'
  typeLabel: string
  desc: string
  subDesc?: string
  status?: string
  statusColor?: 'green' | 'yellow' | 'red' | 'grey'
  eventName?: string
  timestamp: string
  link?: string
  icon: typeof Activity
  color: string
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatEventType(type: string | null | undefined): string {
  if (!type) return '—'
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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

interface StatConfig {
  label: string
  value: number
  data: { value: number }[]
  positive: boolean | null
  color?: string
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

function getCurrentPhaseName(event: AssignedEvent): string {
  const phases = event.phases || []
  if (event.current_phase && phases.length > 0) {
    return phases[event.current_phase - 1]?.phase_name || `Phase ${event.current_phase}`
  }
  return '—'
}

export function CoordinatorDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const profile = useAuthStore((s) => s.profile)

  const [events, setEvents] = useState<AssignedEvent[]>([])
  const [myTasks, setMyTasks] = useState<TaskWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activityPage, setActivityPage] = useState(1)
  const [stats, setStats] = useState({
    totalEvents: 0,
    openTasks: 0,
    overdueTasks: 0,
    openIssues: 0,
  })
  const [timeline, setTimeline] = useState({
    events: [] as { value: number }[],
    tasks: [] as { value: number }[],
  })

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Coordinator'
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function load() {
      if (!user) return
      const userId = user.id
      const today = new Date().toISOString()

      // Fetch event access records for this user
      const { data: accessData } = await supabase
        .from('event_access')
        .select('event_id')
        .eq('user_id', userId)

      const eventIds = (accessData || []).map(a => a.event_id)

      const orConditions = [`coordinator_id.eq.${userId}`]
      if (org?.id) {
        orConditions.push(`org_id.eq.${org.id}`)
      }
      if (eventIds.length > 0) {
        orConditions.push(`id.in.(${eventIds.join(',')})`)
      }

      const { data: evts } = await supabase
        .from('events')
        .select('*')
        .or(orConditions.join(','))
        .is('deleted_at', null)
        .order('event_date', { ascending: true })

      if (!evts) { setLoading(false); return }

      const eventsWithDetails: AssignedEvent[] = await Promise.all(
        evts.map(async (ev) => {
          const [{ data: phases }, { count: tasks }, { count: overdue }] = await Promise.all([
            supabase.from('event_phases').select('*').eq('event_id', ev.id).order('phase_number'),
            supabase.from('tasks').select('id', { count: 'exact' }).eq('event_id', ev.id).neq('status', 'done'),
            supabase.from('tasks').select('id', { count: 'exact' }).eq('event_id', ev.id).neq('status', 'done').lte('due_datetime', today),
          ])
          return { ...ev, phases: phases || [], taskCount: tasks || 0, overdueCount: overdue || 0 } as AssignedEvent
        })
      )

      setEvents(eventsWithDetails)

      // My tasks (assigned to me)
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*, event:events(name)')
        .eq('assignee_id', userId)
        .neq('status', 'done')
        .order('due_datetime', { ascending: true })
        .limit(20)

      if (taskData) setMyTasks(taskData as unknown as TaskWithEvent[])

      const { count: openTasksCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('assignee_id', userId)
        .neq('status', 'done')

      const { count: overdueCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('assignee_id', userId)
        .neq('status', 'done')
        .lte('due_datetime', today)

      const { count: issueCount } = await supabase
        .from('issues')
        .select('id', { count: 'exact' })
        .is('resolved_at', null)

      setStats({
        totalEvents: evts.length,
        openTasks: openTasksCount || 0,
        overdueTasks: overdueCount || 0,
        openIssues: issueCount || 0,
      })

      // Timeline bins (6 months)
      const sixMos = new Date()
      sixMos.setMonth(sixMos.getMonth() - 5)
      sixMos.setDate(1)
      sixMos.setHours(0, 0, 0, 0)
      const since = sixMos.toISOString()

      const [evDates, tDates] = await Promise.all([
        supabase.from('events').select('created_at').eq('org_id', org!.id).is('deleted_at', null).gte('created_at', since),
        supabase.from('tasks').select('created_at').eq('assignee_id', userId).gte('created_at', since),
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
      })

      setLoading(false)
    }

    load()
  }, [user, org])

  // Build activity from events + tasks
  const activities = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = []

    for (const ev of events) {
      items.push({
        id: `evt-${ev.id}`,
        type: 'event_active',
        typeLabel: 'Event',
        desc: ev.name,
        subDesc: `${formatEventType(ev.event_type)} · ${ev.venue_name || 'Venue TBD'}`,
        status: ev.status ? ev.status.replace(/_/g, ' ') : 'draft',
        statusColor: ev.status === 'active' || ev.status === 'in_progress' || ev.status === 'completed' ? 'green' : 'grey',
        eventName: ev.name,
        timestamp: ev.updated_at || ev.created_at,
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
          subDesc: `Phase ${latest.phase_number} of ${ev.phases?.length || 9} done`,
          status: 'completed',
          statusColor: 'green',
          eventName: ev.name,
          timestamp: latest.completed_at || ev.updated_at,
          link: `/events/${ev.id}`,
          icon: CheckCircle2,
          color: 'var(--color-success)',
        })
      }
    }

    for (const t of myTasks) {
      const dueStr = t.due_datetime ? `Due: ${formatDate(t.due_datetime)}` : 'No due date'
      const isOverdue = t.due_datetime && new Date(t.due_datetime) < new Date()
      items.push({
        id: `task-${t.id}`,
        type: 'task_updated',
        typeLabel: 'Task',
        desc: t.title,
        subDesc: dueStr,
        status: t.status ? t.status.replace(/_/g, ' ') : 'todo',
        statusColor: t.status === 'done' ? 'green' : isOverdue ? 'red' : t.status === 'in_progress' ? 'yellow' : 'grey',
        eventName: (t.event as any)?.name,
        timestamp: t.updated_at || t.created_at,
        link: t.event_id ? `/events/${t.event_id}/tasks` : undefined,
        icon: ListChecks,
        color: isOverdue ? 'var(--color-error)' : t.status === 'in_progress' ? 'var(--color-warning)' : 'var(--color-text-muted)',
      })
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return items
  }, [events, myTasks])

  const activityTotalPages = Math.max(1, Math.ceil(activities.length / ACTIVITY_PAGE_SIZE))
  const pagedActivities = activities.slice(
    (activityPage - 1) * ACTIVITY_PAGE_SIZE,
    activityPage * ACTIVITY_PAGE_SIZE
  )

  useEffect(() => {
    if (activityPage > activityTotalPages) setActivityPage(1)
  }, [activityPage, activityTotalPages])

  const statCards: StatConfig[] = [
    {
      label: 'My Projects',
      value: stats.totalEvents,
      data: timeline.events,
      positive: calcTrend(timeline.events).positive ?? true,
      clickable: true,
      onClick: () => navigate('/events'),
    },
    {
      label: 'Open Tasks',
      value: stats.openTasks,
      data: timeline.tasks,
      positive: stats.openTasks === 0,
    },
    {
      label: 'Overdue Tasks',
      value: stats.overdueTasks,
      data: timeline.tasks,
      positive: stats.overdueTasks === 0,
    },
    {
      label: 'Open Issues',
      value: stats.openIssues,
      data: timeline.tasks,
      positive: stats.openIssues === 0,
    },
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
      <SEO title="Coordinator Dashboard" description="Coordinator workspace: manage your assigned projects, tasks, and activity." />

      {/* Header */}
      <div className={styles.quickActions}>
        <div>
          <h2 className={styles.quickActionsTitle}>
            {greeting}, {displayName.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            {org?.name} · {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className={styles.quickActionsBtns}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => events[0] && navigate(`/events/${events[0].id}/tasks`)}
            disabled={events.length === 0}
          >
            <CheckSquare size={16} /> My Tasks
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => events[0] && navigate(`/events/${events[0].id}/live-board`)}
            disabled={events.length === 0}
          >
            <Radio size={16} /> Live Board
          </button>
          {events[0] && (
            <Link to={`/events/${events[0].id}`} className="btn btn-primary">
              <Zap size={16} /> Open Project
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
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
              <BarSparkline data={s.data} positive={s.positive} />
            </div>
          )
        })}
      </div>

      {/* My Projects + Shortcuts */}
      <div className={styles.twoCol}>
        {/* Projects Table */}
        <div className={styles.sectionCard} id="tour-my-projects">
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={16} style={{ color: 'var(--color-accent)' }} />
              My Projects
            </h3>
            <Link to="/events" className={styles.sectionLink}>View all →</Link>
          </div>

          {events.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__icon"><Calendar size={24} /></div>
              <div className="empty-state__title">No projects assigned</div>
              <div className="empty-state__description">Projects assigned to you will appear here</div>
            </div>
          ) : (
            <div className={styles.tableScroll}>
              <div className={styles.table}>
                <div className={`${styles.tableHead} ${styles.tableHeadProjects}`}>
                  <span>Project</span>
                  <span>Type</span>
                  <span>Date</span>
                  <span className={styles.tableHeadCenter}>Status</span>
                  <span>Current Phase</span>
                  <span className={styles.tableHeadCenter}>Tasks</span>
                </div>
                <div className={styles.tableBody}>
                  {events.slice(0, 7).map((event) => {
                    const phases = event.phases || []
                    const completed = phases.filter((p) => p.status === 'completed').length
                    return (
                      <div
                        key={event.id}
                        className={`${styles.tableRow} ${styles.tableRowProjects} ${styles.tableRowClickable}`}
                        onClick={() => navigate(`/events/${event.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                        role="button"
                        tabIndex={0}
                      >
                        <div>
                          <div className={styles.cellPrimary}>{event.name}</div>
                          <div className={styles.cellSecondary}>
                            {completed}/{phases.length || 9} phases · {event.venue_name || 'Venue TBD'}
                          </div>
                        </div>
                        <div className={styles.cellTruncate}>
                          <span className={styles.eventType}>{formatEventType(event.event_type)}</span>
                        </div>
                        <div className={styles.cellTruncate}>{formatDate(event.event_date)}</div>
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
                          {event.overdueCount! > 0 ? (
                            <span className="badge badge-red">
                              <span className="badge-dot" />
                              {event.overdueCount} overdue
                            </span>
                          ) : (
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                              {event.taskCount || 0}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className={styles.sectionCard} id="tour-shortcuts">
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Shortcuts</h3>
          </div>
          <div className={styles.shortcutList}>
            {[
              { icon: CheckSquare, label: 'My Tasks', desc: 'View tasks assigned to you', onClick: () => events[0] && navigate(`/events/${events[0].id}/tasks`), color: 'var(--color-info)' },
              { icon: Radio, label: 'Live Board', desc: 'Real-time event coordination', onClick: () => events[0] && navigate(`/events/${events[0].id}/live-board`), color: 'var(--color-success)' },
              { icon: AlertTriangle, label: 'Issues', desc: 'Open issues & blockers', onClick: () => events[0] && navigate(`/events/${events[0].id}/issues`), color: 'var(--color-warning)' },
              { icon: Clock, label: 'Timeline', desc: 'Project phases & milestones', onClick: () => events[0] && navigate(`/events/${events[0].id}/timeline`), color: 'var(--color-accent)' },
              { icon: Users, label: 'Guest Management', desc: 'Check-in, RSVPs, seating', onClick: () => events[0] && navigate(`/events/${events[0].id}/guests`), color: 'var(--color-text-secondary)' },
              { icon: Flag, label: 'Event Dashboard', desc: 'Full project overview', onClick: () => events[0] && navigate(`/events/${events[0].id}`), color: 'var(--color-text-secondary)' },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                className={styles.shortcutItem}
                onClick={action.onClick}
                disabled={events.length === 0}
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

      {/* My Tasks */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <ListChecks size={16} style={{ color: 'var(--color-info)' }} />
            My Open Tasks
          </h3>
          {events[0] && (
            <Link to={`/events/${events[0].id}/tasks`} className={styles.sectionLink}>View all →</Link>
          )}
        </div>

        {myTasks.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <div className="empty-state__icon"><CheckCircle2 size={24} /></div>
            <div className="empty-state__title">All caught up!</div>
            <div className="empty-state__description">No open tasks assigned to you right now</div>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <div className={styles.table}>
              <div className={`${styles.tableHead} ${styles.tableHeadTasks}`}>
                <span>Task</span>
                <span>Project</span>
                <span>Due Date</span>
                <span className={styles.tableHeadCenter}>Priority</span>
                <span className={styles.tableHeadCenter}>Status</span>
              </div>
              <div className={styles.tableBody}>
                {myTasks.slice(0, 7).map((task) => {
                  const isOverdue = task.due_datetime && new Date(task.due_datetime) < new Date()
                  return (
                    <div
                      key={task.id}
                      className={`${styles.tableRow} ${styles.tableRowTasks} ${task.event_id ? styles.tableRowClickable : ''}`}
                      onClick={() => task.event_id && navigate(`/events/${task.event_id}/tasks`)}
                      onKeyDown={(e) => task.event_id && e.key === 'Enter' && navigate(`/events/${task.event_id}/tasks`)}
                      role={task.event_id ? 'button' : undefined}
                      tabIndex={task.event_id ? 0 : undefined}
                    >
                      <div>
                        <div className={styles.cellPrimary}>{task.title}</div>
                        {task.description && (
                          <div className={styles.cellSecondary}>{task.description}</div>
                        )}
                      </div>
                      <div className={styles.cellTruncate}>{(task.event as any)?.name || '—'}</div>
                      <div className={`${styles.cellTruncate} ${isOverdue ? styles.cellOverdue : ''}`}>
                        {task.due_datetime ? formatDate(task.due_datetime) : '—'}
                        {isOverdue && <span className={styles.overdueTag}> Overdue</span>}
                      </div>
                      <div className={styles.cellCenter}>
                        {task.priority ? (
                          <span className={`${styles.taskPriority} ${
                            task.priority === 'high' ? styles.priorityHigh
                            : task.priority === 'medium' ? styles.priorityMedium
                            : styles.priorityLow
                          }`}>
                            {task.priority}
                          </span>
                        ) : <span className={styles.cellTruncate}>—</span>}
                      </div>
                      <div className={styles.cellCenter}>
                        <span className={`badge badge-${
                          task.status === 'done' ? 'green'
                          : task.status === 'in_progress' ? 'yellow'
                          : 'grey'
                        }`}>
                          <span className="badge-dot" />
                          {task.status?.replace('_', ' ') || 'todo'}
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
            <div className="empty-state__description">Activities will appear here as you manage projects</div>
          </div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <div className={styles.table}>
                <div className={`${styles.tableHead} ${styles.tableHeadActivity}`}>
                  <span />
                  <span>Type</span>
                  <span>Activity</span>
                  <span>Project</span>
                  <span className={styles.tableHeadCenter}>Status</span>
                  <span className={styles.tableHeadRight}>When</span>
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
                      <div className={styles.activityTypeText}>{act.typeLabel}</div>
                      <div className={styles.activityDesc}>
                        <div className={styles.cellPrimary}>{act.desc}</div>
                        {act.subDesc && <div className={styles.cellSecondary}>{act.subDesc}</div>}
                      </div>
                      <div className={styles.cellTruncate}>{act.eventName || '—'}</div>
                      <div className={styles.cellCenter}>
                        <span className={`badge badge-${act.statusColor || 'grey'}`}>
                          <span className="badge-dot" />
                          {act.status}
                        </span>
                      </div>
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
    </div>
  )
}
